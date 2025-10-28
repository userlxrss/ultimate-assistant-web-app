import { Task, MotionAPIResponse, TaskOperation } from '../types/tasks';

// Real Motion API Integration
class MotionAPIService {
  private baseURL = 'https://api.usemotion.com/v1';
  private apiKey: string | null = null;
  private operations: TaskOperation[] = [];
  private currentUserId: string | null = null;

  // Initialize with API key from environment or localStorage
  constructor() {
    // Priority 1: Environment variable (your API key)
    // In Vite, environment variables are accessed via import.meta.env
    if (import.meta.env.VITE_MOTION_API_KEY) {
      this.apiKey = import.meta.env.VITE_MOTION_API_KEY;
      // Store in localStorage for persistence
      if (typeof window !== 'undefined') {
        localStorage.setItem('motion_api_key', this.apiKey);
      }
    }
    // Fallback: Check localStorage
    else if (typeof window !== 'undefined') {
      this.apiKey = localStorage.getItem('motion_api_key');
    }
  }

  // Set API key
  setApiKey(key: string): void {
    this.apiKey = key;
    if (typeof window !== 'undefined') {
      localStorage.setItem('motion_api_key', key);
    }
    // Reset current user ID when API key changes
    this.currentUserId = null;
  }

  // Check if API key is available
  hasApiKey(): boolean {
    return !!this.apiKey;
  }

  // Clear API key
  clearApiKey(): void {
    this.apiKey = null;
    if (typeof window !== 'undefined') {
      localStorage.removeItem('motion_api_key');
    }
  }

  // Make authenticated API requests (using proxy to avoid CORS)
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!this.apiKey) {
      throw new Error('Motion API key not configured. Please connect your Motion account in Settings.');
    }

    // Use our proxy endpoint to avoid CORS issues
    const proxyUrl = 'http://localhost:3013/api/motion/tasks';

    try {
      console.log('🎯 Making Motion API request via proxy...');

      const response = await fetch(proxyUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          apiKey: this.apiKey
        })
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.message || `Motion API Error (${response.status})`;
        throw new Error(errorMessage);
      }

      const data = await response.json();
      console.log(`✅ Motion API proxy response received:`, data);

      if (!data.success) {
        throw new Error(data.message || 'Motion API request failed');
      }

      return data;
    } catch (error) {
      console.error('Motion API proxy error:', error);
      if (error instanceof Error) {
        throw error;
      }
      throw new Error('Failed to connect to Motion API via proxy');
    }
  }

  // Convert Motion task to our Task format
  private convertMotionTask(motionTask: any): Task {
    return {
      id: motionTask.id || `motion_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      title: motionTask.name || 'Untitled Task',
      description: motionTask.description || '',
      completed: motionTask.status === 'Completed',
      createdAt: new Date(motionTask.startDate || motionTask.createdAt || Date.now()),
      dueDate: motionTask.dueDate ? new Date(motionTask.dueDate) : undefined,
      priority: this.mapPriority(motionTask.priority),
      status: this.mapStatus(motionTask.status),
      category: motionTask.labels?.[0] || 'Work',
      workspace: motionTask.workspaceId,
      duration: motionTask.duration || 60,
      subtasks: [], // Motion doesn't have subtasks in the same way
      tags: motionTask.labels || [],
      estimatedTime: motionTask.estimatedTime || motionTask.duration || 60, // Use duration as fallback for estimatedTime
      recurrence: this.mapRecurrence(motionTask.recurringType),
      reminder: motionTask.reminder ? new Date(motionTask.reminder) : undefined,
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

      // Use our proxy which handles all the Motion API details
      const response = await this.makeRequest<any>('');

      const tasks = response.data?.tasks || [];

      operation.status = 'completed';

      return {
        success: true,
        data: {
          tasks,
          meta: response.meta
        },
        message: `Successfully fetched ${tasks.length} tasks assigned to you from Motion`
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';

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
        dueDate: taskData.dueDate?.toISOString(),
        priority: taskData.priority?.toUpperCase() || 'MEDIUM',
        duration: taskData.duration || taskData.estimatedTime || 60,
        workspaceId: taskData.workspace,
        labels: taskData.tags || [],
        recurringType: taskData.recurrence !== 'none' ? taskData.recurrence : undefined,
        reminder: taskData.reminder?.toISOString()
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
      if (updates.dueDate !== undefined) motionUpdates.dueDate = updates.dueDate.toISOString();
      if (updates.priority !== undefined) motionUpdates.priority = updates.priority.toUpperCase();
      // Handle duration/estimatedTime synchronization
      if (updates.duration !== undefined) motionUpdates.duration = updates.duration;
      else if (updates.estimatedTime !== undefined) motionUpdates.duration = updates.estimatedTime;
      if (updates.tags !== undefined) motionUpdates.labels = updates.tags;
      if (updates.recurrence !== undefined) motionUpdates.recurringType = updates.recurrence !== 'none' ? updates.recurrence : undefined;
      if (updates.reminder !== undefined) motionUpdates.reminder = updates.reminder.toISOString();

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
      op => op.timestamp.getTime() > recentTime
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
    this.operations = this.operations.filter(op => op.timestamp.getTime() > oneHourAgo);
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