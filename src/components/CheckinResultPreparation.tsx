import { useCallback, useEffect, useLayoutEffect, useRef } from 'react'
import CheckinResultCard from './CheckinResultCard'
import type { CheckInState } from '../types/checkin'
import { createCheckinShareFile } from '../utils/createCheckinShareFile'
import { logExportTiming } from '../utils/shareDebug'

type CheckinResultPreparationProps = {
  checkin: CheckInState
  formattedDateTime: string
  transitionStartedAt: number
  onPrepared: (file: File) => void
  onError: () => void
}

function CheckinResultPreparation({
  checkin,
  formattedDateTime,
  transitionStartedAt,
  onPrepared,
  onError,
}: CheckinResultPreparationProps) {
  const captureRef = useRef<HTMLElement>(null)
  const preparationPromiseRef = useRef<Promise<File> | null>(null)

  useLayoutEffect(() => {
    logExportTiming('checkin', 'export-dom-mounted', {
      elapsedMs: performance.now() - transitionStartedAt,
      hasCaptureElement: captureRef.current !== null,
    })
  }, [transitionStartedAt])

  const getPreparedFile = useCallback(() => {
    if (preparationPromiseRef.current !== null) {
      return preparationPromiseRef.current
    }

    if (captureRef.current === null) {
      return Promise.reject(new Error('CheckinResultCard is not available.'))
    }

    const preparationPromise = createCheckinShareFile(
      captureRef.current,
      checkin.startedAt,
    )

    preparationPromiseRef.current = preparationPromise
    void preparationPromise.then(
      () => {
        if (preparationPromiseRef.current === preparationPromise) {
          preparationPromiseRef.current = null
        }
      },
      () => {
        if (preparationPromiseRef.current === preparationPromise) {
          preparationPromiseRef.current = null
        }
      },
    )

    return preparationPromise
  }, [checkin])

  useEffect(() => {
    let isCancelled = false
    let animationFrameId: number | undefined
    let timeoutId: number | undefined

    animationFrameId = window.requestAnimationFrame(() => {
      logExportTiming('checkin', 'request-animation-frame', {
        elapsedMs: performance.now() - transitionStartedAt,
      })
      timeoutId = window.setTimeout(() => {
        logExportTiming('checkin', 'zero-timeout-fired', {
          elapsedMs: performance.now() - transitionStartedAt,
        })
        void getPreparedFile()
          .then((file) => {
            if (!isCancelled) {
              logExportTiming('checkin', 'preparation-complete', {
                elapsedMs: performance.now() - transitionStartedAt,
                fileSize: file.size,
              })
              onPrepared(file)
            }
          })
          .catch(() => {
            if (!isCancelled) {
              logExportTiming('checkin', 'preparation-failed', {
                elapsedMs: performance.now() - transitionStartedAt,
              })
              onError()
            }
          })
      }, 0)
    })

    return () => {
      isCancelled = true
      if (animationFrameId !== undefined) window.cancelAnimationFrame(animationFrameId)
      if (timeoutId !== undefined) window.clearTimeout(timeoutId)
    }
  }, [getPreparedFile, onError, onPrepared])

  return (
    <div className="share-capture-host" aria-hidden="true">
      <div className="checkin-share-capture-wrapper">
        <CheckinResultCard
          ref={captureRef}
          checkin={checkin}
          formattedDateTime={formattedDateTime}
        />
      </div>
    </div>
  )
}

export default CheckinResultPreparation
