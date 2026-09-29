import { useLayoutEffect, useState } from 'react'
import CheckinResultCard from '../components/CheckinResultCard'
import { CHECKIN_COPY } from '../constants/checkinConfig'
import type { CheckInState } from '../types/checkin'
import { canShareFile } from '../utils/fileShare'
import { isAbortError, logExportTiming } from '../utils/shareDebug'

type CheckinResultScreenProps = {
  checkin: CheckInState
  formattedDateTime: string
  preparedShareFile: File | null
  preparationStartedAt: number | null
}

function CheckinResultScreen({
  checkin,
  formattedDateTime,
  preparedShareFile,
  preparationStartedAt,
}: CheckinResultScreenProps) {
  const [canUseFileShare, setCanUseFileShare] = useState(() =>
    preparedShareFile !== null && canShareFile(preparedShareFile),
  )
  const [isSharing, setIsSharing] = useState(false)

  useLayoutEffect(() => {
    if (preparationStartedAt === null) return

    logExportTiming('checkin', 'result-screen-mounted', {
      elapsedMs: performance.now() - preparationStartedAt,
      hasPreparedFile: preparedShareFile !== null,
      fileSize: preparedShareFile?.size ?? 0,
    })
  }, [preparedShareFile, preparationStartedAt])

  const handleSave = async () => {
    if (preparedShareFile === null || !canUseFileShare || isSharing) {
      return
    }

    setIsSharing(true)
    try {
      await navigator.share({ files: [preparedShareFile] })
    } catch (error) {
      if (!isAbortError(error)) {
        setCanUseFileShare(false)
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <main className="checkin-result-screen">
      <div className="checkin-result-screen__content">
        <section className="checkin-result-completion" aria-labelledby="checkin-completion-title">
          <h1 id="checkin-completion-title">{CHECKIN_COPY.completionTitle}</h1>
          <p>{CHECKIN_COPY.completionFirstLine}</p>
          <p>
            {CHECKIN_COPY.completionDescriptionLines[0]}
            <br />
            {CHECKIN_COPY.completionDescriptionLines[1]}
          </p>
        </section>
        <CheckinResultCard
          checkin={checkin}
          formattedDateTime={formattedDateTime}
        />
        <div className="checkin-result-screen__action">
          {canUseFileShare ? (
            <button className="checkin-primary-button" type="button" disabled={isSharing} onClick={handleSave}>
              {CHECKIN_COPY.save}
            </button>
          ) : (
            <p className="checkin-capture-guidance">
              {CHECKIN_COPY.captureGuidanceLines[0]}
              <br />
              {CHECKIN_COPY.captureGuidanceLines[1]}
            </p>
          )}
        </div>
      </div>
    </main>
  )
}

export default CheckinResultScreen
