import { useEffect, useRef, useState } from 'react'
import RecordCard from '../components/RecordCard'
import { COPY } from '../constants/copy'
import type { PauseSession } from '../types/pause'
import {
  createRecordImage,
  prepareRecordImageFonts,
  RECORD_IMAGE_PIXEL_RATIO,
} from '../utils/createRecordImage'

type ResultScreenProps = {
  session: PauseSession
  onRestart: () => void
}

function createImageFileName(startedAt: number | null) {
  const date = new Date(startedAt ?? Date.now())
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `jamkkan-${year}-${month}-${day}-${hours}${minutes}.png`
}

function createRecordFile(blob: Blob, startedAt: number | null) {
  const file = new File([blob], createImageFileName(startedAt), {
    type: 'image/png',
  })

  if (
    !(file instanceof File) ||
    file.size === 0 ||
    file.type !== 'image/png' ||
    !file.name.endsWith('.png')
  ) {
    throw new Error('RecordCard PNG file could not be created.')
  }

  return file
}

function getErrorDetails(error: unknown) {
  if (typeof error !== 'object' || error === null) {
    return {
      name: 'UnknownError',
      message: String(error),
      isDomException: false,
    }
  }

  return {
    name: 'name' in error ? String(error.name) : 'UnknownError',
    message: 'message' in error ? String(error.message) : '',
    isDomException:
      typeof DOMException !== 'undefined' && error instanceof DOMException,
  }
}

function isShareDebugEnabled() {
  return new URLSearchParams(window.location.search).get('shareDebug') === '1'
}

function logShareDebug(step: string, details: Record<string, unknown>) {
  if (isShareDebugEnabled()) {
    console.info(`[jamkkan share] ${step}`, details)
  }
}

function isAbortError(error: unknown) {
  return (
    typeof error === 'object' &&
    error !== null &&
    'name' in error &&
    error.name === 'AbortError'
  )
}

function ResultScreen({ session, onRestart }: ResultScreenProps) {
  const recordCardRef = useRef<HTMLElement>(null)
  const fallbackImageFileRef = useRef<File>(null)
  const [isCreatingImage, setIsCreatingImage] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [canUseWebShare, setCanUseWebShare] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function',
  )
  const isBusy = isCreatingImage || isSharing

  useEffect(() => {
    if (recordCardRef.current === null) {
      return
    }

    const fontStartedAt = performance.now()

    void prepareRecordImageFonts(recordCardRef.current)
      .then(() => {
        logShareDebug('font-ready', {
          elapsedMs: performance.now() - fontStartedAt,
        })
      })
      .catch((error) => {
        logShareDebug('font-error', {
          elapsedMs: performance.now() - fontStartedAt,
          ...getErrorDetails(error),
        })
      })
  }, [])

  const handleSaveImage = async () => {
    if (recordCardRef.current === null || isBusy) {
      return
    }

    setIsCreatingImage(true)
    setActionError('')

    try {
      const blob =
        fallbackImageFileRef.current ??
        (await createRecordImage(recordCardRef.current))
      const imageUrl = URL.createObjectURL(blob)
      const downloadLink = document.createElement('a')

      downloadLink.href = imageUrl
      downloadLink.download = createImageFileName(session.startedAt)
      document.body.appendChild(downloadLink)
      downloadLink.click()
      downloadLink.remove()
      window.setTimeout(() => URL.revokeObjectURL(imageUrl), 1_000)
    } catch {
      setActionError(COPY.result.imageError)
    } finally {
      setIsCreatingImage(false)
    }
  }

  const handleShare = async () => {
    if (recordCardRef.current === null || !canUseWebShare || isBusy) {
      return
    }

    setIsSharing(true)
    setActionError('')
    const shareStartedAt = performance.now()
    const hadPreparedFile = fallbackImageFileRef.current !== null

    logShareDebug('click', {
      elapsedMs: 0,
      hasPreparedFile: hadPreparedFile,
      userActivation: navigator.userActivation?.isActive ?? 'unsupported',
    })

    try {
      let file = fallbackImageFileRef.current

      if (file === null) {
        const recordCardElement = recordCardRef.current
        const recordCardRect = recordCardElement.getBoundingClientRect()
        const imageStartedAt = performance.now()
        let blob: Blob

        try {
          blob = await createRecordImage(recordCardElement)
        } catch (error) {
          logShareDebug('image-error', {
            elapsedMs: performance.now() - shareStartedAt,
            imageElapsedMs: performance.now() - imageStartedAt,
            userActivation:
              navigator.userActivation?.isActive ?? 'unsupported',
            ...getErrorDetails(error),
          })
          setActionError(COPY.result.imageError)
          setCanUseWebShare(false)
          return
        }

        logShareDebug('image-created', {
          elapsedMs: performance.now() - shareStartedAt,
          imageElapsedMs: performance.now() - imageStartedAt,
          blobSize: blob.size,
          blobType: blob.type,
          recordCardWidth: recordCardRect.width,
          recordCardHeight: recordCardRect.height,
          outputWidth: Math.round(
            recordCardRect.width * RECORD_IMAGE_PIXEL_RATIO,
          ),
          outputHeight: Math.round(
            recordCardRect.height * RECORD_IMAGE_PIXEL_RATIO,
          ),
          pixelRatio: RECORD_IMAGE_PIXEL_RATIO,
          userActivation:
            navigator.userActivation?.isActive ?? 'unsupported',
        })

        const fileStartedAt = performance.now()

        try {
          file = createRecordFile(blob, session.startedAt)
        } catch (error) {
          logShareDebug('file-error', {
            elapsedMs: performance.now() - shareStartedAt,
            ...getErrorDetails(error),
          })
          setActionError(COPY.result.imageError)
          setCanUseWebShare(false)
          return
        }

        fallbackImageFileRef.current = file
        logShareDebug('file-created', {
          elapsedMs: performance.now() - shareStartedAt,
          fileElapsedMs: performance.now() - fileStartedAt,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })
      }

      const shareData: ShareData = { files: [file] }
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

      if (
        !hadPreparedFile &&
        navigator.userActivation !== undefined &&
        !navigator.userActivation.isActive
      ) {
        logShareDebug('share-deferred', {
          elapsedMs: performance.now() - shareStartedAt,
          reason: 'transient-user-activation-expired',
        })
        return
      }

      logShareDebug('share-call', {
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

        if (!hadPreparedFile && errorDetails.name === 'NotAllowedError') {
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
        <RecordCard ref={recordCardRef} session={session} />

        <div className="result-controls">
          {canUseWebShare ? (
            <button
              className="share-button"
              type="button"
              disabled={isBusy}
              onClick={handleShare}
            >
              {isSharing ? COPY.result.preparingShare : COPY.result.share}
            </button>
          ) : (
            <button
              className="save-image-button"
              type="button"
              disabled={isBusy}
              onClick={handleSaveImage}
            >
              {isCreatingImage
                ? COPY.result.preparingImage
                : COPY.result.download}
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
