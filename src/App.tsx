import { useState } from 'react'
import ResultPreparation from './components/ResultPreparation'
import { COPY } from './constants/copy'
import { getMinimumDurationMinutes } from './constants/pause'
import { PAUSE_THEMES } from './constants/themes'
import LandingScreen from './screens/LandingScreen'
import PauseScreen from './screens/PauseScreen'
import ReflectionScreen from './screens/ReflectionScreen'
import ResultScreen from './screens/ResultScreen'
import type { KeywordFont, PausePhase, PauseSession } from './types/pause'
import {
  getRecordImageFontEmbedStatus,
  prewarmRecordImageFonts,
} from './utils/createRecordImage'
import { logShareDebug } from './utils/shareDebug'

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
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null)
  const [isPreparingResult, setIsPreparingResult] = useState(false)
  const [resultPreparationError, setResultPreparationError] = useState('')
  const [currentTheme, setCurrentTheme] = useState(() => getRandomTheme())
  const [minimumDurationMinutes] = useState(() =>
    getMinimumDurationMinutes(window.location.search),
  )
  const minimumDurationMs = Math.round(minimumDurationMinutes * 60_000)

  const handleStart = () => {
    const startedAt = Date.now()
    const interactionStartedAt = performance.now()

    logShareDebug('meditation-start', {
      startedAt,
    })

    setPreparedShareFile(null)
    setIsPreparingResult(false)
    setResultPreparationError('')
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

    window.requestAnimationFrame(() => {
      logShareDebug('first-hourglass-paint', {
        elapsedMs: performance.now() - interactionStartedAt,
      })
      window.setTimeout(() => {
        void prewarmRecordImageFonts()
      }, 0)
    })
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
    logShareDebug('reflection-entered', {
      elapsedMs: durationMs,
    })
    setPhase('reflection')
  }

  const handleRestart = () => {
    setSession(initialSession)
    setPreparedShareFile(null)
    setIsPreparingResult(false)
    setResultPreparationError('')
    setCurrentTheme((theme) => getRandomTheme(theme.id))
    setPhase('landing')
  }

  const handleReflectionComplete = (
    keyword: string,
    note: string,
    place: string,
    keywordFont: KeywordFont,
  ) => {
    const fontEmbedStatus = getRecordImageFontEmbedStatus()

    logShareDebug('reflection-submit', {
      keywordFont,
      hasNote: note.trim() !== '',
      hasPlace: place.trim() !== '',
    })
    logShareDebug('record-submit', {
      keywordFont,
      fontEmbedCacheHit: fontEmbedStatus === 'ready',
      fontEmbedSource:
        fontEmbedStatus === 'ready'
          ? 'prewarmed'
          : fontEmbedStatus === 'in-flight'
            ? 'in-flight-promise'
            : 'generated',
    })
    setPreparedShareFile(null)
    setResultPreparationError('')
    setSession((currentSession) => ({
      ...currentSession,
      keyword,
      note,
      place,
      keywordFont,
    }))
    setIsPreparingResult(true)
  }

  const handleResultPrepared = (file: File) => {
    setPreparedShareFile(file)
    setIsPreparingResult(false)
    setPhase('result')
  }

  const handleResultPreparationError = () => {
    setIsPreparingResult(false)
    setResultPreparationError(COPY.preparingResult.error)
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
      <>
        <ReflectionScreen
          keyword={session.keyword}
          note={session.note}
          place={session.place}
          keywordFont={session.keywordFont}
          postitColor={theme.postit}
          isPreparingResult={isPreparingResult}
          preparationError={resultPreparationError}
          onComplete={handleReflectionComplete}
          onKeywordFontChange={(keywordFont) => {
            setSession((currentSession) => ({
              ...currentSession,
              keywordFont,
            }))
          }}
        />
        {isPreparingResult && (
          <ResultPreparation
            session={session}
            onPrepared={handleResultPrepared}
            onError={handleResultPreparationError}
          />
        )}
      </>
    )
  }

  if (phase === 'result' && preparedShareFile !== null) {
    return (
      <ResultScreen
        session={session}
        preparedShareFile={preparedShareFile}
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
