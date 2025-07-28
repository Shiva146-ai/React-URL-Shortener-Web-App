import { LogEvent } from '../types';

class Logger {
  private logs: LogEvent[] = [];
  private listeners: ((logs: LogEvent[]) => void)[] = [];

  private createLog(level: LogEvent['level'], message: string, context?: any, component?: string): LogEvent {
    return {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      level,
      message,
      context,
      component
    };
  }

  private addLog(log: LogEvent) {
    this.logs.push(log);
    this.notifyListeners();
    
    // Keep only last 1000 logs to prevent memory issues
    if (this.logs.length > 1000) {
      this.logs = this.logs.slice(-1000);
    }
    
    // Persist to localStorage
    try {
      localStorage.setItem('url_shortener_logs', JSON.stringify(this.logs));
    } catch (error) {
      console.warn('Failed to persist logs to localStorage:', error);
    }
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener([...this.logs]));
  }

  info(message: string, context?: any, component?: string) {
    const log = this.createLog('info', message, context, component);
    this.addLog(log);
    console.log(`[INFO] ${component ? `[${component}] ` : ''}${message}`, context);
  }

  warn(message: string, context?: any, component?: string) {
    const log = this.createLog('warn', message, context, component);
    this.addLog(log);
    console.warn(`[WARN] ${component ? `[${component}] ` : ''}${message}`, context);
  }

  error(message: string, context?: any, component?: string) {
    const log = this.createLog('error', message, context, component);
    this.addLog(log);
    console.error(`[ERROR] ${component ? `[${component}] ` : ''}${message}`, context);
  }

  debug(message: string, context?: any, component?: string) {
    const log = this.createLog('debug', message, context, component);
    this.addLog(log);
    console.debug(`[DEBUG] ${component ? `[${component}] ` : ''}${message}`, context);
  }

  getLogs(): LogEvent[] {
    return [...this.logs];
  }

  subscribe(listener: (logs: LogEvent[]) => void) {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter(l => l !== listener);
    };
  }

  initialize() {
    try {
      const savedLogs = localStorage.getItem('url_shortener_logs');
      if (savedLogs) {
        this.logs = JSON.parse(savedLogs).map((log: any) => ({
          ...log,
          timestamp: new Date(log.timestamp)
        }));
      }
    } catch (error) {
      console.warn('Failed to load logs from localStorage:', error);
    }
    
    this.info('Logger initialized', { logsCount: this.logs.length }, 'Logger');
  }
}

export const logger = new Logger();