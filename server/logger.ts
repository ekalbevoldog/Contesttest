/**
 * Simple logger implementation for Contested app
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface Logger {
  debug: (message: string, ...args: any[]) => void;
  info: (message: string, ...args: any[]) => void;
  warn: (message: string, ...args: any[]) => void;
  error: (message: string, ...args: any[]) => void;
}

// Default log level from environment or 'info'
const LOG_LEVEL = (process.env.LOG_LEVEL || 'info').toLowerCase() as LogLevel;

// Log level priority (higher number = higher priority)
const LOG_LEVELS: Record<LogLevel, number> = {
  debug: 0,
  info: 1,
  warn: 2,
  error: 3
};

// Current log level priority
const CURRENT_LOG_LEVEL = LOG_LEVELS[LOG_LEVEL] || LOG_LEVELS.info;

// ANSI color codes for console output
const COLORS = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  debug: '\x1b[2m', // Dim (gray)
  info: '\x1b[36m', // Cyan
  warn: '\x1b[33m', // Yellow
  error: '\x1b[31m', // Red
};

// Logger implementation
export const logger: Logger = {
  debug: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.debug) {
      console.log(`${COLORS.debug}[DEBUG]${COLORS.reset} ${message}`, ...args);
    }
  },
  
  info: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.info) {
      console.log(`${COLORS.info}[INFO]${COLORS.reset} ${message}`, ...args);
    }
  },
  
  warn: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.warn) {
      console.warn(`${COLORS.warn}[WARN]${COLORS.reset} ${message}`, ...args);
    }
  },
  
  error: (message: string, ...args: any[]) => {
    if (CURRENT_LOG_LEVEL <= LOG_LEVELS.error) {
      console.error(`${COLORS.error}[ERROR]${COLORS.reset} ${message}`, ...args);
    }
  }
};