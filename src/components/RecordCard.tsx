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

function formatStartTime(startedAt: number) {
  return new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(startedAt))
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1_000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60

  return seconds === 0 ? `${minutes}분` : `${minutes}분 ${seconds}초`
}

const RecordCard = forwardRef<HTMLElement, RecordCardProps>(function RecordCard(
  { session },
  ref,
) {
  const theme =
    PAUSE_THEMES.find(({ id }) => id === session.themeId) ?? PAUSE_THEMES[0]
  const startedAtDateTime =
    session.startedAt === null ? undefined : new Date(session.startedAt).toISOString()

  return (
    <article
      ref={ref}
      className="record-card"
      style={{ borderTopColor: theme.sand }}
    >
      <header className="record-card-header">
        <h1 className="record-brand">잠깐명상</h1>
        {session.startedAt !== null && (
          <div className="record-date-time">
            <time dateTime={startedAtDateTime}>{formatDate(session.startedAt)}</time>
            <time dateTime={startedAtDateTime}>{formatStartTime(session.startedAt)}</time>
          </div>
        )}
      </header>

      {session.durationMs !== null && (
        <p className="record-duration">
          {formatDuration(session.durationMs)} 머물렀어요.
        </p>
      )}

      <p className="record-keyword" style={{ backgroundColor: theme.postit }}>
        {session.keyword}
      </p>

      {session.note !== '' && <p className="record-note">{session.note}</p>}
      {session.place !== '' && <p className="record-place">{session.place}</p>}
    </article>
  )
})

export default RecordCard
