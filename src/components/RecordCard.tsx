import { forwardRef } from 'react'
import BrandLogo from './BrandLogo'
import { COPY } from '../constants/copy'
import { PAUSE_THEMES } from '../constants/themes'
import type { PauseSession } from '../types/pause'

type RecordCardProps = {
  session: PauseSession
}

function formatDate(startedAt: number) {
  const date = new Date(startedAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}.${month}.${day}`
}

function formatTime(timestamp: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(timestamp))
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1_000)
  const hours = Math.floor(totalSeconds / 3_600)
  const minutes = Math.floor((totalSeconds % 3_600) / 60)
  const seconds = totalSeconds % 60
  const parts: string[] = []

  if (hours > 0) {
    parts.push(COPY.time.hours(hours))
  }

  if (minutes > 0) {
    parts.push(COPY.time.minutes(minutes))
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(COPY.time.seconds(seconds))
  }

  return parts.join(' ')
}

const RecordCard = forwardRef<HTMLElement, RecordCardProps>(function RecordCard(
  { session },
  ref,
) {
  const theme =
    PAUSE_THEMES.find(({ id }) => id === session.themeId) ?? PAUSE_THEMES[0]
  const startedAtDateTime =
    session.startedAt === null ? undefined : new Date(session.startedAt).toISOString()
  const endedAtDateTime =
    session.endedAt === null ? undefined : new Date(session.endedAt).toISOString()

  return (
    <article ref={ref} className="record-card">
      <header className="record-card-header">
        <BrandLogo />
      </header>

      {session.startedAt !== null && (
        <div className="record-time-block">
          <time className="record-date" dateTime={startedAtDateTime}>
            {formatDate(session.startedAt)}
          </time>
          {session.endedAt !== null && (
            <p className="record-time-range">
              <time dateTime={startedAtDateTime}>
                {formatTime(session.startedAt)}
              </time>
              <span aria-hidden="true"> - </span>
              <time dateTime={endedAtDateTime}>
                {formatTime(session.endedAt)}
              </time>
            </p>
          )}
          {session.durationMs !== null && (
            <p className="record-duration">
              {COPY.result.duration(formatDuration(session.durationMs))}
            </p>
          )}
        </div>
      )}

      <div
        className="keyword-postit record-keyword-postit"
        style={{ backgroundColor: theme.postit }}
      >
        <p className="record-keyword">{session.keyword}</p>
      </div>

      {(session.note !== '' || session.place !== '') && (
        <div className="record-details">
          {session.note !== '' && <p className="record-note">{session.note}</p>}
          {session.place !== '' && (
            <p className="record-place">
              <svg
                className="record-place-icon"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M20 10c0 5-8 11-8 11S4 15 4 10a8 8 0 1 1 16 0Z" />
                <circle cx="12" cy="10" r="2.5" />
              </svg>
              <span>{COPY.result.place(session.place)}</span>
            </p>
          )}
        </div>
      )}
    </article>
  )
})

export default RecordCard
