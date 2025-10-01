// Dynamic URL handling - only ONE environment variable changes for production
export const APP_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3002';

// API endpoints
export const API_ENDPOINTS = {
  auth: `${APP_URL}/api/auth`,
  events: `${APP_URL}/api/events`,
  streams: `${APP_URL}/api/streams`,
  registration: `${APP_URL}/api/registration`,
  chat: `${APP_URL}/api/chat`,
  ai: `${APP_URL}/api/ai`,
  payments: `${APP_URL}/api/payments`,
  analytics: `${APP_URL}/api/analytics`,
  webhooks: `${APP_URL}/api/webhooks`,
} as const;

// WebSocket endpoints
export const SOCKET_ENDPOINTS = {
  stream: `${APP_URL}`,
  chat: `${APP_URL}/chat`,
} as const;

// ConvertCast Branded Features
export const FEATURES = {
  SHOWUP_SURGE: 'ShowUp Surge™',
  ENGAGE_MAX: 'EngageMax™',
  AUTO_OFFER: 'AutoOffer™',
  AI_LIVE_CHAT: 'AI Live Chat',
  INSIGHT_ENGINE: 'InsightEngine™',
  SMART_SCHEDULER: 'SmartScheduler',
} as const;

// Intent Score Ranges (Casino Style)
export const INTENT_SCORES = {
  COLD: { min: 0, max: 20, emoji: '❄️', color: 'blue', label: 'COLD' },
  WARMING: { min: 21, max: 50, emoji: '🌡️', color: 'yellow', label: 'WARMING' },
  HOT: { min: 51, max: 80, emoji: '🔥', color: 'orange', label: 'HOT' },
  JACKPOT: { min: 81, max: 100, emoji: '🎰', color: 'red', label: 'JACKPOT' },
} as const;

// AutoOffer™ Triggers
export const AUTO_OFFER_TRIGGERS = {
  DYNAMIC_PRICING: 70,
  URGENCY_OVERLAY: 85,
  SCARCITY_MESSAGE: 95,
} as const;

// Default Settings
export const DEFAULTS = {
  timezone: 'America/New_York',
  session_duration: 30, // days
  max_attendees: 1000,
  stream_quality: '1080p',
} as const;