const logWithTimestamp = (level: 'log' | 'warn' | 'error' | 'debug', ...args: unknown[]) => {
  const timestamp = new Date().toISOString();
  console[level](`[${timestamp}]`, ...args);
};

//TODO: Can interate with sentry or something ?

/**
 * A simple logger utility.
 * In development, it logs to the console.
 * In production, it can be integrated with an error tracking service.
 */
export const logger = {
  error: (error: unknown, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      logWithTimestamp("error", "DEVELOPMENT ERROR:", error, context);
    } else {
      // In a real production environment, you would send this to Sentry, Datadog, etc.
      logWithTimestamp("warn", "Production error occurred, but no error tracking configured:", error, context);
    }
  },
  info: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      logWithTimestamp("log", "INFO:", message, context);
    } else {
      // Production logging for info - adjust as needed
      logWithTimestamp("log", "INFO:", message, context);
    }
  },
  warn: (message: string, context?: Record<string, unknown>) => {
    if (process.env.NODE_ENV === 'development') {
      logWithTimestamp("warn", "WARN:", message, context);
    } else {
      // Production logging for warnings
      logWithTimestamp("warn", "WARN:", message, context);
    }
  },
  debug: (message: string, context?: Record<string, unknown>) => {
    // Debug logs are typically only for development
    if (process.env.NODE_ENV === 'development') {
      logWithTimestamp("debug", "DEBUG:", message, context);
    }
  },
};
