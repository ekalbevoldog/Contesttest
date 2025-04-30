/**
 * Simple logger implementation for Contested app
 */

// Log levels
type LogLevel = 'debug' | 'info' | 'warn' | 'error';

// Default log level from environment or 'info' if not specified
const defaultLogLevel = (process.env.LOG_LEVEL as LogLevel) || 'info';

// Log level priority
const logLevelPriority: Record<LogLevel, number> = {
  'debug': 0,
  'info': 1,
  'warn': 2,
  'error': 3
};

// Logger interface
interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

// Helper to check if we should log at a given level
const shouldLog = (level: LogLevel): boolean => {
  const configuredPriority = logLevelPriority[defaultLogLevel];
  const messagePriority = logLevelPriority[level];
  return messagePriority >= configuredPriority;
};

// Format the log message with timestamp
const formatLogMessage = (level: LogLevel, message: string, args: any[]): string => {
  const timestamp = new Date().toISOString();
  const formattedArgs = args.map(arg => {
    if (typeof arg === 'object') {
      try {
        return JSON.stringify(arg);
      } catch (e) {
        return '[Object]';
      }
    }
    return String(arg);
  }).join(' ');
  
  return `[${timestamp}] [${level.toUpperCase()}] ${message} ${formattedArgs}`.trim();
};

// Logger implementation
export const logger: Logger = {
  debug: (message: string, ...args: any[]) => {
    if (shouldLog('debug')) {
      console.debug(formatLogMessage('debug', message, args));
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (shouldLog('info')) {
      console.info(formatLogMessage('info', message, args));
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (shouldLog('warn')) {
      console.warn(formatLogMessage('warn', message, args));
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (shouldLog('error')) {
      console.error(formatLogMessage('error', message, args));
    }
  }
};