/**
 * Production-safe logging utility
 * Removes console.log statements in production while preserving errors
 */

type LogLevel = 'log' | 'warn' | 'error' | 'info' | 'debug';

const isDevelopment = process.env.NODE_ENV === 'development';

// Create production-safe logger
export const logger = {
  log: isDevelopment ? console.log : () => {},
  warn: isDevelopment ? console.warn : () => {},
  info: isDevelopment ? console.info : () => {},
  debug: isDevelopment ? console.debug : () => {},
  error: console.error, // Always log errors
  // Add context for better debugging
  context: (context: string) => ({
    log: isDevelopment ? (...args: any[]) => console.log(`[${context}]`, ...args) : () => {},
    warn: isDevelopment ? (...args: any[]) => console.warn(`[${context}]`, ...args) : () => {},
    info: isDevelopment ? (...args: any[]) => console.info(`[${context}]`, ...args) : () => {},
    debug: isDevelopment ? (...args: any[]) => console.debug(`[${context}]`, ...args) : () => {},
    error: (...args: any[]) => console.error(`[${context}]`, ...args),
  })
};

// Performance logging (development only)
export const performanceLogger = {
  start: isDevelopment ? (label: string) => console.time(label) : () => {},
  end: isDevelopment ? (label: string) => console.timeEnd(label) : () => {},
  mark: isDevelopment ? (label: string) => console.timeLog?.(label) : () => {},
};

// Export default for convenience
export default logger;