import { forwardRef } from 'react'
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
    parts.push(`${hours}시간`)
  }

  if (minutes > 0) {
    parts.push(`${minutes}분`)
  }

  if (seconds > 0 || parts.length === 0) {
    parts.push(`${seconds}초`)
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
    <article
      ref={ref}
      className="record-card"
      style={{ backgroundColor: theme.postit }}
    >
      <header className="record-card-header">
        <h1 className="record-title">잠깐, 멈춘 기록</h1>
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
                {formatDuration(session.durationMs)} 머물렀어요.
              </p>
            )}
          </div>
        )}
      </header>

      <p className="record-keyword">{session.keyword}</p>

      {session.note !== '' && <p className="record-note">{session.note}</p>}
      {session.place !== '' && (
        <p className="record-place">{session.place}에서</p>
      )}
    </article>
  )
})

export default RecordCard
