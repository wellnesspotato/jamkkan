import { useEffect, useState, type KeyboardEvent } from 'react'
import BrandLogo from '../components/BrandLogo'
import Hourglass from '../components/Hourglass'
import { COPY } from '../constants/copy'
import { formatDurationMinutes } from '../constants/pause'

type PauseScreenProps = {
  startedAt: number | null
  sandColor: string
  minimumDurationMs: number
  minimumDurationMinutes: number
  onEnd: () => void
}

function PauseScreen({
  startedAt,
  sandColor,
  minimumDurationMs,
  minimumDurationMinutes,
  onEnd,
}: PauseScreenProps) {
  const [elapsedMs, setElapsedMs] = useState(() =>
    startedAt === null ? 0 : Date.now() - startedAt,
  )

  useEffect(() => {
    if (startedAt === null) {
      return
    }

    const updateElapsedTime = () => {
      setElapsedMs(Date.now() - startedAt)
    }

    updateElapsedTime()
    const intervalId = window.setInterval(updateElapsedTime, 250)

    return () => window.clearInterval(intervalId)
  }, [startedAt])

  const hasReachedMinimum = elapsedMs >= minimumDurationMs
  const progress = Math.min(elapsedMs / minimumDurationMs, 1)

  useEffect(() => {
    let wakeLock: WakeLockSentinel | null = null
    let isRequestingWakeLock = false
    let isUnmounted = false

    const requestWakeLock = async () => {
      if (
        !('wakeLock' in navigator) ||
        document.visibilityState !== 'visible' ||
        wakeLock !== null ||
        isRequestingWakeLock
      ) {
        return
      }

      isRequestingWakeLock = true

      try {
        const requestedWakeLock = await navigator.wakeLock.request('screen')

        if (isUnmounted || document.visibilityState !== 'visible') {
          await requestedWakeLock.release()
          return
        }

        wakeLock = requestedWakeLock
        requestedWakeLock.addEventListener(
          'release',
          () => {
            if (wakeLock === requestedWakeLock) {
              wakeLock = null
            }
          },
          { once: true },
        )
      } catch {
        // Wake Lock is an optional enhancement.
      } finally {
        isRequestingWakeLock = false
      }
    }

    const releaseWakeLock = async () => {
      const currentWakeLock = wakeLock
      wakeLock = null

      if (currentWakeLock !== null && !currentWakeLock.released) {
        try {
          await currentWakeLock.release()
        } catch {
          // It may already have been released by the browser.
        }
      }
    }

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        void requestWakeLock()
      }
    }

    void requestWakeLock()
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      isUnmounted = true
      document.removeEventListener('visibilitychange', handleVisibilityChange)
      void releaseWakeLock()
    }
  }, [])

  const handleKeyDown = (event: KeyboardEvent<HTMLElement>) => {
    if (
      hasReachedMinimum &&
      (event.key === 'Enter' || event.key === ' ')
    ) {
      event.preventDefault()
      onEnd()
    }
  }

  return (
    <main
      className={`pause-shell pause-screen${hasReachedMinimum ? ' pause-screen--open' : ''}`}
      onClick={hasReachedMinimum ? onEnd : undefined}
      onKeyDown={handleKeyDown}
      role={hasReachedMinimum ? 'button' : undefined}
      tabIndex={hasReachedMinimum ? 0 : undefined}
    >
      <header className="logo-stage">
        <BrandLogo />
      </header>
      <div className="pause-layout">
        <div className="hourglass-stage">
          <Hourglass progress={progress} color={sandColor} />
        </div>
        <div className="message-stage">
          {hasReachedMinimum ? (
            <p className="pause-open-message">
              <span>
                {COPY.pause.milestoneTitle(
                  formatDurationMinutes(minimumDurationMinutes),
                )}
              </span>
              <span>
                {COPY.pause.milestoneBodyLines[0]}
                <br />
                {COPY.pause.milestoneBodyLines[1]}
              </span>
              <span>
                {COPY.pause.milestoneActionLines[0]}
                <br />
                {COPY.pause.milestoneActionLines[1]}
              </span>
            </p>
          ) : (
            <p className="pause-intro">
              {COPY.pause.initialLines[0]}
              <br />
              {COPY.pause.initialLines[1]}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default PauseScreen
