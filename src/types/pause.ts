export type PausePhase = 'landing' | 'pausing' | 'reflection' | 'result'

export type KeywordFont = 'sans' | 'serif' | 'daughter' | 'newlywed'

export type PauseSession = {
  startedAt: number | null
  endedAt: number | null
  durationMs: number | null
  keyword: string
  note: string
  place: string
  themeId: string
  keywordFont: KeywordFont
}
