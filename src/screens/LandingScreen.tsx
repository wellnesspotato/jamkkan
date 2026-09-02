import { useRef } from 'react'
import Hourglass from '../components/Hourglass'
import PauseLayout from '../components/PauseLayout'
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
      <PauseLayout
        hourglass={
          <>
            <button
              className="hourglass-button"
              type="button"
              aria-label={COPY.landing.startAriaLabel}
              onClick={handleStart}
            >
              <Hourglass progress={1} color={sandColor} />
            </button>
          </>
        }
        title={
          COPY.landing.titleLines[0]
        }
        description={
          <>
            <p className="pause-layout-description">
              {COPY.landing.descriptionLines[0]}
              <br />
              {COPY.landing.descriptionLines[1]}
            </p>
            {minimumDurationMinutes > 1 && (
              <p className="session-duration-note">
                {COPY.landing.longSession(
                  formatDurationMinutes(minimumDurationMinutes),
                )}
              </p>
            )}
          </>
        }
      />
    </main>
  )
}

export default LandingScreen
