import { useId } from 'react'

type HourglassProps = {
  progress: number
  color: string
  flipped?: boolean
}

function Hourglass({ progress, color, flipped = false }: HourglassProps) {
  const clipPathId = useId().replaceAll(':', '')
  const normalizedProgress = Math.min(Math.max(progress, 0), 1)
  const sandHeight = 48
  const upperSandHeight = sandHeight * (1 - normalizedProgress)
  const upperSandY = 76 - upperSandHeight
  const lowerSandHeight = sandHeight * normalizedProgress
  const lowerSandY = 132 - lowerSandHeight
  const isFlowing = normalizedProgress > 0 && normalizedProgress < 1

  return (
    <svg
      className={`hourglass${flipped ? ' hourglass--flipped' : ''}`}
      viewBox="0 0 120 160"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipPathId}>
          <path d="M25 22h70c0 30-13 43-29 56-2 2-2 3 0 5 16 13 29 26 29 55H25c0-29 13-42 29-55 2-2 2-3 0-5-16-13-29-26-29-56Z" />
        </clipPath>
      </defs>

      <path
        className="hourglass-glass"
        d="M25 22h70c0 30-13 43-29 56-2 2-2 3 0 5 16 13 29 26 29 55H25c0-29 13-42 29-55 2-2 2-3 0-5-16-13-29-26-29-56Z"
      />

      <g clipPath={`url(#${clipPathId})`} fill={color}>
        <rect
          className="hourglass-sand"
          x="25"
          y={upperSandY}
          width="70"
          height={upperSandHeight}
        />
        {isFlowing && <rect x="58.5" y="73" width="3" height="30" rx="1.5" />}
        <rect
          className="hourglass-sand"
          x="25"
          y={lowerSandY}
          width="70"
          height={lowerSandHeight}
        />
      </g>

      <g className="hourglass-frame">
        <rect x="16" y="14" width="88" height="10" rx="5" />
        <rect x="16" y="136" width="88" height="10" rx="5" />
        <path d="M23 24v112M97 24v112" />
      </g>
    </svg>
  )
}

export default Hourglass
