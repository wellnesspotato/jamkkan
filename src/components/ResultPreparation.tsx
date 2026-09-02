import { useCallback, useEffect, useRef } from 'react'
import type { PauseSession } from '../types/pause'
import { createRecordShareFile } from '../utils/createRecordShareFile'
import { getErrorDetails, logShareDebug } from '../utils/shareDebug'
import RecordShareCard from './RecordShareCard'

type ResultPreparationProps = {
  session: PauseSession
  onPrepared: (file: File) => void
  onError: () => void
}

function ResultPreparation({
  session,
  onPrepared,
  onError,
}: ResultPreparationProps) {
  const captureRef = useRef<HTMLDivElement>(null)
  const preparationPromiseRef = useRef<Promise<File> | null>(null)
  const hasLoggedPreparationRef = useRef(false)

  const getPreparedFile = useCallback(() => {
    if (preparationPromiseRef.current !== null) {
      logShareDebug('generation-promise-reused', {
        phase: 'reflection-overlay',
      })
      return preparationPromiseRef.current
    }

    if (captureRef.current === null) {
      return Promise.reject(new Error('RecordShareCard is not available.'))
    }

    logShareDebug('pre-generation-start', {
      phase: 'reflection-overlay',
    })

    const preparationPromise = createRecordShareFile(
      captureRef.current,
      session,
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
  }, [session])

  useEffect(() => {
    let isCancelled = false
    let animationFrameId: number | undefined
    let timeoutId: number | undefined
    const preparationStartedAt = performance.now()

    if (!hasLoggedPreparationRef.current) {
      hasLoggedPreparationRef.current = true
      logShareDebug('preparing-overlay-entered')
    }

    animationFrameId = window.requestAnimationFrame(() => {
      timeoutId = window.setTimeout(() => {
        logShareDebug('capture-dom-ready', {
          elapsedMs: performance.now() - preparationStartedAt,
          hasCaptureElement: captureRef.current !== null,
        })

        void getPreparedFile()
          .then((file) => {
            if (isCancelled) {
              return
            }

            logShareDebug('pre-generation-finished', {
              elapsedMs: performance.now() - preparationStartedAt,
              fileSize: file.size,
            })
            onPrepared(file)
          })
          .catch((error) => {
            if (isCancelled) {
              return
            }

            logShareDebug('pre-generation-failed', {
              elapsedMs: performance.now() - preparationStartedAt,
              ...getErrorDetails(error),
            })
            onError()
          })
      }, 0)
    })

    return () => {
      isCancelled = true

      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId)
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }
    }
  }, [getPreparedFile, onError, onPrepared])

  return (
    <div className="share-capture-host" aria-hidden="true">
      <RecordShareCard ref={captureRef} session={session} />
    </div>
  )
}

export default ResultPreparation
