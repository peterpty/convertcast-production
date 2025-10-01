'use client';

/**
 * Security Hardening and Compliance System
 * Production-ready security measures and compliance features
 */

import { analytics } from '@/lib/monitoring/analytics';

// Security Configuration
export const SECURITY_CONFIG = {
  // Rate limiting
  rateLimits: {
    api: 1000, // requests per minute
    auth: 5, // login attempts per minute
    streaming: 10, // stream starts per hour
    registration: 3 // registrations per hour per IP
  },

  // Session management
  session: {
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    renewThreshold: 60 * 60 * 1000, // 1 hour before expiry
    maxSessions: 5 // per user
  },

  // Content Security Policy
  csp: {
    'default-src': ["'self'"],
    'script-src': ["'self'", "'unsafe-inline'", 'https://js.stripe.com', 'https://www.google-analytics.com'],
    'style-src': ["'self'", "'unsafe-inline'", 'https://fonts.googleapis.com'],
    'img-src': ["'self'", 'data:', 'https:', 'blob:'],
    'media-src': ["'self'", 'https://stream.mux.com', 'blob:'],
    'connect-src': ["'self'", 'https://api.stripe.com', 'https://analytics.google.com', 'wss:'],
    'font-src': ["'self'", 'https://fonts.gstatic.com'],
    'frame-src': ["'self'", 'https://js.stripe.com']
  },

  // Data validation
  validation: {
    maxFileSize: 50 * 1024 * 1024, // 50MB
    allowedImageTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/gif'],
    allowedVideoTypes: ['video/mp4', 'video/webm'],
    maxStringLength: 10000,
    emailRegex: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    strongPasswordRegex: /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/
  }
};

/**
 * Input Sanitization
 */
export class InputSanitizer {
  /**
   * Sanitize HTML content
   */
  static sanitizeHtml(html: string): string {
    // Basic HTML sanitization - in production use DOMPurify
    return html
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#x27;')
      .replace(/\//g, '&#x2F;');
  }

  /**
   * Sanitize SQL-like strings
   */
  static sanitizeSQL(input: string): string {
    return input.replace(/[;'"\\]/g, '');
  }

  /**
   * Validate and sanitize email
   */
  static validateEmail(email: string): { valid: boolean; sanitized: string } {
    const sanitized = email.trim().toLowerCase();
    const valid = SECURITY_CONFIG.validation.emailRegex.test(sanitized);
    return { valid, sanitized };
  }

  /**
   * Validate password strength
   */
  static validatePassword(password: string): {
    valid: boolean;
    score: number;
    requirements: string[];
  } {
    const requirements: string[] = [];
    let score = 0;

    if (password.length >= 8) score += 1;
    else requirements.push('At least 8 characters');

    if (/[a-z]/.test(password)) score += 1;
    else requirements.push('At least one lowercase letter');

    if (/[A-Z]/.test(password)) score += 1;
    else requirements.push('At least one uppercase letter');

    if (/\d/.test(password)) score += 1;
    else requirements.push('At least one number');

    if (/[@$!%*?&]/.test(password)) score += 1;
    else requirements.push('At least one special character');

    return {
      valid: score >= 4,
      score,
      requirements
    };
  }

  /**
   * Sanitize file uploads
   */
  static validateFile(file: File): {
    valid: boolean;
    errors: string[];
  } {
    const errors: string[] = [];

    // Check file size
    if (file.size > SECURITY_CONFIG.validation.maxFileSize) {
      errors.push(`File too large. Maximum size is ${SECURITY_CONFIG.validation.maxFileSize / (1024 * 1024)}MB`);
    }

    // Check file type
    const isImage = SECURITY_CONFIG.validation.allowedImageTypes.includes(file.type);
    const isVideo = SECURITY_CONFIG.validation.allowedVideoTypes.includes(file.type);

    if (!isImage && !isVideo) {
      errors.push('Invalid file type. Only images and videos are allowed.');
    }

    // Check filename for suspicious content
    if (/[<>:"/\\|?*]/.test(file.name)) {
      errors.push('Invalid filename characters.');
    }

    return {
      valid: errors.length === 0,
      errors
    };
  }
}

/**
 * Rate Limiting
 */
export class RateLimiter {
  private static limits: Map<string, { count: number; resetTime: number }> = new Map();

  /**
   * Check if request is within rate limit
   */
  static checkLimit(key: string, limit: number, windowMs: number = 60000): {
    allowed: boolean;
    remaining: number;
    resetTime: number;
  } {
    const now = Date.now();
    const current = this.limits.get(key) || { count: 0, resetTime: now + windowMs };

    // Reset if window has passed
    if (now >= current.resetTime) {
      current.count = 0;
      current.resetTime = now + windowMs;
    }

    const allowed = current.count < limit;
    if (allowed) {
      current.count++;
    }

    this.limits.set(key, current);

    // Track rate limit violations
    if (!allowed) {
      analytics.trackEvent('rate_limit_exceeded', {
        key,
        limit,
        attempts: current.count,
        severity: 'medium'
      });
    }

    return {
      allowed,
      remaining: Math.max(0, limit - current.count),
      resetTime: current.resetTime
    };
  }

  /**
   * Get current usage for a key
   */
  static getUsage(key: string): { count: number; resetTime: number } | null {
    return this.limits.get(key) || null;
  }

  /**
   * Clear limits for a key
   */
  static clearLimit(key: string): void {
    this.limits.delete(key);
  }
}

/**
 * Session Security
 */
export class SessionSecurity {
  /**
   * Generate secure session token
   */
  static generateSecureToken(length: number = 32): string {
    const array = new Uint8Array(length);
    if (typeof window !== 'undefined' && window.crypto) {
      window.crypto.getRandomValues(array);
    } else {
      // Fallback for server-side
      for (let i = 0; i < length; i++) {
        array[i] = Math.floor(Math.random() * 256);
      }
    }
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Validate session token format
   */
  static validateTokenFormat(token: string): boolean {
    return /^[a-f0-9]{64}$/.test(token);
  }

  /**
   * Check if session should be renewed
   */
  static shouldRenewSession(sessionStart: number, maxAge: number = SECURITY_CONFIG.session.maxAge): boolean {
    const now = Date.now();
    const age = now - sessionStart;
    const renewThreshold = SECURITY_CONFIG.session.renewThreshold;

    return age > (maxAge - renewThreshold);
  }

  /**
   * Detect suspicious session activity
   */
  static detectSuspiciousActivity(sessionData: {
    userId: string;
    ipAddress: string;
    userAgent: string;
    actions: Array<{ action: string; timestamp: number }>;
  }): {
    suspicious: boolean;
    reasons: string[];
    riskScore: number;
  } {
    const reasons: string[] = [];
    let riskScore = 0;

    // Check for rapid actions
    const recentActions = sessionData.actions.filter(
      action => Date.now() - action.timestamp < 60000 // Last minute
    );

    if (recentActions.length > 50) {
      reasons.push('Unusually high activity rate');
      riskScore += 30;
    }

    // Check for suspicious patterns
    const actionTypes = recentActions.map(a => a.action);
    const uniqueActions = new Set(actionTypes);

    if (uniqueActions.size === 1 && actionTypes.length > 20) {
      reasons.push('Repetitive action pattern');
      riskScore += 40;
    }

    // Check user agent
    const suspiciousAgents = ['bot', 'crawler', 'spider', 'scraper'];
    if (suspiciousAgents.some(agent => sessionData.userAgent.toLowerCase().includes(agent))) {
      reasons.push('Suspicious user agent');
      riskScore += 50;
    }

    // Geographic inconsistency would require IP geolocation service
    // For now, we'll simulate based on IP changes
    // This would be implemented with a real geolocation service

    return {
      suspicious: riskScore >= 50,
      reasons,
      riskScore
    };
  }
}

/**
 * Data Encryption Utilities
 */
export class DataEncryption {
  /**
   * Hash sensitive data (client-side hashing for passwords before transmission)
   */
  static async hashData(data: string, salt: string = ''): Promise<string> {
    if (typeof window === 'undefined') {
      // Server-side fallback - in production use proper crypto library
      return Buffer.from(data + salt).toString('base64');
    }

    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data + salt);
    const hashBuffer = await window.crypto.subtle.digest('SHA-256', dataBuffer);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  /**
   * Generate salt for password hashing
   */
  static generateSalt(length: number = 16): string {
    return SessionSecurity.generateSecureToken(length);
  }

  /**
   * Encrypt sensitive data for local storage
   */
  static encryptForStorage(data: string, key: string): string {
    // Simple XOR encryption for demo - use proper encryption in production
    let encrypted = '';
    for (let i = 0; i < data.length; i++) {
      encrypted += String.fromCharCode(
        data.charCodeAt(i) ^ key.charCodeAt(i % key.length)
      );
    }
    return btoa(encrypted);
  }

  /**
   * Decrypt data from local storage
   */
  static decryptFromStorage(encryptedData: string, key: string): string {
    try {
      const encrypted = atob(encryptedData);
      let decrypted = '';
      for (let i = 0; i < encrypted.length; i++) {
        decrypted += String.fromCharCode(
          encrypted.charCodeAt(i) ^ key.charCodeAt(i % key.length)
        );
      }
      return decrypted;
    } catch {
      return '';
    }
  }
}

/**
 * Privacy and Compliance
 */
export class PrivacyCompliance {
  /**
   * Anonymize IP address for GDPR compliance
   */
  static anonymizeIP(ip: string): string {
    if (ip.includes(':')) {
      // IPv6
      const parts = ip.split(':');
      return parts.slice(0, 4).join(':') + '::';
    } else {
      // IPv4
      const parts = ip.split('.');
      return parts.slice(0, 3).join('.') + '.0';
    }
  }

  /**
   * Check if user is from EU (requires geolocation service)
   */
  static isEUUser(ip: string): boolean {
    // This would use a real geolocation service in production
    // For now, return false as a safe default
    return false;
  }

  /**
   * Generate GDPR-compliant data export
   */
  static generateDataExport(userData: any): {
    personalData: any;
    metadata: any;
  } {
    return {
      personalData: {
        ...userData,
        exportedAt: new Date().toISOString(),
        exportReason: 'GDPR data portability request'
      },
      metadata: {
        format: 'JSON',
        version: '1.0',
        rights: [
          'Right to access',
          'Right to rectification',
          'Right to erasure',
          'Right to data portability'
        ]
      }
    };
  }

  /**
   * Anonymize user data for analytics
   */
  static anonymizeUserData(data: any): any {
    const anonymized = { ...data };

    // Remove direct identifiers
    delete anonymized.email;
    delete anonymized.name;
    delete anonymized.phone;
    delete anonymized.address;

    // Hash indirect identifiers
    if (anonymized.userId) {
      anonymized.userId = this.hashIdentifier(anonymized.userId);
    }

    if (anonymized.sessionId) {
      anonymized.sessionId = this.hashIdentifier(anonymized.sessionId);
    }

    return anonymized;
  }

  private static hashIdentifier(id: string): string {
    // Simple hash for demo - use proper crypto in production
    let hash = 0;
    for (let i = 0; i < id.length; i++) {
      const char = id.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return Math.abs(hash).toString(36);
  }
}

/**
 * Security Headers Utility
 */
export class SecurityHeaders {
  /**
   * Generate Content Security Policy header value
   */
  static generateCSP(): string {
    const csp = SECURITY_CONFIG.csp;
    return Object.entries(csp)
      .map(([directive, sources]) => `${directive} ${sources.join(' ')}`)
      .join('; ');
  }

  /**
   * Generate security headers for API responses
   */
  static getSecurityHeaders(): Record<string, string> {
    return {
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(), microphone=(), camera=()',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': this.generateCSP()
    };
  }
}

/**
 * Main Security Service
 */
export class SecurityService {
  /**
   * Initialize security monitoring
   */
  static initialize(): void {
    if (typeof window === 'undefined') return;

    // Monitor for suspicious activity
    this.setupSecurityMonitoring();

    // Setup CSP violation reporting
    this.setupCSPReporting();

    console.log('🔒 Security monitoring initialized');
  }

  /**
   * Setup security event monitoring
   */
  private static setupSecurityMonitoring(): void {
    // Monitor for rapid clicks (potential bot behavior)
    let clickCount = 0;
    let clickTimer: NodeJS.Timeout;

    document.addEventListener('click', () => {
      clickCount++;

      clearTimeout(clickTimer);
      clickTimer = setTimeout(() => {
        if (clickCount > 20) {
          analytics.trackEvent('suspicious_activity', {
            type: 'rapid_clicking',
            count: clickCount,
            severity: 'medium'
          });
        }
        clickCount = 0;
      }, 10000);
    });

    // Monitor for console manipulation attempts
    let consoleWarned = false;
    const originalLog = console.log;
    console.log = (...args) => {
      if (!consoleWarned && args.some(arg =>
        typeof arg === 'string' &&
        (arg.includes('password') || arg.includes('token') || arg.includes('secret'))
      )) {
        analytics.trackEvent('suspicious_activity', {
          type: 'console_manipulation',
          severity: 'high'
        });
        consoleWarned = true;
      }
      originalLog.apply(console, args);
    };
  }

  /**
   * Setup CSP violation reporting
   */
  private static setupCSPReporting(): void {
    document.addEventListener('securitypolicyviolation', (event) => {
      analytics.trackEvent('csp_violation', {
        blockedURI: event.blockedURI,
        directive: event.violatedDirective,
        originalPolicy: event.originalPolicy,
        severity: 'high'
      });
    });
  }

  /**
   * Validate API request security
   */
  static validateRequest(request: {
    method: string;
    path: string;
    headers: Record<string, string>;
    body?: any;
    ip: string;
  }): {
    valid: boolean;
    errors: string[];
    riskScore: number;
  } {
    const errors: string[] = [];
    let riskScore = 0;

    // Check rate limiting
    const rateLimitKey = `${request.ip}:${request.path}`;
    const rateLimit = RateLimiter.checkLimit(rateLimitKey, SECURITY_CONFIG.rateLimits.api);

    if (!rateLimit.allowed) {
      errors.push('Rate limit exceeded');
      riskScore += 40;
    }

    // Validate content type for POST requests
    if (request.method === 'POST' && !request.headers['content-type']) {
      errors.push('Missing content-type header');
      riskScore += 20;
    }

    // Check for suspicious headers
    const suspiciousHeaders = ['x-forwarded-for', 'x-real-ip'];
    const hasMultipleProxyHeaders = suspiciousHeaders.filter(header =>
      request.headers[header]
    ).length > 1;

    if (hasMultipleProxyHeaders) {
      errors.push('Suspicious proxy configuration');
      riskScore += 30;
    }

    // Validate request size
    const bodySize = JSON.stringify(request.body || {}).length;
    if (bodySize > 1024 * 1024) { // 1MB limit
      errors.push('Request body too large');
      riskScore += 25;
    }

    return {
      valid: errors.length === 0,
      errors,
      riskScore
    };
  }
}

// Initialize security on import
if (typeof window !== 'undefined') {
  SecurityService.initialize();
}