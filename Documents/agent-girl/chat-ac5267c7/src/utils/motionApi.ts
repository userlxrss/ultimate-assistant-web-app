import { Task, MotionAPIResponse, TaskOperation } from '../types/tasks';
import { motionOAuthService } from './motionOAuth';

// Real Motion API Integration with OAuth Authentication
class MotionAPIService {
  private baseURL = 'https://api.usemotion.com/v1';
  private operations: TaskOperation[] = [];
  private currentUserId: string | null = null;

  // Initialize with OAuth authentication
  constructor() {
    this.initializeConnection();
  }

  // Initialize connection with OAuth
  private async initializeConnection() {
    console.log('🔑 Motion API: Initializing OAuth connection...');

    // Check if we have OAuth tokens
    if (motionOAuthService.isAuthenticated()) {
      const user = motionOAuthService.getCurrentUser();
      if (user) {
        this.currentUserId = user.id;
        console.log('✅ Motion API: OAuth authenticated for user:', user.email);
      }
    } else {
      console.log('📦 Motion API: No OAuth authentication found');
    }
  }

  // Connect to Motion with OAuth
  async connectToMotion(): Promise<boolean> {
    try {
      // Initiate OAuth flow
      await motionOAuthService.initiateOAuth();

      // Get current user after OAuth
      const user = motionOAuthService.getCurrentUser();
      if (user) {
        this.currentUserId = user.id;
        console.log('✅ Motion API: OAuth connected successfully for user:', user.email);
        return true;
      } else {
        console.error('❌ Motion API: OAuth completed but no user info available');
        return false;
      }
    } catch (error) {
      console.error('❌ Motion API: OAuth connection error:', error);
      return false;
    }
  }

  // Check if authenticated with OAuth
  isAuthenticated(): boolean {
    return motionOAuthService.isAuthenticated();
  }

  // Disconnect from Motion
  async disconnectMotion(): Promise<void> {
    try {
      await motionOAuthService.disconnect();
      this.currentUserId = null;
      console.log('✅ Motion API: Disconnected successfully');
    } catch (error) {
      console.error('Failed to disconnect Motion:', error);
    }
  }

  // Make authenticated API requests using OAuth tokens
  private async makeRequest<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
    if (!motionOAuthService.isAuthenticated()) {
      throw new Error('Motion OAuth not authenticated. Please connect to Motion first.');
    }

    const url = `${this.baseURL}${endpoint}`;

    try {
      console.log(`🎯 Making Motion API request to: ${url}`);

      const response = await motionOAuthService.makeAuthenticatedRequest(url, {
        method: options.method || 'GET',
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

  // Fetch ONLY user's personal tasks from Motion (CRITICAL REQUIREMENT)
  async getTasks(workspaceId?: string): Promise<MotionAPIResponse> {
    const operation: TaskOperation = {
      type: 'bulk',
      timestamp: new Date(),
      status: 'pending'
    };

    this.operations.push(operation);

    try {
      operation.status = 'syncing';

      // CRITICAL: Filter for ONLY the authenticated user's personal tasks
      // This ensures we don't fetch teammates' or shared workspace tasks
      const currentUser = motionOAuthService.getCurrentUser();
      if (!currentUser) {
        throw new Error('No authenticated Motion user found');
      }

      // Build query parameters to filter for personal tasks only
      const params = new URLSearchParams();

      // Add user filter to get only current user's tasks
      if (currentUser.id) {
        params.append('userId', currentUser.id);
      }

      // Add workspace filter if provided
      if (workspaceId) {
        params.append('workspaceId', workspaceId);
      }

      // Add additional filters to ensure only personal tasks
      params.append('includeAssigned', 'true');      // Only tasks assigned to user
      params.append('includeCreated', 'true');       // Tasks created by user
      params.append('includeShared', 'false');       // Exclude shared/team tasks
      params.append('excludeTeammate', 'true');      // CRITICAL: Exclude teammates' tasks

      const endpoint = `/tasks?${params.toString()}`;
      console.log('🎯 Fetching personal tasks for user:', currentUser.email, 'Endpoint:', endpoint);

      const response = await this.makeRequest<any>(endpoint);

      console.log('🎯 Motion API response received:', response);
      console.log('🎯 Raw personal tasks from Motion:', response?.length || 0);

      // Handle different response formats
      const rawTasks = Array.isArray(response) ? response : response.tasks || [];

      // CRITICAL: Additional client-side filtering to ensure only user's tasks
      const personalTasks = rawTasks.filter((task: any) => {
        // Filter by assigned user
        if (task.assignedTo && task.assignedTo !== currentUser.id) {
          return false;
        }

        // Filter by created user
        if (task.createdBy && task.createdBy !== currentUser.id) {
          return false;
        }

        // Exclude team/shared tasks
        if (task.isTeamTask || task.isSharedTask) {
          return false;
        }

        return true;
      });

      console.log(`✅ Filtered to ${personalTasks.length} personal tasks from ${rawTasks.length} total tasks`);

      // Convert Motion tasks to our Task format
      const convertedTasks = personalTasks.map((motionTask: any) => {
        console.log('🔄 Converting personal task:', motionTask.name || motionTask.title || 'Untitled Task');
        return this.convertMotionTask(motionTask);
      });

      console.log(`✅ Converted ${convertedTasks.length} personal tasks from Motion`);

      operation.status = 'completed';

      return {
        success: true,
        data: {
          tasks: convertedTasks,
          meta: {
            total: convertedTasks.length,
            fetched: new Date().toISOString(),
            userId: currentUser.id,
            userEmail: currentUser.email
          }
        },
        message: `Successfully fetched ${convertedTasks.length} personal tasks from Motion`
      };
    } catch (error) {
      operation.status = 'error';
      operation.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('❌ Motion API error:', error);

      return {
        success: false,
        error: operation.error,
        message: 'Failed to fetch personal tasks from Motion'
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
        message: 'Failed to delete task in Motion'
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
      const user = motionOAuthService.getCurrentUser();

      if (user) {
        this.currentUserId = user.id;
        return {
          success: true,
          data: user,
          message: 'Successfully retrieved current user information'
        };
      } else {
        return {
          success: false,
          error: 'No authenticated user found',
          message: 'Failed to retrieve current user information'
        };
      }
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
      const user = motionOAuthService.getCurrentUser();

      if (user) {
        return {
          success: true,
          data: user,
          message: 'Successfully connected to Motion API via OAuth'
        };
      } else {
        return {
          success: false,
          error: 'OAuth not authenticated',
          message: 'Failed to connect to Motion API'
        };
      }
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