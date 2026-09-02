import { useCallback, useEffect, useRef, useState } from 'react'
import RecordCard from '../components/RecordCard'
import RecordShareCard from '../components/RecordShareCard'
import { COPY } from '../constants/copy'
import { preloadKeywordFont } from '../constants/keywordFonts'
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

const RECORD_UI_FONT_LOAD_VALUES = [
  '400 16px "Noto Sans KR"',
  '500 14px "Noto Sans KR"',
  '700 14px "Noto Sans KR"',
] as const

async function prepareVisibleRecordFonts(session: PauseSession) {
  const uiFontPromises = RECORD_UI_FONT_LOAD_VALUES.map((font) =>
    document.fonts.check(font)
      ? Promise.resolve()
      : document.fonts.load(font).then(() => undefined),
  )

  await Promise.all([preloadKeywordFont(session.keywordFont), ...uiFontPromises])
}

function ResultScreen({ session, onRestart }: ResultScreenProps) {
  const recordCardRef = useRef<HTMLDivElement>(null)
  const fallbackImageFileRef = useRef<File>(null)
  const preparationPromiseRef = useRef<Promise<File> | null>(null)
  const preparedImageKeyRef = useRef('')
  const [isCreatingImage, setIsCreatingImage] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [canUseWebShare, setCanUseWebShare] = useState(
    () =>
      typeof navigator !== 'undefined' &&
      typeof navigator.share === 'function',
  )
  const isBusy = isCreatingImage || isSharing
  const imageCacheKey = JSON.stringify([
    session.startedAt,
    session.endedAt,
    session.durationMs,
    session.keyword,
    session.note,
    session.place,
    session.themeId,
    session.keywordFont,
  ])

  const ensurePreparedFile = useCallback(
    (source: 'pre-generation' | 'share-click' | 'save-click') => {
      const captureElement = recordCardRef.current

      if (captureElement === null) {
        return Promise.reject(new Error('RecordShareCard is not available.'))
      }

      if (preparedImageKeyRef.current !== imageCacheKey) {
        preparedImageKeyRef.current = imageCacheKey
        fallbackImageFileRef.current = null
        preparationPromiseRef.current = null
      }

      if (fallbackImageFileRef.current !== null) {
        logShareDebug('cache-hit', { source })
        return Promise.resolve(fallbackImageFileRef.current)
      }

      if (preparationPromiseRef.current !== null) {
        logShareDebug('generation-promise-reused', { source })
        return preparationPromiseRef.current
      }

      logShareDebug('cache-miss', { source })

      const generationKey = imageCacheKey
      const generationStartedAt = performance.now()
      const preparationPromise = (async () => {
        logShareDebug(
          source === 'pre-generation'
            ? 'pre-generation-start'
            : 'generation-start',
          { source },
        )

        const fontStartedAt = performance.now()
        await prepareVisibleRecordFonts(session)
        await prepareRecordImageFonts(captureElement, session.keywordFont)
        const fontElapsedMs = performance.now() - fontStartedAt

        logShareDebug('font-ready', {
          source,
          elapsedMs: fontElapsedMs,
        })

        const captureRect = captureElement.getBoundingClientRect()
        const shareCardRect = captureElement
          .querySelector<HTMLElement>('.record-card')
          ?.getBoundingClientRect()
        const captureStartedAt = performance.now()

        logShareDebug('capture-start', {
          source,
          pixelRatio: RECORD_IMAGE_PIXEL_RATIO,
        })

        const blob = await createRecordImage(
          captureElement,
          session.keywordFont,
        )
        const captureElapsedMs = performance.now() - captureStartedAt

        logShareDebug('capture-complete', {
          source,
          captureElapsedMs,
          blobSize: blob.size,
          blobType: blob.type,
          captureWrapperWidth: captureRect.width,
          captureWrapperHeight: captureRect.height,
          recordShareCardWidth: shareCardRect?.width ?? 'unavailable',
          recordShareCardHeight: shareCardRect?.height ?? 'unavailable',
          outputWidth: Math.round(
            captureRect.width * RECORD_IMAGE_PIXEL_RATIO,
          ),
          outputHeight: Math.round(
            captureRect.height * RECORD_IMAGE_PIXEL_RATIO,
          ),
          pixelRatio: RECORD_IMAGE_PIXEL_RATIO,
        })

        const fileStartedAt = performance.now()
        const file = createRecordFile(blob, session.startedAt)
        const fileElapsedMs = performance.now() - fileStartedAt

        logShareDebug('file-created', {
          source,
          blobFileElapsedMs: fileElapsedMs,
          totalImageGenerationElapsedMs:
            performance.now() - generationStartedAt,
          fontReadyElapsedMs: fontElapsedMs,
          captureElapsedMs,
          fileName: file.name,
          fileSize: file.size,
          fileType: file.type,
        })

        if (preparedImageKeyRef.current === generationKey) {
          fallbackImageFileRef.current = file
        }

        return file
      })()

      preparationPromiseRef.current = preparationPromise
      void preparationPromise.then(
        () => {
          if (preparationPromiseRef.current === preparationPromise) {
            preparationPromiseRef.current = null
          }
        },
        (error) => {
          if (preparationPromiseRef.current === preparationPromise) {
            preparationPromiseRef.current = null
          }
          logShareDebug('generation-error', {
            source,
            totalImageGenerationElapsedMs:
              performance.now() - generationStartedAt,
            ...getErrorDetails(error),
          })
        },
      )

      return preparationPromise
    },
    [imageCacheKey, session],
  )

  useEffect(() => {
    let isCancelled = false
    let timeoutId: number | undefined
    let idleCallbackId: number | undefined
    let animationFrameId: number | undefined

    const startPreparation = () => {
      if (isCancelled) {
        return
      }

      void ensurePreparedFile('pre-generation').catch(() => undefined)
    }

    if (typeof window.requestIdleCallback === 'function') {
      idleCallbackId = window.requestIdleCallback(startPreparation, {
        timeout: 250,
      })
    } else {
      animationFrameId = window.requestAnimationFrame(() => {
        timeoutId = window.setTimeout(startPreparation, 0)
      })
    }

    return () => {
      isCancelled = true

      if (idleCallbackId !== undefined) {
        window.cancelIdleCallback(idleCallbackId)
      }

      if (timeoutId !== undefined) {
        window.clearTimeout(timeoutId)
      }

      if (animationFrameId !== undefined) {
        window.cancelAnimationFrame(animationFrameId)
      }
    }
  }, [ensurePreparedFile])

  const handleSaveImage = async () => {
    if (recordCardRef.current === null || isBusy) {
      return
    }

    setIsCreatingImage(true)
    setActionError('')

    try {
      const file = await ensurePreparedFile('save-click')
      const imageUrl = URL.createObjectURL(file)
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
      let file: File

      try {
        file = await ensurePreparedFile('share-click')
      } catch (error) {
        logShareDebug('image-error', {
          elapsedMs: performance.now() - shareStartedAt,
          userActivation: navigator.userActivation?.isActive ?? 'unsupported',
          ...getErrorDetails(error),
        })
        setActionError(COPY.result.imageError)
        setCanUseWebShare(false)
        return
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
    <>
      <main className="screen result-screen">
        <div className="screen-content result-content">
          <div className="result-card-display">
            <RecordCard session={session} />
          </div>

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

      <div className="share-capture-host" aria-hidden="true">
        <RecordShareCard ref={recordCardRef} session={session} />
      </div>
    </>
  )
}

export default ResultScreen
