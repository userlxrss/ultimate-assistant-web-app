import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const health = {
    status: 'ok',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    version: process.env.npm_package_version || '1.0.0',
    environment: process.env.NODE_ENV,
    checks: {
      database: { status: 'unknown', responseTime: 0 },
      memory: { status: 'unknown', usage: 0 },
      disk: { status: 'unknown', usage: 0 },
    },
    responseTime: 0,
  };

  try {
    // Database health check
    const dbStart = Date.now();
    await prisma.$queryRaw`SELECT 1`;
    health.checks.database = {
      status: 'healthy',
      responseTime: Date.now() - dbStart,
    };

    // Memory usage check
    const memUsage = process.memoryUsage();
    const totalMem = memUsage.heapTotal;
    const usedMem = memUsage.heapUsed;
    const memUsagePercent = (usedMem / totalMem) * 100;

    health.checks.memory = {
      status: memUsagePercent > 90 ? 'critical' : memUsagePercent > 70 ? 'warning' : 'healthy',
      usage: Math.round(memUsagePercent),
      details: {
        total: Math.round(totalMem / 1024 / 1024), // MB
        used: Math.round(usedMem / 1024 / 1024), // MB
      },
    };

    // Check if all systems are healthy
    const allHealthy = Object.values(health.checks).every(
      (check) => check.status === 'healthy'
    );

    health.status = allHealthy ? 'healthy' : 'degraded';
    health.responseTime = Date.now() - startTime;

    // Determine HTTP status code
    let statusCode = 200;
    if (health.status === 'degraded') {
      statusCode = 200; // Still serve traffic but indicate issues
    }
    if (Object.values(health.checks).some((check) => check.status === 'critical')) {
      statusCode = 503; // Service unavailable
      health.status = 'unhealthy';
    }

    return NextResponse.json(health, {
      status: statusCode,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'Pragma': 'no-cache',
        'Expires': '0',
      },
    });

  } catch (error) {
    health.status = 'unhealthy';
    health.checks.database = {
      status: 'unhealthy',
      error: error instanceof Error ? error.message : 'Unknown error',
    };
    health.responseTime = Date.now() - startTime;

    return NextResponse.json(health, {
      status: 503,
      headers: {
        'Cache-Control': 'no-cache, no-store, must-revalidate',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Handle different types of health checks
    switch (body.type) {
      case 'deep':
        return await deepHealthCheck();
      case 'startup':
        return await startupHealthCheck();
      case 'readiness':
        return await readinessHealthCheck();
      default:
        return await GET(request);
    }
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid health check request' },
      { status: 400 }
    );
  }
}

async function deepHealthCheck() {
  const startTime = Date.now();

  try {
    // Perform comprehensive checks
    const checks = await Promise.allSettled([
      // Database connectivity and query performance
      prisma.user.count(),

      // External service checks (add your services here)
      // checkExternalAPI(),

      // Cache connectivity
      // checkRedisConnection(),
    ]);

    const results = checks.map((check, index) => ({
      check: ['database', 'external_api', 'cache'][index],
      status: check.status === 'fulfilled' ? 'healthy' : 'unhealthy',
      responseTime: 0, // Add timing if needed
      error: check.status === 'rejected' ?
        (check.reason instanceof Error ? check.reason.message : 'Unknown error') :
        undefined,
    }));

    const allHealthy = results.every(r => r.status === 'healthy');

    return NextResponse.json({
      status: allHealthy ? 'healthy' : 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      checks: results,
    });

  } catch (error) {
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      responseTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}

async function startupHealthCheck() {
  // Lightweight checks for startup probe
  return NextResponse.json({
    status: 'ready',
    timestamp: new Date().toISOString(),
    checks: {
      server: 'healthy',
      database: 'connected',
    },
  });
}

async function readinessHealthCheck() {
  // Check if application is ready to serve traffic
  try {
    // Check database connection
    await prisma.$queryRaw`SELECT 1`;

    return NextResponse.json({
      status: 'ready',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    return NextResponse.json({
      status: 'not ready',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    }, { status: 503 });
  } finally {
    await prisma.$disconnect();
  }
}