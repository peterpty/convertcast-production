import { type ClassValue, clsx } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatDate(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(new Date(date))
}

export function formatTime(date: string | Date) {
  return new Intl.DateTimeFormat('en-US', {
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(new Date(date))
}

export function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

export function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^\w\s-]/g, '')
    .replace(/[\s_-]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

export function capitalize(text: string) {
  return text.charAt(0).toUpperCase() + text.slice(1)
}

export function truncate(text: string, length: number) {
  return text.length <= length ? text : text.substring(0, length) + '...'
}

export function calculateIntentScore(metrics: {
  timeSpent?: number
  interactions?: number
  engagement?: number
  purchaseHistory?: number
}) {
  const { timeSpent = 0, interactions = 0, engagement = 0, purchaseHistory = 0 } = metrics

  // ConvertCast proprietary intent scoring algorithm
  const timeWeight = Math.min(timeSpent / 300, 1) * 25 // Max 25 points for 5+ minutes
  const interactionWeight = Math.min(interactions / 10, 1) * 30 // Max 30 points for 10+ interactions
  const engagementWeight = engagement * 25 // Max 25 points for high engagement
  const historyWeight = Math.min(purchaseHistory / 3, 1) * 20 // Max 20 points for purchase history

  return Math.round(timeWeight + interactionWeight + engagementWeight + historyWeight)
}

export function getIntentScoreLabel(score: number) {
  if (score >= 90) return { label: 'JACKPOT', color: 'text-green-500' }
  if (score >= 75) return { label: 'HOT LEAD', color: 'text-orange-500' }
  if (score >= 60) return { label: 'WARM', color: 'text-yellow-500' }
  if (score >= 40) return { label: 'LUKEWARM', color: 'text-blue-500' }
  return { label: 'COLD', color: 'text-gray-500' }
}