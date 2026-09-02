import { useState } from 'react'
import { getMinimumDurationMinutes } from './constants/pause'
import { PAUSE_THEMES } from './constants/themes'
import LandingScreen from './screens/LandingScreen'
import PauseScreen from './screens/PauseScreen'
import ReflectionScreen from './screens/ReflectionScreen'
import ResultScreen from './screens/ResultScreen'
import type { KeywordFont, PausePhase, PauseSession } from './types/pause'

const initialSession: PauseSession = {
  startedAt: null,
  endedAt: null,
  durationMs: null,
  keyword: '',
  note: '',
  place: '',
  themeId: '',
  keywordFont: 'sans',
}

function getRandomTheme(excludedThemeId?: string) {
  const themes =
    excludedThemeId === undefined
      ? PAUSE_THEMES
      : PAUSE_THEMES.filter(({ id }) => id !== excludedThemeId)

  return themes[Math.floor(Math.random() * themes.length)]
}

function App() {
  const [phase, setPhase] = useState<PausePhase>('landing')
  const [session, setSession] = useState<PauseSession>(initialSession)
  const [currentTheme, setCurrentTheme] = useState(() => getRandomTheme())
  const [minimumDurationMinutes] = useState(() =>
    getMinimumDurationMinutes(window.location.search),
  )
  const minimumDurationMs = Math.round(minimumDurationMinutes * 60_000)

  const handleStart = () => {
    const startedAt = Date.now()

    setSession({
      startedAt,
      endedAt: null,
      durationMs: null,
      keyword: '',
      note: '',
      place: '',
      themeId: currentTheme.id,
      keywordFont: 'sans',
    })
    setPhase('pausing')
  }

  const handleSessionEnd = () => {
    if (session.startedAt === null) {
      return
    }

    const endedAt = Date.now()
    const durationMs = endedAt - session.startedAt

    setSession((currentSession) => ({
      ...currentSession,
      endedAt,
      durationMs,
    }))
    setPhase('reflection')
  }

  const handleRestart = () => {
    setSession(initialSession)
    setCurrentTheme((theme) => getRandomTheme(theme.id))
    setPhase('landing')
  }

  const handleReflectionComplete = (
    keyword: string,
    note: string,
    place: string,
    keywordFont: KeywordFont,
  ) => {
    setSession((currentSession) => ({
      ...currentSession,
      keyword,
      note,
      place,
      keywordFont,
    }))
    setPhase('result')
  }

  if (phase === 'pausing') {
    const theme =
      PAUSE_THEMES.find(({ id }) => id === session.themeId) ?? PAUSE_THEMES[0]

    return (
      <PauseScreen
        startedAt={session.startedAt}
        sandColor={theme.sand}
        minimumDurationMs={minimumDurationMs}
        minimumDurationMinutes={minimumDurationMinutes}
        onEnd={handleSessionEnd}
      />
    )
  }

  if (phase === 'reflection') {
    const theme =
      PAUSE_THEMES.find(({ id }) => id === session.themeId) ?? PAUSE_THEMES[0]

    return (
      <ReflectionScreen
        keyword={session.keyword}
        note={session.note}
        place={session.place}
        keywordFont={session.keywordFont}
        postitColor={theme.postit}
        onComplete={handleReflectionComplete}
        onKeywordFontChange={(keywordFont) => {
          setSession((currentSession) => ({
            ...currentSession,
            keywordFont,
          }))
        }}
      />
    )
  }

  if (phase === 'result') {
    return (
      <ResultScreen
        session={session}
        onRestart={handleRestart}
      />
    )
  }

  return (
    <LandingScreen
      sandColor={currentTheme.sand}
      minimumDurationMinutes={minimumDurationMinutes}
      onStart={handleStart}
    />
  )
}

export default App
