import { NextRequest } from 'next/server';
import { withAuth } from '@/middleware/auth';
import { db } from '@/lib/db';
import { createSuccessResponse, handleApiError } from '@/utils/api-response';
import { validateQueryParams, validateRequest } from '@/utils/validation';
import { validationSchemas } from '@/validations';
import { paginationHelper } from '@/utils/pagination';

export const GET = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { searchParams } = new URL(request.url);
    const { data: filters, error } = validateQueryParams(searchParams, validationSchemas.taskFilters);

    if (error) {
      return error;
    }

    const {
      page,
      limit,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      search,
      status,
      priority,
      dueDateFrom,
      dueDateTo,
      tags
    } = filters;

    // Build where clause
    const where: any = { userId: user.id };

    if (search) {
      where.OR = [
        { title: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } }
      ];
    }

    if (status) {
      where.status = status;
    }

    if (priority) {
      where.priority = priority;
    }

    if (tags && tags.length > 0) {
      where.tags = { hasSome: tags };
    }

    if (dueDateFrom || dueDateTo) {
      where.dueDate = {};
      if (dueDateFrom) where.dueDate.gte = dueDateFrom;
      if (dueDateTo) where.dueDate.lte = dueDateTo;
    }

    // Get total count for pagination
    const total = await db.task.count({ where });

    // Get paginated results
    const { skip, take, paginationMeta } = paginationHelper(page, limit, total);

    const tasks = await db.task.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder },
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

    return createSuccessResponse(tasks, paginationMeta);

  } catch (error) {
    return handleApiError(error);
  }
});

export const POST = withAuth(async (request: NextRequest, { user }) => {
  try {
    const { data, error } = await validateRequest(request, validationSchemas.createTask);

    if (error) {
      return error;
    }

    const task = await db.task.create({
      data: {
        ...data,
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

    // Sync with Motion.so if API key is available
    if (process.env.MOTION_API_KEY) {
      try {
        const motionTaskId = await syncWithMotion(task);
        if (motionTaskId) {
          await db.task.update({
            where: { id: task.id },
            data: { motionTaskId }
          });
          task.motionTaskId = motionTaskId;
        }
      } catch (motionError) {
        console.error('Failed to sync with Motion:', motionError);
        // Don't fail the request, just log the error
      }
    }

    return createSuccessResponse(task, undefined, 201);

  } catch (error) {
    return handleApiError(error);
  }
});

async function syncWithMotion(task: any): Promise<string | null> {
  try {
    const motionData = {
      name: task.title,
      description: task.description,
      dueDate: task.dueDate,
      priority: mapPriorityToMotion(task.priority),
      estimatedDuration: task.estimatedTime,
      tags: task.tags
    };

    const response = await fetch('https://api.usemotion.com/v1/tasks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-API-Key': process.env.MOTION_API_KEY!
      },
      body: JSON.stringify(motionData)
    });

    if (response.ok) {
      const motionTask = await response.json();
      return motionTask.id;
    }

    return null;
  } catch (error) {
    console.error('Motion sync error:', error);
    return null;
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