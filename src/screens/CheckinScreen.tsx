import { useRef, useState } from 'react'
import gamjaRoomSymbol from '../assets/brand/gamja-room-gamja-transparent.svg'
import CheckinMultiSelect from '../components/CheckinMultiSelect'
import CheckinResultPreparation from '../components/CheckinResultPreparation'
import ResultPreparationOverlay from '../components/ResultPreparationOverlay'
import CheckinResultScreen from './CheckinResultScreen'
import {
  BODY_OPTIONS,
  CHECKIN_COPY,
  CHECKIN_EXPORT_PREWARM_TEXT,
  INTENTION_OPTIONS,
  MIND_OPTIONS,
} from '../constants/checkinConfig'
import type { CheckInPhase, CheckInState } from '../types/checkin'
import { logExportTiming } from '../utils/shareDebug'
import { prewarmCheckinImageFonts } from '../utils/createRecordImage'

const INITIAL_CHECKIN_STATE: CheckInState = {
  startedAt: 0,
  body: [],
  mind: [],
  bodyCustomValue: '',
  mindCustomValue: '',
  bodyCustomEnabled: false,
  mindCustomEnabled: false,
}

const WEEKDAYS = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일']

function formatKoreanDateTime(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = date.getHours()
  const period = hours < 12 ? '오전' : '오후'
  const hour = hours % 12 || 12
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `${year}.${month}.${day} ${WEEKDAYS[date.getDay()]} · ${period} ${hour}:${minutes}`
}

function CheckinScreen() {
  const [phase, setPhase] = useState<CheckInPhase>('intro')
  const [preparedShareFile, setPreparedShareFile] = useState<File | null>(null)
  const preparationStartedAtRef = useRef<number | null>(null)
  const [checkin, setCheckin] = useState<CheckInState>(() => ({
    ...INITIAL_CHECKIN_STATE,
    startedAt: Date.now(),
  }))
  const introDateTime = formatKoreanDateTime(new Date(checkin.startedAt))

  const goBack = () => {
    setPhase((currentPhase) => {
      if (currentPhase === 'mind') return 'body'
      if (currentPhase === 'intention') return 'mind'
      return currentPhase
    })
  }

  const handleNext = () => {
    if (phase === 'body') {
      setPhase('mind')
      return
    }

    if (phase === 'mind') {
      setPhase('intention')
      return
    }

    if (phase === 'intention') {
      preparationStartedAtRef.current = performance.now()
      logExportTiming('checkin', 'transition-start')
      setPreparedShareFile(null)
      setPhase('preparing')
    }
  }

  const handleStart = () => {
    setPhase('body')

    window.requestAnimationFrame(() => {
      window.setTimeout(() => {
        void prewarmCheckinImageFonts(CHECKIN_EXPORT_PREWARM_TEXT)
      }, 0)
    })
  }

  if (phase === 'intro') {
    return (
      <main className="checkin-screen checkin-screen--intro">
        <section className="checkin-content checkin-intro" aria-labelledby="checkin-title">
          <p className="checkin-datetime">{introDateTime}</p>
          <div className="checkin-intro__title-group">
            <img
              className="checkin-intro__symbol"
              src={gamjaRoomSymbol}
              alt=""
              aria-hidden="true"
            />
            <p className="checkin-room-name">{CHECKIN_COPY.roomName}</p>
            <h1 id="checkin-title">{CHECKIN_COPY.title}</h1>
          </div>
          <p className="checkin-intro__description">
            {CHECKIN_COPY.introDescriptionLines[0]}
            <br />
            {CHECKIN_COPY.introDescriptionLines[1]}
          </p>
          <button className="checkin-primary-button" type="button" onClick={handleStart}>
            {CHECKIN_COPY.start}
          </button>
        </section>
      </main>
    )
  }

  if (phase === 'complete') {
    return (
      <CheckinResultScreen
        checkin={checkin}
        formattedDateTime={introDateTime}
        preparedShareFile={preparedShareFile}
        preparationStartedAt={preparationStartedAtRef.current}
      />
    )
  }

  const isBody = phase === 'body'
  const isMind = phase === 'mind'
  const isIntention = phase === 'intention' || phase === 'preparing'
  const isPreparing = phase === 'preparing'
  const question = isBody ? CHECKIN_COPY.bodyQuestion : isMind ? CHECKIN_COPY.mindQuestion : CHECKIN_COPY.intentionQuestion
  const description = isBody
    ? CHECKIN_COPY.bodyDescription
    : isMind
      ? CHECKIN_COPY.mindDescription
      : CHECKIN_COPY.intentionDescription
  const step = isBody ? 1 : isMind ? 2 : 3
  const canProceed = isBody
    ? checkin.body.length > 0
    : isMind
      ? checkin.mind.length > 0
      : typeof checkin.intention === 'string' && checkin.intention.trim() !== ''

  return (
    <main className="checkin-screen">
      <section className="checkin-content checkin-question" aria-labelledby="checkin-question-title">
        <p className="checkin-step" aria-label={`3단계 중 ${step}단계`}>{step} / 3</p>
        <h1 id="checkin-question-title">{question}</h1>
        <p className="checkin-question-description">{description}</p>

        {isBody && (
          <CheckinMultiSelect
            options={BODY_OPTIONS}
            selected={checkin.body}
            customValue={checkin.bodyCustomValue}
            customEnabled={checkin.bodyCustomEnabled}
            disabled={isPreparing}
            onChange={(body) => setCheckin((current) => ({ ...current, body }))}
            onCustomValueChange={(bodyCustomValue) =>
              setCheckin((current) => ({ ...current, bodyCustomValue }))
            }
            onCustomEnabledChange={(bodyCustomEnabled) =>
              setCheckin((current) => ({ ...current, bodyCustomEnabled }))
            }
          />
        )}
        {isMind && (
          <CheckinMultiSelect
            options={MIND_OPTIONS}
            selected={checkin.mind}
            customValue={checkin.mindCustomValue}
            customEnabled={checkin.mindCustomEnabled}
            disabled={isPreparing}
            onChange={(mind) => setCheckin((current) => ({ ...current, mind }))}
            onCustomValueChange={(mindCustomValue) =>
              setCheckin((current) => ({ ...current, mindCustomValue }))
            }
            onCustomEnabledChange={(mindCustomEnabled) =>
              setCheckin((current) => ({ ...current, mindCustomEnabled }))
            }
          />
        )}
        {isIntention && (
          <div className="checkin-options">
            {INTENTION_OPTIONS.map((option) => {
              const isSelected = checkin.intention === option
              return (
                <button
                  className="checkin-single-option"
                  type="button"
                  key={option}
                  aria-pressed={isSelected}
                  data-selected={isSelected}
                  disabled={isPreparing}
                  onClick={() => setCheckin((current) => ({ ...current, intention: option }))}
                >
                  {option}
                </button>
              )
            })}
          </div>
        )}

        <div className={`checkin-actions${isBody ? ' checkin-actions--single' : ''}`}>
          {!isBody && (
            <button className="checkin-secondary-button" type="button" onClick={goBack} disabled={isPreparing}>
              {CHECKIN_COPY.previous}
            </button>
          )}
          <button
            className="checkin-primary-button"
            type="button"
            onClick={handleNext}
            disabled={isPreparing || !canProceed}
          >
            {CHECKIN_COPY.next}
          </button>
        </div>
      </section>
      {isPreparing && (
        <>
          <ResultPreparationOverlay />
          <CheckinResultPreparation
            checkin={checkin}
            formattedDateTime={introDateTime}
            transitionStartedAt={preparationStartedAtRef.current ?? performance.now()}
            onPrepared={(file) => {
              setPreparedShareFile(file)
              setPhase('complete')
            }}
            onError={() => {
              setPreparedShareFile(null)
              setPhase('complete')
            }}
          />
        </>
      )}
    </main>
  )
}

export default CheckinScreen
