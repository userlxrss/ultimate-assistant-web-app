import { PrismaClient } from '@prisma/client';

declare global {
  var __prisma: PrismaClient | undefined;
}

// Prevent multiple instances of Prisma Client in development
const prisma = globalThis.__prisma || new PrismaClient({
  log: process.env.NODE_ENV === 'development' ? ['query', 'error', 'warn'] : ['error'],
  errorFormat: 'pretty',
});

if (process.env.NODE_ENV === 'development') {
  globalThis.__prisma = prisma;
}

export default prisma;

// Helper functions for common operations
export const createAuditLog = async (
  userId: string,
  activityType: string,
  entityType?: string,
  entityId?: string,
  details?: any
) => {
  return await prisma.activityLog.create({
    data: {
      userId,
      activityType,
      entityType,
      entityId,
      details: details || {},
    },
  });
};

export const getUserById = async (id: string) => {
  return await prisma.user.findUnique({
    where: { id },
    include: {
      userPreferences: true,
      externalConnections: true,
    },
  });
};

export const getUserByEmail = async (email: string) => {
  return await prisma.user.findUnique({
    where: { email },
    include: {
      userPreferences: true,
      externalConnections: true,
    },
  });
};

export const createFeatureFlagCheck = async (flagName: string, userId?: string) => {
  const flag = await prisma.featureFlag.findUnique({
    where: { flagName },
  });

  if (!flag || !flag.isEnabled) {
    return false;
  }

  // If specific user is enabled
  if (userId && flag.enabledForUsers.includes(userId)) {
    return true;
  }

  // Random rollout based on percentage
  if (flag.rolloutPercentage > 0 && userId) {
    const hash = hashString(userId);
    return (hash % 100) < flag.rolloutPercentage;
  }

  return flag.isEnabled;
};

// Simple string hash function for rollout percentage
function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

export default prisma;