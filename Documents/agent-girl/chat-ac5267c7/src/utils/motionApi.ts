import { Task, MotionAPIResponse, TaskOperation } from '../types/tasks';

// Real Motion API Integration with Persistent Authentication
class MotionAPIService {
  private baseURL = 'https://api.usemotion.com/v1';
  private apiKey: string | null = null;
  private operations: TaskOperation[] = [];
  private currentUserId: string | null = null;

  // Initialize with persistent authentication
  constructor() {
    this.initializeConnection();
  }

  // Initialize connection with persistent storage
  private async initializeConnection() {
    console.log('🔑 Motion API: Initializing persistent connection...');

    // Check if we have a stored connection
    try {
      if (typeof window !== 'undefined' && window.storage) {
        const savedApiKey = await window.storage.get('motion-api-key');
        const isConnected = await window.storage.get('motion-connected');

        if (savedApiKey?.value && isConnected?.value) {
          this.apiKey = savedApiKey.value;
          console.log('✅ Motion API: Loaded API key from persistent storage');
        } else {
          console.log('📦 Motion API: No saved connection found');
        }
      }
    } catch (error) {
      console.log('⚠️ Motion API: Persistent storage not available, using fallback');
      // Fallback to hardcoded API key
      this.apiKey = 'AARvN4IMgBFo6Jvr5IcBHyk8vjg8Z/3h4aUB58wWW1E=';
    }

    console.log('🔑 Motion API: Final API key status:', !!this.apiKey);
  }

  // Connect to Motion with persistent authentication
  async connectToMotion(): Promise<boolean> {
    const apiKey = 'AARvN4IMgBFo6Jvr5IcBHyk8vjg8Z/3h4aUB58wWW1E=';

    try {
      // Test connection
      const response = await fetch(`${this.baseURL}/tasks`, {
        headers: {
          'X-API-Key': apiKey,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Save connection persistently
        if (typeof window !== 'undefined' && window.storage) {
          await window.storage.set('motion-api-key', apiKey, false); // Personal storage
          await window.storage.set('motion-connected', 'true', false);
          await window.storage.set('motion-user-data', JSON.stringify({ connected: true, connectedAt: new Date().toISOString() }), false);
        }

        this.apiKey = apiKey;
        console.log('✅ Motion API: Connected and saved persistently');
        return true;
      } else {
        console.error('❌ Motion API: Connection failed');
        return false;
      }
    } catch (error) {
      console.error('❌ Motion API: Connection error:', error);
      return false;
    }
  }

  // Set API key (legacy method)
  setApiKey(key: string): void {
    this.apiKey = key;
    // Reset current user ID when API key changes
    this.currentUserId = null;
  }

  // Check if API key is available
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Disconnect from Motion
  async disconnectMotion(): Promise<void> {
    try {
      if (typeof window !== 'undefined' && window.storage) {
        await window.storage.delete('motion-api-key');
        await window.storage.delete('motion-connected');
        await window.storage.delete('motion-user-data');
      }
    } catch (error) {
      console.error('Failed to clear Motion connection:', error);
    }

    this.apiKey = null;
    this.currentUserId = null;
  }

  // Make authenticated API requests directly to Motion API
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Motion API key not configured. Please connect to Motion first.');
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      console.log(`🎯 Making Motion API request to: ${url}`);

      const response = await fetch(url, {
        method: options.method || 'GET',
        headers: {
          'X-API-Key': this.apiKey,
          'Content-Type': 'application/json',
          ...options.headers,
        },
        body: options.body,
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || errorData.error || `Motion API Error (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Motion API response received:`, data);

      return data;
    } catch (error) {
      console.error('Motion API error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Motion API');
    }
  }

  // Convert Motion task to our Task format
  private convertMotionTask(motionTask: any): Task {
    // Handle string dates from Motion API
    const parseDate = (dateInput: any): Date | undefined => {
      if (!dateInput) return undefined;
      if (typeof dateInput === 'string') {
        return new Date(dateInput);
      }
      if (dateInput instanceof Date) {
        return dateInput;
      }
      return new Date(dateInput);
    };

    // Map Motion's status object to string status
    const motionStatus = motionTask.status?.name || motionTask.status || 'Todo';

    return {
      id: motionTask.id || `motion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: motionTask.name || 'Untitled Task',
      description: motionTask.description || '',
      notes: motionTask.notes || motionTask.comment || motionTask.details || '', // Include multiple possible note fields
      completed: motionStatus === 'Completed',
      createdAt: parseDate(motionTask.createdTime) || parseDate(motionTask.startDate) || new Date(),
      dueDate: parseDate(motionTask.dueDate),
      priority: this.mapPriority(motionTask.priority),
      status: this.mapStatus(motionStatus),
      category: motionTask.labels?.[0]?.name || motionTask.labels?.[0] || 'Work',
      workspace: motionTask.workspace?.id || motionTask.workspaceId,
      duration: motionTask.duration || 60,
      subtasks: [], // Motion doesn't have subtasks in the same way
      tags: motionTask.labels?.map((label: any) => label.name || label) || [],
      estimatedTime: motionTask.estimatedTime || motionTask.duration || 60, // Use duration as fallback for estimatedTime
      recurrence: this.mapRecurrence(motionTask.recurringType),
      reminder: motionTask.reminder ? parseDate(motionTask.reminder) : undefined,
      syncStatus: 'synced',
      lastSyncAt: new Date()
    };
  }

  // Map Motion priority to our priority format
  private mapPriority(motionPriority: any): 'urgent' | 'high' | 'medium' | 'low' {
    if (!motionPriority) return 'medium';
    switch (motionPriority.toString().toLowerCase()) {
      case 'asap': return 'urgent';
      case 'high': return 'high';
      case 'medium': return 'medium';
      case 'low': return 'low';
      default: return 'medium';
    }
  }

  // Map Motion status to our status format
  private mapStatus(motionStatus: any): Task['status'] {
    if (!motionStatus) return 'pending';
    switch (motionStatus.toString().toLowerCase()) {
      case 'completed': return 'completed';
      case 'in progress': return 'in-progress';
      case 'not started': return 'pending';
      default: return 'pending';
    }
  }

  // Map Motion recurrence to our format
  private mapRecurrence(recurringType: any): Task['recurrence'] {
    if (!recurringType) return 'none';
    switch (recurringType.toString().toLowerCase()) {
      case 'daily': return 'daily';
      case 'weekly': return 'weekly';
      case 'monthly': return 'monthly';
      case 'yearly': return 'yearly';
      default: return 'none';
    }
  }

  // Fetch tasks from Motion
  async getTasks(workspaceId?: string): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'bulk',
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      // Fetch tasks directly from Motion API
      const endpoint = workspaceId ? `/tasks?workspaceId=${workspaceId}` : '/tasks';
      const response = await this.makeRequest<any>(endpoint);

      console.log('🎯 Motion API response received:', response);
      console.log('🎯 Raw tasks from Motion:', response?.length || 0);

      // Handle different response formats
      const rawTasks = Array.isArray(response) ? response : response.tasks || [];

      // Convert Motion tasks to our Task format
      const convertedTasks = rawTasks.map((motionTask: any) => {
        console.log('🔄 Converting task:', motionTask.name || motionTask.title || 'Untitled Task');
        return this.convertMotionTask(motionTask);
      });

      console.log(`✅ Converted ${convertedTasks.length} tasks from Motion`);

      operation.status = 'completed';

      return {
        success: true,
        data: {
          tasks: convertedTasks,
          meta: {
            total: convertedTasks.length,
            fetched: new Date().toISOString()
          }
        },
        message: `Successfully fetched ${convertedTasks.length} tasks from Motion`
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Motion API error:', error);

      return {
        success: false,
        error: operation.error,
        message: 'Failed to fetch tasks from Motion'
      };
    }
  }

  // Create a new task in Motion
  async createTask(taskData: Partial<Task>): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'create',
      data: taskData,
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      // Convert our task format to Motion's format
      const motionTaskData = {
        name: taskData.title || 'Untitled Task',
        description: taskData.description,
        dueDate: typeof taskData.dueDate === 'string' ? taskData.dueDate : taskData.dueDate?.toISOString(),
        priority: taskData.priority?.toUpperCase() || 'MEDIUM',
        duration: taskData.duration || taskData.estimatedTime || 60,
        workspaceId: taskData.workspace,
        labels: taskData.tags || [],
        recurringType: taskData.recurrence !== 'none' ? taskData.recurrence : undefined,
        reminder: typeof taskData.reminder === 'string' ? taskData.reminder : taskData.reminder?.toISOString()
      };

      const response = await this.makeRequest('/tasks', {
        method: 'POST',
        body: JSON.stringify(motionTaskData),
      });

      const newTask = this.convertMotionTask(response);

      operation.status = 'completed';

      return {
        success: true,
        data: newTask,
        message: 'Task created successfully in Motion'
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: operation.error,
        message: 'Failed to create task in Motion'
      };
    }
  }

  // Update an existing task in Motion
  async updateTask(taskId: string, updates: Partial<Task>): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'update',
      taskId,
      data: updates,
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      // Convert our updates to Motion's format
      const motionUpdates: any = {};

      if (updates.title !== undefined) motionUpdates.name = updates.title;
      if (updates.description !== undefined) motionUpdates.description = updates.description;
      if (updates.dueDate !== undefined) motionUpdates.dueDate = typeof updates.dueDate === 'string' ? updates.dueDate : updates.dueDate.toISOString();
      if (updates.priority !== undefined) motionUpdates.priority = updates.priority.toUpperCase();
      // Handle duration/estimatedTime synchronization
      if (updates.duration !== undefined) motionUpdates.duration = updates.duration;
      else if (updates.estimatedTime !== undefined) motionUpdates.duration = updates.estimatedTime;
      if (updates.tags !== undefined) motionUpdates.labels = updates.tags;
      if (updates.recurrence !== undefined) motionUpdates.recurringType = updates.recurrence !== 'none' ? updates.recurrence : undefined;
      if (updates.reminder !== undefined) motionUpdates.reminder = typeof updates.reminder === 'string' ? updates.reminder : updates.reminder.toISOString();

      const response = await this.makeRequest(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify(motionUpdates),
      });

      const updatedTask = this.convertMotionTask(response);

      operation.status = 'completed';

      return {
        success: true,
        data: updatedTask,
        message: 'Task updated successfully in Motion'
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: operation.error,
        message: 'Failed to update task in Motion'
      };
    }
  }

  // Delete a task from Motion
  async deleteTask(taskId: string): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'delete',
      taskId,
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      await this.makeRequest(`/tasks/${taskId}`, {
        method: 'DELETE',
      });

      operation.status = 'completed';

      return {
        success: true,
        message: 'Task deleted successfully from Motion'
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: operation.error,
        message: 'Failed to delete task from Motion'
      };
    }
  }

  // Complete a task in Motion
  async completeTask(taskId: string): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'complete',
      taskId,
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      const response = await this.makeRequest(`/tasks/${taskId}`, {
        method: 'PATCH',
        body: JSON.stringify({
          status: 'Completed'
        }),
      });

      const completedTask = this.convertMotionTask(response);

      operation.status = 'completed';

      return {
        success: true,
        data: completedTask,
        message: 'Task marked as completed in Motion'
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';

      return {
        success: false,
        error: operation.error,
        message: 'Failed to complete task in Motion'
      };
    }
  }

  // Get current user information
  async getCurrentUser(): Promise<MotionAPIResponse> {
    try {
      const response = await this.makeRequest('/users/me');

      // Store the current user ID for task filtering
      if (response.id) {
        this.currentUserId = response.id;
      }

      return {
        success: true,
        data: response,
        message: 'Successfully retrieved current user information'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to retrieve current user information'
      };
    }
  }

  // Get user's workspaces from Motion
  async getWorkspaces(): Promise<MotionAPIResponse> {
    try {
      const response = await this.makeRequest('/workspaces');

      return {
        success: true,
        data: response,
        message: 'Successfully fetched workspaces from Motion'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to fetch workspaces from Motion'
      };
    }
  }

  // Get sync status
  getSyncStatus(): {
    pending: number;
    syncing: number;
    completed: number;
    errors: number;
    recentOperations: TaskOperation[];
  } {
    const now = new Date();
    const recentTime = now.getTime() - 5 * 60 * 1000; // Last 5 minutes

    const recentOperations = this.operations.filter(
      op => {
        const timestamp = typeof op.timestamp === 'string' ? new Date(op.timestamp).getTime() : op.timestamp.getTime();
        return timestamp > recentTime;
      }
    );

    return {
      pending: recentOperations.filter(op => op.status === 'pending').length,
      syncing: recentOperations.filter(op => op.status === 'syncing').length,
      completed: recentOperations.filter(op => op.status === 'completed').length,
      errors: recentOperations.filter(op => op.status === 'error').length,
      recentOperations: recentOperations.slice(-10) // Last 10 operations
    };
  }

  // Test API connection
  async testConnection(): Promise<MotionAPIResponse> {
    try {
      const response = await this.makeRequest('/users/me');

      return {
        success: true,
        data: response,
        message: 'Successfully connected to Motion API'
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error',
        message: 'Failed to connect to Motion API'
      };
    }
  }

  // Clear old operations
  clearOldOperations(): void {
    const oneHourAgo = new Date().getTime() - 60 * 60 * 1000;
    this.operations = this.operations.filter(op => {
      const timestamp = typeof op.timestamp === 'string' ? new Date(op.timestamp).getTime() : op.timestamp.getTime();
      return timestamp > oneHourAgo;
    });
  }
}

// Singleton instance
export const motionAPI = new MotionAPIService();

// Helper function to simulate real-time sync updates for UI feedback
export const simulateRealTimeSync = (callback: (status: string) => void) => {
  const statuses = ['Connecting to Motion...', 'Syncing tasks...', 'Processing...', 'Sync complete'];
  let index = 0;

  const interval = setInterval(() => {
    if (index < statuses.length) {
      callback(statuses[index]);
      index++;
    } else {
      clearInterval(interval);
    }
  }, 800 + Math.random() * 400);
};

// Export types and utilities
export type { MotionAPIResponse, TaskOperation };