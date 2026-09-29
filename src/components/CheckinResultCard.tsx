import { forwardRef } from 'react'
import gamjaRoomSymbol from '../assets/brand/gamja-room-gamja-transparent.svg'
import { CHECKIN_COPY, INTENTION_TIPS } from '../constants/checkinConfig'
import type { CheckInState } from '../types/checkin'

type CheckinResultCardProps = {
  checkin: CheckInState
  formattedDateTime: string
}

function CheckinResultSection({
  label,
  values,
}: {
  label: string
  values: string[]
}) {
  if (values.length === 0) {
    return null
  }

  return (
    <section className="checkin-result-card__section checkin-result-card__section--compact">
      <h2 className="checkin-result-card__category-pill">{label}</h2>
      <div className="checkin-result-card__pills" aria-label={`${label} 응답`}>
        {values.map((value, index) => (
          <span className="checkin-result-card__pill" key={`${label}-${value}-${index}`}>
            {value}
          </span>
        ))}
      </div>
    </section>
  )
}

const CheckinResultCard = forwardRef<HTMLElement, CheckinResultCardProps>(
  function CheckinResultCard({ checkin, formattedDateTime }, ref) {
    return (
      <article ref={ref} className="checkin-result-card">
        <header className="checkin-result-card__header">
          <img
            className="checkin-result-card__symbol"
            src={gamjaRoomSymbol}
            alt=""
            aria-hidden="true"
          />
          <div className="checkin-result-card__header-copy">
            <time dateTime={new Date(checkin.startedAt).toISOString()}>
              {formattedDateTime}
            </time>
            <p>{CHECKIN_COPY.roomName}, {CHECKIN_COPY.title}</p>
          </div>
        </header>
        {checkin.intention !== undefined && checkin.intention.trim() !== '' && (
          <div className="checkin-result-card__direction">
            <section className="checkin-result-card__intention">
              <h1>{CHECKIN_COPY.intentionLabel}</h1>
              <p>{checkin.intention}</p>
            </section>
            {INTENTION_TIPS[checkin.intention] !== undefined && (
              <section className="checkin-result-card__tips">
                <h2>{CHECKIN_COPY.tipsLabel}</h2>
                <ul>
                  {INTENTION_TIPS[checkin.intention].map((tip) => (
                    <li key={tip}>{tip}</li>
                  ))}
                </ul>
              </section>
            )}
          </div>
        )}
        {(checkin.body.length > 0 || checkin.mind.length > 0) && (
          <section className="checkin-result-card__status">
            <h1>{CHECKIN_COPY.statusLabel}</h1>
            <div className="checkin-result-card__sections">
              <CheckinResultSection label={CHECKIN_COPY.bodyLabel} values={checkin.body} />
              <CheckinResultSection label={CHECKIN_COPY.mindLabel} values={checkin.mind} />
            </div>
          </section>
        )}
        <footer className="checkin-result-card__signature">@gamja.room</footer>
      </article>
    )
  },
)

export default CheckinResultCard
