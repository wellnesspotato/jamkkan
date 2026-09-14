import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { COPY } from '../constants/copy'
import type { PauseSession } from '../types/pause'
import {
  getErrorDetails,
  isAbortError,
  logShareDebug,
} from '../utils/shareDebug'
import { isAndroidKakaoTalkInAppBrowser } from '../utils/browser'

type ResultScreenProps = {
  session: PauseSession
  preparedShareFile: File
  onEdit: () => void
  onRestart: () => void
}

let scrollResetSessionId: number | null = null

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
  onEdit,
  onRestart,
}: ResultScreenProps) {
  useLayoutEffect(() => {
    if (
      session.startedAt === null ||
      scrollResetSessionId === session.startedAt
    ) {
      return
    }

    scrollResetSessionId = session.startedAt
    window.scrollTo({ top: 0, left: 0, behavior: 'auto' })

    const scrollingElement = document.scrollingElement

    if (scrollingElement !== null) {
      scrollingElement.scrollTop = 0
      scrollingElement.scrollLeft = 0
    }
  }, [session.startedAt])

  const hasLoggedResultPhaseRef = useRef(false)
  const [isSharing, setIsSharing] = useState(false)
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null)
  const [actionError, setActionError] = useState('')
  const [canUseWebShare, setCanUseWebShare] = useState(
    () => canSharePreparedFile(preparedShareFile),
  )
  const isAndroidKakaoTalk = isAndroidKakaoTalkInAppBrowser()
  const canUseFileShare = canUseWebShare && !isAndroidKakaoTalk

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

  useEffect(() => {
    let imageUrl: string | null = null

    try {
      imageUrl = URL.createObjectURL(preparedShareFile)
      setImagePreviewUrl(imageUrl)
      logShareDebug('image-preview-ready', {
        environment: isAndroidKakaoTalk ? 'android-kakaotalk' : 'result-image',
        fileSize: preparedShareFile.size,
      })
    } catch {
      setActionError(COPY.result.imageError)
    }

    return () => {
      if (imageUrl !== null) {
        URL.revokeObjectURL(imageUrl)
      }
    }
  }, [isAndroidKakaoTalk, preparedShareFile])

  const handleShare = async () => {
    if (!canUseFileShare || isSharing) {
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
        <button
          className="result-edit-action"
          type="button"
          aria-label="기록 수정하기"
          onClick={onEdit}
        >
          <svg
            className="result-edit-action__icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="m15 18-6-6 6-6" />
          </svg>
          <span>{COPY.result.edit}</span>
        </button>
        <div className="result-image-preview">
          {imagePreviewUrl === null ? (
            <p className="image-preview-loading">
              {COPY.result.imagePreviewLoading}
            </p>
          ) : (
            <>
              <img
                className="image-preview"
                src={imagePreviewUrl}
                alt="잠깐명상 기록 이미지"
              />
              {!canUseFileShare && (
                <p className="image-preview-instruction">
                  {COPY.result.imagePreviewInstruction}
                </p>
              )}
            </>
          )}
        </div>

        <div className="result-controls">
          {canUseFileShare && (
            <button
              className="share-button"
              type="button"
              disabled={isSharing}
              onClick={handleShare}
            >
              {COPY.result.share}
            </button>
          )}
          {actionError !== '' && (
            <p className="image-error" aria-live="polite">
              {actionError}
            </p>
          )}
          {canUseFileShare && (
            <p className="result-guidance">{COPY.result.privacy}</p>
          )}
          <button className="restart-button" type="button" onClick={onRestart}>
            {COPY.result.restart}
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultScreen
