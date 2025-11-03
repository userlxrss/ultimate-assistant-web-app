/**
 * 🚨 EMERGENCY CONSOLE LIMITER
 * Reduces console logging to prevent performance issues
 */

// Store original console methods BEFORE overriding
const originalConsole = {
  log: console.log,
  error: console.error,
  warn: console.warn,
  info: console.info,
  debug: console.debug
};

const logCache = new Map();
const MAX_LOGS_PER_SECOND = 5;

const rateLimitLog = (type: string, originalMethod: Function) => {
  return (...args: any[]) => {
    try {
      const key = String(args[0] || 'unknown');
      const now = Date.now();
      const lastLog = logCache.get(key);

      if (!lastLog || now - lastLog > 1000 / MAX_LOGS_PER_SECOND) {
        originalMethod(...args);
        logCache.set(key, now);
      }
    } catch (e) {
      // Fallback to original console if something goes wrong
      originalMethod(...args);
    }
  };
};

// Override console methods with safe originals
console.log = rateLimitLog('log', originalConsole.log);
console.error = rateLimitLog('error', originalConsole.error);
console.warn = rateLimitLog('warn', originalConsole.warn);
console.info = rateLimitLog('info', originalConsole.info);
console.debug = () => {}; // Disable debug logs entirely

originalConsole.log('🚫 Console limiter activated - FIXED');
