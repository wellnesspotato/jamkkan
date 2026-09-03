export type TimeOfDay = 'morning' | 'afternoon' | 'evening'

export function getTimeOfDayOverride(): TimeOfDay | undefined {
  const value = new URLSearchParams(window.location.search).get('timeOfDay')

  return value === 'morning' || value === 'afternoon' || value === 'evening'
    ? value
    : undefined
}

export function getTimeOfDay(timestamp: number): TimeOfDay {
  const hour = new Date(timestamp).getHours()

  if (hour >= 5 && hour < 12) {
    return 'morning'
  }

  if (hour >= 12 && hour < 18) {
    return 'afternoon'
  }

  return 'evening'
}
