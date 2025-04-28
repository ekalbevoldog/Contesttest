/**
 * Centralized logger utility 
 * 
 * This streamlines and controls logging across the application to prevent excessive console output
 * and provides a central place to control logging levels.
 */

// Define log levels
export enum LogLevel {
  ERROR = 0,
  WARN = 1,
  INFO = 2,
  DEBUG = 3,
  TRACE = 4,
}

// Current log level - change this to control verbosity
let currentLogLevel = process.env.NODE_ENV === 'production' 
  ? LogLevel.ERROR  // Only show errors in production
  : LogLevel.INFO;  // Show up to info messages in development

// Enable for specific modules even in production
const enabledModules: Record<string, boolean> = {
  'Auth': true, // Always log auth-related messages
  'API': true,  // Always log API-related messages
};

/**
 * Configure the logger
 * 
 * @param level The log level to set
 * @param enabledModuleNames Array of module names to enable logging for
 */
export function configureLogger(level: LogLevel, enabledModuleNames?: string[]) {
  currentLogLevel = level;
  
  if (enabledModuleNames) {
    enabledModuleNames.forEach(name => {
      enabledModules[name] = true;
    });
  }
}

/**
 * Main logger class for a specific module
 */
export class Logger {
  private moduleName: string;
  
  constructor(moduleName: string) {
    this.moduleName = moduleName;
  }
  
  /**
   * Log error messages - always shown
   */
  error(...args: any[]) {
    if (currentLogLevel >= LogLevel.ERROR) {
      console.error(`[${this.moduleName}]`, ...args);
    }
  }
  
  /**
   * Log warning messages
   */
  warn(...args: any[]) {
    if (currentLogLevel >= LogLevel.WARN) {
      console.warn(`[${this.moduleName}]`, ...args);
    }
  }
  
  /**
   * Log info messages - shown by default in development
   */
  info(...args: any[]) {
    if (currentLogLevel >= LogLevel.INFO || enabledModules[this.moduleName]) {
      console.log(`[${this.moduleName}]`, ...args);
    }
  }
  
  /**
   * Log debug messages - hidden by default, shown when debug level set
   */
  debug(...args: any[]) {
    if (currentLogLevel >= LogLevel.DEBUG || enabledModules[this.moduleName]) {
      console.log(`[${this.moduleName}:debug]`, ...args);
    }
  }
  
  /**
   * Log trace messages - most detailed level
   */
  trace(...args: any[]) {
    if (currentLogLevel >= LogLevel.TRACE || enabledModules[this.moduleName]) {
      console.log(`[${this.moduleName}:trace]`, ...args);
    }
  }
}

/**
 * Create a logger for a specific module
 */
export function createLogger(moduleName: string): Logger {
  return new Logger(moduleName);
}

// Default logger instance
export const logger = createLogger('App');