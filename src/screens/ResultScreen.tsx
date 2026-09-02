import { useEffect, useRef, useState } from 'react'
import RecordCard from '../components/RecordCard'
import { COPY } from '../constants/copy'
import type { PauseSession } from '../types/pause'
import {
  getErrorDetails,
  isAbortError,
  logShareDebug,
} from '../utils/shareDebug'

type ResultScreenProps = {
  session: PauseSession
  preparedShareFile: File
  onRestart: () => void
}

function canSharePreparedFile(file: File) {
  if (
    typeof navigator === 'undefined' ||
    typeof navigator.share !== 'function'
  ) {
    return false
  }

  try {
    return (
      typeof navigator.canShare !== 'function' ||
      navigator.canShare({ files: [file] })
    )
  } catch {
    return false
  }
}

function ResultScreen({
  session,
  preparedShareFile,
  onRestart,
}: ResultScreenProps) {
  const hasLoggedResultPhaseRef = useRef(false)
  const [isSharing, setIsSharing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [canUseWebShare, setCanUseWebShare] = useState(
    () => canSharePreparedFile(preparedShareFile),
  )

  useEffect(() => {
    if (hasLoggedResultPhaseRef.current) {
      return
    }

    hasLoggedResultPhaseRef.current = true
    logShareDebug('result-phase-entered', {
      fileName: preparedShareFile.name,
      fileSize: preparedShareFile.size,
    })
  }, [preparedShareFile])

  const handleSaveImage = () => {
    if (isSharing) {
      return
    }

    setActionError('')

    try {
      const imageUrl = URL.createObjectURL(preparedShareFile)
      const downloadLink = document.createElement('a')

      downloadLink.href = imageUrl
      downloadLink.download = preparedShareFile.name
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1_000)
    } catch {
      setActionError(COPY.result.imageError)
    }
  }

  const handleShare = async () => {
    if (!canUseWebShare || isSharing) {
      return
    }

    setIsSharing(true)
    setActionError('')
    const shareStartedAt = performance.now()
    const shareData: ShareData = { files: [preparedShareFile] }

    logShareDebug('share-click', {
      hasPreparedFile: true,
      fileSize: preparedShareFile.size,
      userActivation: navigator.userActivation?.isActive ?? 'unsupported',
    })

    try {
      let canShareFiles = true

      try {
        canShareFiles =
          typeof navigator.canShare !== 'function' ||
          navigator.canShare(shareData)
      } catch (error) {
        canShareFiles = false
        logShareDebug('can-share-error', {
          elapsedMs: performance.now() - shareStartedAt,
          ...getErrorDetails(error),
        })
      }

      logShareDebug('can-share', {
        elapsedMs: performance.now() - shareStartedAt,
        result: canShareFiles,
        userActivation: navigator.userActivation?.isActive ?? 'unsupported',
      })

      if (typeof navigator.share !== 'function' || !canShareFiles) {
        setActionError(COPY.result.shareUnavailable)
        setCanUseWebShare(false)
        return
      }

      logShareDebug('navigator-share-call', {
        elapsedMs: performance.now() - shareStartedAt,
        userActivation: navigator.userActivation?.isActive ?? 'unsupported',
      })

      try {
        await navigator.share(shareData)
        logShareDebug('share-success', {
          elapsedMs: performance.now() - shareStartedAt,
        })
      } catch (error) {
        const errorDetails = getErrorDetails(error)

        logShareDebug('share-error', {
          elapsedMs: performance.now() - shareStartedAt,
          userActivation:
            navigator.userActivation?.isActive ?? 'unsupported',
          ...errorDetails,
        })

        if (isAbortError(error)) {
          return
        }

        setActionError(COPY.result.shareError)
        setCanUseWebShare(false)
      }
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <main className="screen result-screen">
      <div className="screen-content result-content">
        <div className="result-card-display">
          <RecordCard session={session} showInstagramHandle />
        </div>

        <div className="result-controls">
          {canUseWebShare ? (
            <button
              className="share-button"
              type="button"
              disabled={isSharing}
              onClick={handleShare}
            >
              {COPY.result.share}
            </button>
          ) : (
            <button
              className="save-image-button"
              type="button"
              disabled={isSharing}
              onClick={handleSaveImage}
            >
              {COPY.result.download}
            </button>
          )}
          {actionError !== '' && (
            <p className="image-error" aria-live="polite">
              {actionError}
            </p>
          )}
          <p className="result-guidance">
            {COPY.result.privacy}
            <br />
            {canUseWebShare
              ? COPY.result.saveHint
              : COPY.result.downloadHint}
          </p>
          <button className="restart-button" type="button" onClick={onRestart}>
            {COPY.result.restart}
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultScreen
