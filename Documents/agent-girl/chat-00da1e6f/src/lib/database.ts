import prisma from './prisma';

// Database connection health check
export async function checkDatabaseHealth() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return {
      status: 'healthy',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Get database connection info
export async function getDatabaseInfo() {
  try {
    const result = await prisma.$queryRaw<Array<{ version: string }>>`
      SELECT version() as version
    `;

    return {
      version: result[0]?.version || 'Unknown',
      status: 'connected',
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      version: 'Unknown',
      status: 'disconnected',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

// Graceful shutdown
export async function disconnectDatabase() {
  try {
    await prisma.$disconnect();
    console.log('✅ Database disconnected successfully');
  } catch (error) {
    console.error('❌ Error disconnecting from database:', error);
    throw error;
  }
}

// Transaction helper
export async function withTransaction<T>(
  callback: (tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0]) => Promise<T>
): Promise<T> {
  return await prisma.$transaction(callback);
}

// Raw query helper
export async function executeRawQuery<T = any>(
  query: string,
  parameters?: any[]
): Promise<T[]> {
  return await prisma.$queryRawUnsafe(query, ...(parameters || []));
}

// Migration status
export async function getMigrationStatus() {
  try {
    const migrations = await prisma.schemaMigration.findMany({
      orderBy: { appliedAt: 'desc' },
    });

    return {
      status: 'success',
      migrations,
      count: migrations.length,
      lastMigration: migrations[0],
    };
  } catch (error) {
    return {
      status: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      migrations: [],
      count: 0,
    };
  }
}

// Database statistics
export async function getDatabaseStats() {
  try {
    const [
      userCount,
      journalEntryCount,
      taskCount,
      calendarEventCount,
      contactCount,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.journalEntry.count(),
      prisma.task.count(),
      prisma.calendarEvent.count(),
      prisma.contact.count(),
    ]);

    return {
      users: userCount,
      journalEntries: journalEntryCount,
      tasks: taskCount,
      calendarEvents: calendarEventCount,
      contacts: contactCount,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString(),
    };
  }
}

export default prisma;