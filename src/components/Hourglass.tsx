import { useId } from 'react'

const STREAM_FADE_START_UPPER_SAND_HEIGHT = 1.5
const UPPER_SAND_END_REMAINING = 0.015
const UPPER_SAND_END_EPSILON = 0.000_001

type HourglassProps = {
  progress: number
  color: string
}

function Hourglass({ progress, color }: HourglassProps) {
  const idPrefix = useId().replaceAll(':', '')
  const clipPathId = `${idPrefix}-glass-clip`
  const frameRailGradientId = `${idPrefix}-frame-rail-gradient`
  const framePostGradientId = `${idPrefix}-frame-post-gradient`
  const glassGradientId = `${idPrefix}-glass-gradient`
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
        <linearGradient id={frameRailGradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="var(--hourglass-frame-highlight)" />
          <stop offset="0.42" stopColor="var(--hourglass-frame-base)" />
          <stop offset="0.72" stopColor="var(--hourglass-frame-base)" />
          <stop offset="1" stopColor="var(--hourglass-frame-shadow)" />
        </linearGradient>
        <linearGradient id={framePostGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="var(--hourglass-frame-highlight)" />
          <stop offset="0.38" stopColor="var(--hourglass-frame-base)" />
          <stop offset="0.68" stopColor="var(--hourglass-frame-base)" />
          <stop offset="1" stopColor="var(--hourglass-frame-shadow)" />
        </linearGradient>
        <linearGradient id={glassGradientId} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.14" />
          <stop offset="0.48" stopColor="#FFFFFF" stopOpacity="0.04" />
          <stop offset="1" stopColor="#FFFFFF" stopOpacity="0.08" />
        </linearGradient>
        <clipPath id={clipPathId}>
          <path d={glassPath} />
        </clipPath>
      </defs>

      <g className="hourglass-glass">
        <path
          className="hourglass-glass-body"
          d={glassPath}
          fill={`url(#${glassGradientId})`}
        />
      </g>

      <g className="hourglass-sand" clipPath={`url(#${clipPathId})`} fill={color}>
        {upperSandHeight > 0 && (
          <path
            d={`M24 ${upperSandY} Q60 ${upperSandCurveY} 96 ${upperSandY} V${upperSandBottomY} H24 Z`}
          />
        )}
        {lowerSandHeight > 0 && (
          <path
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

      <g className="hourglass-glass-front">
        <path className="hourglass-glass-inner-edge" d={glassPath} />
        <g className="hourglass-glass-highlights" clipPath={`url(#${clipPathId})`}>
          <path d="M38.5 35C39.5 47 44 58.5 51.5 67" />
          <path d="M51.5 93C44 102.5 39.5 114 38.5 125" />
        </g>
      </g>

      <g className="hourglass-frame">
        <rect x="21.5" y="23" width="6" height="114" rx="3" fill={`url(#${framePostGradientId})`} />
        <rect x="92.5" y="23" width="6" height="114" rx="3" fill={`url(#${framePostGradientId})`} />
        <rect x="17" y="17" width="86" height="8" rx="4" fill={`url(#${frameRailGradientId})`} />
        <rect x="17" y="135" width="86" height="8" rx="4" fill={`url(#${frameRailGradientId})`} />
      </g>
    </svg>
  )
}

export default Hourglass
