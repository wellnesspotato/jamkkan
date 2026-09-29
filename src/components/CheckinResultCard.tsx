import { forwardRef } from 'react'
import { CHECKIN_COPY } from '../constants/checkinConfig'
import type { CheckInState } from '../types/checkin'

type CheckinResultCardProps = {
  checkin: CheckInState
  formattedDateTime: string
}

function CheckinResultSection({ label, values }: { label: string; values: string[] }) {
  if (values.length === 0) {
    return null
  }

  return (
    <section className="checkin-result-card__section">
      <h2>{label}</h2>
      <p>{values.join(' · ')}</p>
    </section>
  )
}

const CheckinResultCard = forwardRef<HTMLElement, CheckinResultCardProps>(
  function CheckinResultCard({ checkin, formattedDateTime }, ref) {
    return (
      <article ref={ref} className="checkin-result-card">
        <header className="checkin-result-card__header">
          <time dateTime={new Date(checkin.startedAt).toISOString()}>
            {formattedDateTime}
          </time>
          <p>{CHECKIN_COPY.roomName}</p>
          <p>{CHECKIN_COPY.title}</p>
        </header>
        <h1>{CHECKIN_COPY.resultTitle}</h1>
        <div className="checkin-result-card__sections">
          <CheckinResultSection label={CHECKIN_COPY.bodyLabel} values={checkin.body} />
          <CheckinResultSection label={CHECKIN_COPY.mindLabel} values={checkin.mind} />
          <CheckinResultSection
            label={CHECKIN_COPY.intentionLabel}
            values={checkin.intention === undefined ? [] : [checkin.intention]}
          />
        </div>
      </article>
    )
  },
)

export default CheckinResultCard
