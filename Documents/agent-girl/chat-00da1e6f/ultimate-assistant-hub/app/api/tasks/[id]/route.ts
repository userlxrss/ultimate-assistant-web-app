import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, createNotFoundResponse, handleApiError, validateId } from '@/utils/api-response';
import { validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';

export const GET = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Task');
    }

    const task = await db.task.findFirst({
      where: {
        id,
        userId: user.id
      },
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        estimatedTime: true,
        actualTime: true,
        motionTaskId: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    if (!task) {
      return createNotFoundResponse('Task');
    }

    return createSuccessResponse(task);

  } catch (error) {
    return handleApiError(error);
  }
});

export const PUT = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Task');
    }

    const { data, error } = await validateRequest(request, validationSchemas.updateTask);

    if (error) {
      return error;
    }

    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: { id, userId: user.id }
    });

    if (!existingTask) {
      return createNotFoundResponse('Task');
    }

    // Auto-set completedAt when status changes to COMPLETED
    if (data.status === 'COMPLETED' && existingTask.status !== 'COMPLETED') {
      data.completedAt = new Date();
    } else if (data.status !== 'COMPLETED' && existingTask.status === 'COMPLETED') {
      data.completedAt = null;
    }

    const updatedTask = await db.task.update({
      where: { id },
      data,
      select: {
        id: true,
        title: true,
        description: true,
        status: true,
        priority: true,
        dueDate: true,
        completedAt: true,
        estimatedTime: true,
        actualTime: true,
        motionTaskId: true,
        tags: true,
        createdAt: true,
        updatedAt: true
      }
    });

    // Sync with Motion.so if there's a motionTaskId
    if (updatedTask.motionTaskId && process.env.MOTION_API_KEY) {
      try {
        await syncTaskWithMotion(updatedTask);
      } catch (motionError) {
        console.error('Failed to sync with Motion:', motionError);
      }
    }

    return createSuccessResponse(updatedTask);

  } catch (error) {
    return handleApiError(error);
  }
});

export const DELETE = withAuth(async (request: NextRequest, { user }: { user: any }) => {
  try {
    const url = new URL(request.url);
    const pathParts = url.pathname.split('/');
    const id = pathParts[pathParts.length - 1];

    if (!validateId(id)) {
      return createNotFoundResponse('Task');
    }

    // Check if task exists and belongs to user
    const existingTask = await db.task.findFirst({
      where: { id, userId: user.id },
      select: { motionTaskId: true }
    });

    if (!existingTask) {
      return createNotFoundResponse('Task');
    }

    // Delete from Motion.so if there's a motionTaskId
    if (existingTask.motionTaskId && process.env.MOTION_API_KEY) {
      try {
        await deleteTaskFromMotion(existingTask.motionTaskId);
      } catch (motionError) {
        console.error('Failed to delete from Motion:', motionError);
      }
    }

    await db.task.delete({
      where: { id }
    });

    return createSuccessResponse({ deleted: true });

  } catch (error) {
    return handleApiError(error);
  }
});

async function syncTaskWithMotion(task: any): Promise<void> {
  try {
    const motionData = {
      name: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: mapPriorityToMotion(task.priority),
      estimatedDuration: task.estimatedTime,
      status: mapStatusToMotion(task.status),
      tags: task.tags
    };

    await fetch(`https://api.usemotion.com/v1/tasks/${task.motionTaskId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.MOTION_API_KEY!
      },
      body: JSON.stringify(motionData)
    });
  } catch (error) {
    console.error('Motion sync error:', error);
    throw error;
  }
}

async function deleteTaskFromMotion(motionTaskId: string): Promise<void> {
  try {
    await fetch(`https://api.usemotion.com/v1/tasks/${motionTaskId}`, {
      method: 'DELETE',
      headers: {
        'X-API-Key': process.env.MOTION_API_KEY!
      }
    });
  } catch (error) {
    console.error('Motion delete error:', error);
    throw error;
  }
}

function mapPriorityToMotion(priority: string): string {
  const priorityMap: Record<string, string> = {
    'LOW': 'low',
    'MEDIUM': 'medium',
    'HIGH': 'high',
    'URGENT': 'urgent'
  };
  return priorityMap[priority] || 'medium';
}

function mapStatusToMotion(status: string): string {
  const statusMap: Record<string, string> = {
    'TODO': 'todo',
    'IN_PROGRESS': 'in-progress',
    'COMPLETED': 'completed',
    'CANCELLED': 'cancelled'
  };
  return statusMap[status] || 'todo';
}