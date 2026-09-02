import { useEffect, useRef, useState } from 'react'
import Hourglass from '../components/Hourglass'
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
    <main className="screen landing-screen">
      <div className="screen-content landing-content">
        <h1 className="landing-title">잠깐명상</h1>
        <button
          className="hourglass-button"
          type="button"
          aria-label="잠깐명상 시작하기"
          onClick={handleStart}
          disabled={isStarting}
        >
          <div ref={hourglassRef} className="hourglass-flip-layer">
            <Hourglass progress={1} color={sandColor} />
          </div>
        </button>
        <p className="landing-instruction">
          화면을 터치해
          <br />
          모래시계를 뒤집어보세요.
        </p>
        {minimumDurationMinutes > 1 && (
          <p className="session-duration-note">
            {formatDurationMinutes(minimumDurationMinutes)} 동안 머물러요.
          </p>
        )}
        <p className="secondary-text">
          휴대폰을 내려놓고
          <br />
          잠깐 주변을 바라봐요.
        </p>
      </div>
    </main>
  )
}

export default LandingScreen
