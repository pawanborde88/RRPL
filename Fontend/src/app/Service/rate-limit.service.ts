import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class RateLimitService {
  private requestCounts: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Checks if a request can proceed based on rate limiting
   * @param key - Unique identifier for the rate limit (e.g., 'login', 'otp')
   * @param maxRequests - Maximum number of requests allowed
   * @param windowMs - Time window in milliseconds (default: 60000 = 1 minute)
   * @returns true if the request can proceed, false otherwise
   */
  canProceed(key: string, maxRequests: number, windowMs: number = 60000): boolean {
    const now = Date.now();
    const record = this.requestCounts.get(key);

    if (!record || now > record.resetTime) {
      // Create or reset the record
      this.requestCounts.set(key, {
        count: 1,
        resetTime: now + windowMs
      });
      return true;
    }

    if (record.count >= maxRequests) {
      return false;
    }

    // Increment the count
    record.count++;
    return true;
  }

  /**
   * Resets the rate limit for a specific key
   * @param key - The key to reset
   */
  reset(key: string): void {
    this.requestCounts.delete(key);
  }

  /**
   * Clears all rate limit records
   */
  clearAll(): void {
    this.requestCounts.clear();
  }
}











































































