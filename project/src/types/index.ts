export interface ShortenedURL {
  id: string;
  originalUrl: string;
  shortCode: string;
  shortUrl: string;
  validityMinutes: number;
  createdAt: Date;
  expiresAt: Date;
  clicks: ClickData[];
  isExpired: boolean;
}

export interface ClickData {
  id: string;
  timestamp: Date;
  source: string;
  location: string;
  userAgent: string;
  ipAddress: string;
}

export interface URLFormData {
  originalUrl: string;
  validityMinutes: number;
  customShortcode: string;
}

export interface LogEvent {
  id: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
  message: string;
  context?: any;
  component?: string;
}