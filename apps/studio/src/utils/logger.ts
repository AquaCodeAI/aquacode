enum LogLevel {
  ERROR = 'ERROR',
  WARN = 'WARN',
  INFO = 'INFO',
  DEBUG = 'DEBUG',
}

const colors = {
  ERROR: '\x1b[31m',
  WARN: '\x1b[33m',
  INFO: '\x1b[32m',
  DEBUG: '\x1b[35m',
  OBJECT: '\x1b[34m',
  RESET: '\x1b[0m',
};

// Define which log levels are enabled in each environment
const enabledLogLevels = {
  development: [LogLevel.ERROR, LogLevel.WARN, LogLevel.INFO, LogLevel.DEBUG],
  production: [LogLevel.ERROR, LogLevel.WARN],
  test: [LogLevel.ERROR, LogLevel.WARN],
};

// Get current environment
const getEnvironment = (): 'development' | 'production' | 'test' => {
  // Default to 'development' if NODE_ENV is not set
  return (process.env.NODE_ENV as 'development' | 'production' | 'test') || 'development';
};

// For client-side, we might want to disable certain logs even in development
const isClientSide = typeof window !== 'undefined';

// Check if a log level is enabled in the current environment
const isLogLevelEnabled = (level: LogLevel): boolean => {
  const environment = getEnvironment();

  // In the production client-side, only show ERROR logs
  if (isClientSide && environment === 'production') {
    return level === LogLevel.ERROR;
  }

  // In the development client-side, show all logs (ERROR, WARN, INFO, DEBUG)
  if (isClientSide && environment === 'development') {
    return true; // Enable all log levels in development
  }

  // For server-side or other environments, use the configured levels
  return enabledLogLevels[environment]?.includes(level) || false;
};

const formatMessage = (level: LogLevel, ...args: unknown[]): unknown => {
  // For client-side, return args as-is (no formatting)
  if (isClientSide) return args;

  // For server-side, add timestamp, level, and color formatting
  const timestamp = new Date().toISOString();
  const message = args
    .map((arg) => (typeof arg === 'object' ? colors.OBJECT + JSON.stringify(arg) + colors.RESET : arg))
    .join(' ');

  const color = colors[level];
  const reset = colors.RESET;

  return `${color}[${timestamp}] [${level}]${reset} ${message}`;
};

export const logger = {
  error: (...args: unknown[]): void => {
    // Always log errors regardless of environment
    console.error(formatMessage(LogLevel.ERROR, ...args));
  },
  warn: (...args: unknown[]): void => {
    if (isLogLevelEnabled(LogLevel.WARN)) {
      console.warn(formatMessage(LogLevel.WARN, ...args));
    }
  },
  info: (...args: unknown[]): void => {
    if (isLogLevelEnabled(LogLevel.INFO)) {
      console.log(formatMessage(LogLevel.INFO, ...args));
    }
  },
  debug: (...args: unknown[]): void => {
    if (isLogLevelEnabled(LogLevel.DEBUG)) {
      console.debug(formatMessage(LogLevel.DEBUG, ...args));
    }
  },
};
