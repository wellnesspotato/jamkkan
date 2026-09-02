import { useRef } from 'react'
import Hourglass from '../components/Hourglass'
import { COPY } from '../constants/copy'
import { formatDurationMinutes } from '../constants/pause'

type LandingScreenProps = {
  sandColor: string
  minimumDurationMinutes: number
  onStart: () => void
}

function LandingScreen({
  sandColor,
  minimumDurationMinutes,
  onStart,
}: LandingScreenProps) {
  const hasStartedRef = useRef(false)

  const handleStart = () => {
    if (hasStartedRef.current) {
      return
    }

    hasStartedRef.current = true
    onStart()
  }

  return (
    <main className="pause-shell landing-screen">
      <div className="pause-layout">
        <div className="hourglass-stage">
          <div className="hourglass-viewport">
            <button
              className="hourglass-button"
              type="button"
              aria-label={COPY.landing.startAriaLabel}
              onClick={handleStart}
            >
              <Hourglass progress={1} color={sandColor} />
            </button>
          </div>
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
