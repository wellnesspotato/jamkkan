export const DEFAULT_MINIMUM_DURATION_MINUTES = 1
export const MAXIMUM_DURATION_MINUTES = 180

export function getMinimumDurationMinutes(search: string) {
  const raw = new URLSearchParams(search).get('session')
  const minutes = raw !== null && /^\d+$/.test(raw) ? Number(raw) : null

  if (
    minutes !== null &&
    Number.isSafeInteger(minutes) &&
    minutes >= DEFAULT_MINIMUM_DURATION_MINUTES &&
    minutes <= MAXIMUM_DURATION_MINUTES
  ) {
    return minutes
  }

  return DEFAULT_MINIMUM_DURATION_MINUTES
}

export function formatDurationMinutes(minutes: number) {
  const hours = Math.floor(minutes / 60)
  const remainingMinutes = minutes % 60

  if (hours === 0) {
    return `${minutes}분`
  }

  return remainingMinutes === 0
    ? `${hours}시간`
    : `${hours}시간 ${remainingMinutes}분`
}
