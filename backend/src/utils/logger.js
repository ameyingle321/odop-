/**
 * Simple structured logger for the ODOP Nexus backend.
 *
 * Provides consistent log formatting with timestamps and severity levels.
 * In development, all levels are logged.
 * In production, debug messages are suppressed.
 *
 * Can be swapped for a more advanced logger (Winston, Pino) later
 * without touching consuming code, since the interface stays the same.
 */

const isDev = (process.env.NODE_ENV || 'development') !== 'production';

/**
 * Format a log line with an ISO timestamp and level tag.
 * @param {'INFO'|'WARN'|'ERROR'|'DEBUG'} level
 * @param {string} message
 * @param {object} [meta] - Additional key/value data.
 */
function formatLog(level, message, meta) {
  const timestamp = new Date().toISOString();
  const prefix = `[${timestamp}] [${level}]`;
  if (meta && Object.keys(meta).length > 0) {
    return `${prefix} ${message} ${JSON.stringify(meta)}`;
  }
  return `${prefix} ${message}`;
}

const logger = {
  info(message, meta) {
    console.log(formatLog('INFO', message, meta));
  },

  warn(message, meta) {
    console.warn(formatLog('WARN', message, meta));
  },

  error(message, meta) {
    console.error(formatLog('ERROR', message, meta));
  },

  /** Debug messages are suppressed in production. */
  debug(message, meta) {
    if (isDev) {
      console.log(formatLog('DEBUG', message, meta));
    }
  },
};

export default logger;
