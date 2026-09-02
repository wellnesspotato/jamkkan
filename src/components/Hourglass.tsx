import { useId } from 'react'

const STREAM_FADE_START_UPPER_SAND_HEIGHT = 1.5
const UPPER_SAND_END_REMAINING = 0.015
const UPPER_SAND_END_EPSILON = 0.000_001

type HourglassProps = {
  progress: number
  color: string
}

function Hourglass({ progress, color }: HourglassProps) {
  const clipPathId = useId().replaceAll(':', '')
  const normalizedProgress = Math.min(Math.max(progress, 0), 1)
  const sandHeight = 52
  const upperSandBottomY = 80
  const lowerSandBottomY = 136
  const remainingProgress = Math.max(0, 1 - normalizedProgress)
  const upperSandEndHeight = sandHeight * UPPER_SAND_END_REMAINING
  const upperSandHeight =
    remainingProgress <= UPPER_SAND_END_REMAINING + UPPER_SAND_END_EPSILON
      ? 0
      : sandHeight * remainingProgress
  const upperSandY = upperSandBottomY - upperSandHeight
  const upperSandCurveY = Math.min(upperSandY + 2, upperSandBottomY)
  const lowerSandHeight = sandHeight * normalizedProgress
  const lowerSandY = lowerSandBottomY - lowerSandHeight
  const lowerMoundHeight = Math.min(3, lowerSandHeight / 2)
  const lowerSandSurfaceY = lowerSandY - lowerMoundHeight
  const streamEndY = lowerSandY + 0.75
  const streamOpacity = Math.min(
    1,
    Math.max(
      0,
      (upperSandHeight - upperSandEndHeight) /
        (STREAM_FADE_START_UPPER_SAND_HEIGHT -
          upperSandEndHeight),
    ),
  )
  const isFlowing =
    normalizedProgress > 0 &&
    upperSandHeight > 0
  const glassPath =
    'M27 24h66c-1 24-11 39-27 52-4 3-4 5 0 8 16 13 26 28 27 52H27c1-24 11-39 27-52 4-3 4-5 0-8-16-13-26-28-27-52Z'

  return (
    <svg
      className="hourglass"
      viewBox="0 0 120 160"
      aria-hidden="true"
      focusable="false"
    >
      <defs>
        <clipPath id={clipPathId}>
          <path d={glassPath} />
        </clipPath>
      </defs>

      <path className="hourglass-glass" d={glassPath} />

      <g clipPath={`url(#${clipPathId})`} fill={color}>
        {upperSandHeight > 0 && (
          <path
            className="hourglass-sand"
            d={`M24 ${upperSandY} Q60 ${upperSandCurveY} 96 ${upperSandY} V${upperSandBottomY} H24 Z`}
          />
        )}
        {lowerSandHeight > 0 && (
          <path
            className="hourglass-sand"
            d={`M24 138 H96 V${lowerSandY + lowerMoundHeight} Q60 ${lowerSandSurfaceY} 24 ${lowerSandY + lowerMoundHeight} Z`}
          />
        )}
      </g>

      {isFlowing && (
        <line
          className="hourglass-stream"
          x1="60"
          y1={upperSandBottomY}
          x2="60"
          y2={streamEndY}
          stroke={color}
          opacity={streamOpacity}
        />
      )}

      <g className="hourglass-frame">
        <path d="M18 20h84M18 140h84" />
        <path d="M24 24v112M96 24v112" />
      </g>
    </svg>
  )
}

export default Hourglass
