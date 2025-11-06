// Simple logger utility for debugging
export const logger = {
  debug: (message: string, ...args: any[]) => {
    console.log(`🐛 DEBUG: ${message}`, ...args);
  },
  info: (message: string, ...args: any[]) => {
    console.info(`ℹ️  INFO: ${message}`, ...args);
  },
  warn: (message: string, ...args: any[]) => {
    console.warn(`⚠️  WARN: ${message}`, ...args);
  },
  error: (message: string, ...args: any[]) => {
    console.error(`❌ ERROR: ${message}`, ...args);
  }
};