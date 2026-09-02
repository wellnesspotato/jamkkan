import { COPY } from './copy'

export const DEFAULT_MINIMUM_DURATION_MINUTES = 1
export const MINIMUM_DURATION_MINUTES = 0.05
export const MAXIMUM_DURATION_MINUTES = 180

export function getMinimumDurationMinutes(search: string) {
  const raw = new URLSearchParams(search).get('session')
  const minutes =
    raw !== null && /^(?:\d+(?:\.\d+)?|\.\d+)$/.test(raw)
      ? Number(raw)
      : null

  if (
    minutes !== null &&
    Number.isFinite(minutes) &&
    minutes >= MINIMUM_DURATION_MINUTES &&
    minutes <= MAXIMUM_DURATION_MINUTES
  ) {
    return minutes
  }

  return DEFAULT_MINIMUM_DURATION_MINUTES
}

export function formatDurationMinutes(minutes: number) {
  const totalSeconds = Math.max(0, Math.round(minutes * 60))
  const hours = Math.floor(totalSeconds / 3_600)
  const remainingMinutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []

  if (hours > 0) {
    parts.push(COPY.time.hours(hours))
  }

  if (remainingMinutes > 0) {
    parts.push(COPY.time.minutes(remainingMinutes))
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(COPY.time.seconds(seconds))
  }

  return parts.join(' ')
}
