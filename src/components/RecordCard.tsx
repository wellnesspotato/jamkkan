import { forwardRef } from 'react'
import BrandLogo from './BrandLogo'
import { COPY } from '../constants/copy'
import {
  getKeywordSizeClass,
  KEYWORD_FONT_CLASS,
} from '../constants/keywordFonts'
import { PAUSE_THEMES } from '../constants/themes'
import type { PauseSession } from '../types/pause'
import { getTimeOfDay, getTimeOfDayOverride } from '../utils/timeOfDay'

type RecordCardProps = {
  session: PauseSession
  showInstagramHandle?: boolean
}

function formatDate(startedAt: number) {
  const date = new Date(startedAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const weekdays = [
    '일요일',
    '월요일',
    '화요일',
    '수요일',
    '목요일',
    '금요일',
    '토요일',
  ]

  return `${year}.${month}.${day} ${weekdays[date.getDay()]}`
}

function formatTime(timestamp: number, includePeriod = true) {
  const parts = new Intl.DateTimeFormat('ko-KR', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).formatToParts(new Date(timestamp))
  const period = parts.find(({ type }) => type === 'dayPeriod')?.value ?? ''
  const hour = parts.find(({ type }) => type === 'hour')?.value ?? ''
  const minute = parts.find(({ type }) => type === 'minute')?.value ?? ''

  return includePeriod ? `${period} ${hour}:${minute}` : `${hour}:${minute}`
}

function TimeOfDayIcon({ timestamp, color }: { timestamp: number; color: string }) {
  const timeOfDay = getTimeOfDayOverride() ?? getTimeOfDay(timestamp)

  return (
    <svg
      className={`record-time-icon record-time-icon--${timeOfDay}`}
      viewBox="0 0 32 32"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.7"
      strokeLinecap="round"
      strokeLinejoin="round"
      style={{ color }}
      aria-hidden="true"
    >
      {timeOfDay === 'morning' ? (
        <>
          <path d="M7 21h18" />
          <path d="M10 21a6 6 0 0 1 12 0" />
          <path d="M16 7v3M9.6 10.6l2.1 2.1M22.4 10.6l-2.1 2.1M6 16h3M23 16h3" />
        </>
      ) : timeOfDay === 'evening' ? (
        <path d="M24.5 20.5a10 10 0 0 1-13-13 10 10 0 1 0 13 13Z" />
      ) : (
        <>
          <circle cx="16" cy="16" r="5" />
          <path d="M16 3v3M16 26v3M3 16h3M26 16h3M6.8 6.8l2.1 2.1M23.1 23.1l2.1 2.1M25.2 6.8l-2.1 2.1M8.9 23.1l-2.1 2.1" />
        </>
      )}
    </svg>
  )
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
  { session, showInstagramHandle = false },
  ref,
) {
  const theme =
    PAUSE_THEMES.find(({ id }) => id === session.themeId) ?? PAUSE_THEMES[0]
  const startedAtDateTime =
    session.startedAt === null ? undefined : new Date(session.startedAt).toISOString()
  return (
    <article ref={ref} className="record-card">
      <header
        className={`record-card-header${showInstagramHandle ? ' record-card-header--share' : ''}`}
      >
        <BrandLogo />
        {showInstagramHandle && (
          <span className="record-card-instagram">
            {COPY.result.instagramHandle}
          </span>
        )}
      </header>

      {session.startedAt !== null && (
        <div className="record-time-block">
          <div className="record-when">
            <TimeOfDayIcon timestamp={session.startedAt} color={theme.sand} />
            <div className="record-when-text">
              <time className="record-start-time" dateTime={startedAtDateTime}>
                {formatTime(session.startedAt)}
              </time>
              <time className="record-date" dateTime={startedAtDateTime}>
                {formatDate(session.startedAt)}
              </time>
            </div>
          </div>
          {session.durationMs !== null && (
            <p className="record-duration">
              <span className="duration-value">{formatDuration(session.durationMs)}</span>{' '}
              <span className="duration-label"> 동안 머물렀어요</span>
            </p>
          )}
        </div>
      )}

      <div
        className="keyword-postit record-keyword-postit"
        style={{ backgroundColor: theme.postit }}
      >
        <p
          className={`record-keyword ${KEYWORD_FONT_CLASS[session.keywordFont]} ${getKeywordSizeClass(session.keyword)}`}
        >
          {session.keyword}
        </p>
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
