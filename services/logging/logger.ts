// services/logging/logger.ts
type LogLevel = "debug" | "info" | "warn" | "error";

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  message: string;
  details?: any;
  user?: string;
}

class Logger {
  private isProduction = process.env.NODE_ENV === "production";

  debug(message: string, details?: any, userId?: string) {
    this.log("debug", message, details, userId);
  }

  info(message: string, details?: any, userId?: string) {
    this.log("info", message, details, userId);
  }

  warn(message: string, details?: any, userId?: string) {
    this.log("warn", message, details, userId);
  }

  error(message: string, details?: any, userId?: string) {
    this.log("error", message, details, userId);
  }

  private log(
    level: LogLevel,
    message: string,
    details?: any,
    userId?: string,
  ) {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      message,
      details,
      user: userId,
    };

    // Always log to console in development
    if (!this.isProduction || level === "error") {
      const method = level === "debug" ? "log" : level;
      console[method as "log" | "info" | "warn" | "error"](
        `[${entry.timestamp}] [${level.toUpperCase()}]`,
        message,
        details || "",
      );
    }

    // In production, you could send logs to a service like Sentry, LogRocket, etc.
    if (this.isProduction) {
      // Example: Send to a logging endpoint
      // this.sendToLoggingService(entry);
    }
  }

  // Placeholder for a production logging service integration
  private async sendToLoggingService(entry: LogEntry) {
    // Implementation would depend on your logging service of choice
    // For example, sending to a custom API endpoint:
    /*
    try {
      await fetch('/api/logs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(entry),
      });
    } catch (error) {
      // Fallback to console in case logging service is unavailable
      console.error('Failed to send log to logging service', error);
    }
    */
  }
}

export const logger = new Logger();
