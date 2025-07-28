import { ShortenedURL, ClickData } from '../types';
import { logger } from './logger';

const STORAGE_KEY = 'url_shortener_data';
const BASE_URL = window.location.origin + '/s/';

export class URLShortenerService {
  private urls: ShortenedURL[] = [];

  constructor() {
    this.loadFromStorage();
    logger.info('URLShortenerService initialized', { urlCount: this.urls.length }, 'URLShortenerService');
  }

  private loadFromStorage() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      if (data) {
        this.urls = JSON.parse(data).map((url: any) => ({
          ...url,
          createdAt: new Date(url.createdAt),
          expiresAt: new Date(url.expiresAt),
          clicks: url.clicks.map((click: any) => ({
            ...click,
            timestamp: new Date(click.timestamp)
          }))
        }));
        logger.info('URLs loaded from storage', { count: this.urls.length }, 'URLShortenerService');
      }
    } catch (error) {
      logger.error('Failed to load URLs from storage', error, 'URLShortenerService');
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.urls));
      logger.debug('URLs saved to storage', { count: this.urls.length }, 'URLShortenerService');
    } catch (error) {
      logger.error('Failed to save URLs to storage', error, 'URLShortenerService');
    }
  }

  private generateShortCode(): string {
    const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  }

  private isShortCodeUnique(shortCode: string): boolean {
    return !this.urls.some(url => url.shortCode === shortCode);
  }

  private generateUniqueShortCode(): string {
    let shortCode;
    let attempts = 0;
    do {
      shortCode = this.generateShortCode();
      attempts++;
      if (attempts > 100) {
        throw new Error('Unable to generate unique short code after 100 attempts');
      }
    } while (!this.isShortCodeUnique(shortCode));
    
    logger.debug('Generated unique short code', { shortCode, attempts }, 'URLShortenerService');
    return shortCode;
  }

  private isValidUrl(url: string): boolean {
    try {
      new URL(url);
      return true;
    } catch {
      return false;
    }
  }

  private isValidShortCode(shortCode: string): boolean {
    return /^[a-zA-Z0-9]{1,20}$/.test(shortCode);
  }

  createShortenedURL(originalUrl: string, validityMinutes: number = 30, customShortcode?: string): ShortenedURL {
    logger.info('Creating shortened URL', { originalUrl, validityMinutes, customShortcode }, 'URLShortenerService');

    // Validation
    if (!this.isValidUrl(originalUrl)) {
      const error = 'Invalid URL format';
      logger.error(error, { originalUrl }, 'URLShortenerService');
      throw new Error(error);
    }

    if (validityMinutes <= 0 || validityMinutes > 10080) { // Max 1 week
      const error = 'Validity must be between 1 and 10080 minutes';
      logger.error(error, { validityMinutes }, 'URLShortenerService');
      throw new Error(error);
    }

    let shortCode: string;
    if (customShortcode) {
      if (!this.isValidShortCode(customShortcode)) {
        const error = 'Custom shortcode must be alphanumeric and 1-20 characters';
        logger.error(error, { customShortcode }, 'URLShortenerService');
        throw new Error(error);
      }
      if (!this.isShortCodeUnique(customShortcode)) {
        const error = 'Custom shortcode already exists';
        logger.error(error, { customShortcode }, 'URLShortenerService');
        throw new Error(error);
      }
      shortCode = customShortcode;
    } else {
      shortCode = this.generateUniqueShortCode();
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + validityMinutes * 60 * 1000);

    const shortenedURL: ShortenedURL = {
      id: crypto.randomUUID(),
      originalUrl,
      shortCode,
      shortUrl: BASE_URL + shortCode,
      validityMinutes,
      createdAt: now,
      expiresAt,
      clicks: [],
      isExpired: false
    };

    this.urls.push(shortenedURL);
    this.saveToStorage();

    logger.info('Shortened URL created successfully', { 
      id: shortenedURL.id, 
      shortCode, 
      expiresAt 
    }, 'URLShortenerService');

    return shortenedURL;
  }

  getURLByShortCode(shortCode: string): ShortenedURL | null {
    const url = this.urls.find(u => u.shortCode === shortCode);
    
    if (url) {
      // Check if expired
      const now = new Date();
      if (now > url.expiresAt) {
        url.isExpired = true;
        this.saveToStorage();
        logger.warn('Attempted to access expired URL', { shortCode, expiresAt: url.expiresAt }, 'URLShortenerService');
        return null;
      }
    }
    
    return url || null;
  }

  recordClick(shortCode: string, source: string = 'direct'): boolean {
    const url = this.getURLByShortCode(shortCode);
    if (!url) {
      logger.warn('Attempted to record click for non-existent or expired URL', { shortCode }, 'URLShortenerService');
      return false;
    }

    const clickData: ClickData = {
      id: crypto.randomUUID(),
      timestamp: new Date(),
      source,
      location: this.getLocationFromIP(),
      userAgent: navigator.userAgent,
      ipAddress: 'client-side' // In real app, this would come from server
    };

    url.clicks.push(clickData);
    this.saveToStorage();

    logger.info('Click recorded', { shortCode, clickId: clickData.id, source }, 'URLShortenerService');
    return true;
  }

  private getLocationFromIP(): string {
    // In a real application, this would use IP geolocation service
    const locations = ['New York, NY', 'Los Angeles, CA', 'Chicago, IL', 'Houston, TX', 'Phoenix, AZ', 'Philadelphia, PA'];
    return locations[Math.floor(Math.random() * locations.length)];
  }

  getAllURLs(): ShortenedURL[] {
    // Update expired status
    const now = new Date();
    this.urls.forEach(url => {
      url.isExpired = now > url.expiresAt;
    });
    this.saveToStorage();

    return [...this.urls].sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  getActiveURLsCount(): number {
    const now = new Date();
    return this.urls.filter(url => now <= url.expiresAt).length;
  }

  deleteURL(id: string): boolean {
    const index = this.urls.findIndex(url => url.id === id);
    if (index === -1) {
      logger.warn('Attempted to delete non-existent URL', { id }, 'URLShortenerService');
      return false;
    }

    const url = this.urls[index];
    this.urls.splice(index, 1);
    this.saveToStorage();

    logger.info('URL deleted', { id, shortCode: url.shortCode }, 'URLShortenerService');
    return true;
  }
}

export const urlShortenerService = new URLShortenerService();