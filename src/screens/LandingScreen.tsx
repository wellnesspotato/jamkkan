import BrandLogo from '../components/BrandLogo'
import { useEffect, useRef, useState } from 'react'
import Hourglass from '../components/Hourglass'
import { COPY } from '../constants/copy'
import { formatDurationMinutes } from '../constants/pause'

const FLIP_DURATION_MS = 520
const FLIP_FALLBACK_MS = 650

type LandingScreenProps = {
  sandColor: string
  minimumDurationMinutes: number
  onStart: () => void
  onFlipComplete: () => void
}

function LandingScreen({
  sandColor,
  minimumDurationMinutes,
  onStart,
  onFlipComplete,
}: LandingScreenProps) {
  const [isStarting, setIsStarting] = useState(false)
  const hourglassRef = useRef<HTMLDivElement>(null)
  const isStartingRef = useRef(false)
  const hasCompletedFlipRef = useRef(false)
  const isUnmountingRef = useRef(false)
  const flipAnimationRef = useRef<Animation | null>(null)
  const flipTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const completeFlip = () => {
    if (hasCompletedFlipRef.current) {
      return
    }

    hasCompletedFlipRef.current = true

    if (flipTimeoutRef.current !== null) {
      window.clearTimeout(flipTimeoutRef.current)
      flipTimeoutRef.current = null
    }

    onFlipComplete()
  }

  useEffect(() => {
    return () => {
      isUnmountingRef.current = true

      if (flipTimeoutRef.current !== null) {
        window.clearTimeout(flipTimeoutRef.current)
      }

      flipAnimationRef.current?.cancel()
    }
  }, [])

  const handleStart = () => {
    if (isStartingRef.current) {
      return
    }

    isStartingRef.current = true
    setIsStarting(true)
    onStart()

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      completeFlip()
      return
    }

    const hourglassElement = hourglassRef.current

    if (
      hourglassElement === null ||
      typeof hourglassElement.animate !== 'function'
    ) {
      completeFlip()
      return
    }

    try {
      const animation = hourglassElement.animate(
        [
          { transform: 'rotate(0deg)' },
          { transform: 'rotate(180deg)' },
        ],
        {
          duration: FLIP_DURATION_MS,
          easing: 'ease-in-out',
          fill: 'forwards',
        },
      )

      flipAnimationRef.current = animation
      flipTimeoutRef.current = window.setTimeout(
        completeFlip,
        FLIP_FALLBACK_MS,
      )

      void animation.finished.then(completeFlip).catch(() => {
        if (!isUnmountingRef.current) {
          completeFlip()
        }
      })
    } catch {
      completeFlip()
    }
  }

  return (
    <main className="pause-shell landing-screen">
      <header className="logo-stage">
        <BrandLogo />
      </header>
      <div className="pause-layout">
        <div className="hourglass-stage">
          <button
            className="hourglass-button"
            type="button"
            aria-label={COPY.landing.startAriaLabel}
            onClick={handleStart}
            disabled={isStarting}
          >
            <div ref={hourglassRef} className="hourglass-flip-layer">
              <Hourglass progress={1} color={sandColor} />
            </div>
          </button>
        </div>
        <div className="message-stage landing-message">
          <p className="landing-instruction">
            {COPY.landing.instructionLines[0]}
            <br />
            {COPY.landing.instructionLines[1]}
          </p>
          {minimumDurationMinutes > 1 && (
            <p className="session-duration-note">
              {COPY.landing.longSession(
                formatDurationMinutes(minimumDurationMinutes),
              )}
            </p>
          )}
          <p className="secondary-text">
            {COPY.landing.supportingLines[0]}
            <br />
            {COPY.landing.supportingLines[1]}
          </p>
        </div>
      </div>
    </main>
  )
}

export default LandingScreen
