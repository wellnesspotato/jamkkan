import { preloadKeywordFont } from '../constants/keywordFonts'
import type { PauseSession } from '../types/pause'
import {
  createRecordImage,
  prepareRecordImageFonts,
  RECORD_IMAGE_PIXEL_RATIO,
} from './createRecordImage'
import { isShareDebugEnabled, logShareDebug } from './shareDebug'

const RECORD_UI_FONT_LOAD_VALUES = [
  '400 16px "Noto Sans KR"',
  '500 14px "Noto Sans KR"',
  '700 14px "Noto Sans KR"',
] as const

const shareFilePromises = new Map<string, Promise<File>>()
let generationCount = 0

function getSessionCacheKey(session: PauseSession) {
  return JSON.stringify([
    session.startedAt,
    session.endedAt,
    session.durationMs,
    session.keyword,
    session.note,
    session.place,
    session.themeId,
    session.keywordFont,
  ])
}

async function prepareVisibleRecordFonts(session: PauseSession) {
  const visibleFontsStartedAt = performance.now()
  const selectedFontStartedAt = performance.now()
  const selectedFontPromise = preloadKeywordFont(session.keywordFont).then(
    () => performance.now() - selectedFontStartedAt,
  )
  const uiFontStartedAt = performance.now()
  const uiFontPromise = Promise.all(
    RECORD_UI_FONT_LOAD_VALUES.map((font) =>
      document.fonts.check(font)
        ? Promise.resolve()
        : document.fonts.load(font).then(() => undefined),
    ),
  ).then(() => performance.now() - uiFontStartedAt)

  const [selectedFontReadyElapsedMs, uiFontReadyElapsedMs] =
    await Promise.all([selectedFontPromise, uiFontPromise])

  return {
    selectedFontReadyElapsedMs,
    uiFontReadyElapsedMs,
    visibleFontsReadyElapsedMs: performance.now() - visibleFontsStartedAt,
  }
}

function getCapturePixelRatio() {
  if (!isShareDebugEnabled()) {
    return RECORD_IMAGE_PIXEL_RATIO
  }

  const requestedRatio = Number(
    new URLSearchParams(window.location.search).get('sharePixelRatio'),
  )

  return requestedRatio === 1.5 ? 1.5 : RECORD_IMAGE_PIXEL_RATIO
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

async function generateRecordShareFile(
  captureElement: HTMLElement,
  session: PauseSession,
) {
  const generationStartedAt = performance.now()
  const pixelRatio = getCapturePixelRatio()
  generationCount += 1

  logShareDebug('image-generation-start', {
    keywordFont: session.keywordFont,
    generationCount,
  })

  const visibleFontMetrics = await prepareVisibleRecordFonts(session)

  logShareDebug('font-ready', {
    elapsedMs: visibleFontMetrics.visibleFontsReadyElapsedMs,
    selectedFontElapsedMs: visibleFontMetrics.selectedFontReadyElapsedMs,
    uiFontsElapsedMs: visibleFontMetrics.uiFontReadyElapsedMs,
  })

  const fontEmbedStartedAt = performance.now()
  const {
    fontEmbedCSS,
    cacheHit: fontEmbedCacheHit,
    source: fontEmbedSource,
  } = await prepareRecordImageFonts(session.keywordFont)
  const fontEmbedElapsedMs = performance.now() - fontEmbedStartedAt

  logShareDebug('font-embed-ready', {
    elapsedMs: fontEmbedElapsedMs,
    cacheHit: fontEmbedCacheHit,
    source: fontEmbedSource,
    cssLength: fontEmbedCSS.length,
  })

  const layoutStartedAt = performance.now()
  const captureRect = captureElement.getBoundingClientRect()
  const shareCardRect = captureElement
    .querySelector<HTMLElement>('.record-card')
    ?.getBoundingClientRect()
  const layoutElapsedMs = performance.now() - layoutStartedAt
  const outputWidth = Math.round(captureRect.width * pixelRatio)
  const outputHeight = Math.round(captureRect.height * pixelRatio)
  const outputPixelCount = outputWidth * outputHeight

  logShareDebug('capture-layout-ready', {
    elapsedMs: layoutElapsedMs,
    captureCssWidth: captureRect.width,
    captureCssHeight: captureRect.height,
    recordShareCardWidth: shareCardRect?.width ?? 'unavailable',
    recordShareCardHeight: shareCardRect?.height ?? 'unavailable',
    horizontalCapturePadding:
      shareCardRect === undefined
        ? 'unavailable'
        : captureRect.width - shareCardRect.width,
    verticalCapturePadding:
      shareCardRect === undefined
        ? 'unavailable'
        : captureRect.height - shareCardRect.height,
    outputWidth,
    outputHeight,
    outputPixelCount,
    pixelRatio,
  })

  const captureStartedAt = performance.now()

  logShareDebug('capture-start', {
    pixelRatio,
  })

  const blob = await createRecordImage(
    captureElement,
    session.keywordFont,
    fontEmbedCSS,
    pixelRatio,
  )
  const captureElapsedMs = performance.now() - captureStartedAt

  logShareDebug('capture-complete', {
    elapsedMs: captureElapsedMs,
    renderAndBlobElapsedMs: captureElapsedMs,
    blobSize: blob.size,
    blobType: blob.type,
    captureWrapperWidth: captureRect.width,
    captureWrapperHeight: captureRect.height,
    recordShareCardWidth: shareCardRect?.width ?? 'unavailable',
    recordShareCardHeight: shareCardRect?.height ?? 'unavailable',
    outputWidth,
    outputHeight,
    outputPixelCount,
    pixelRatio,
  })

  const fileStartedAt = performance.now()
  const file = createRecordFile(blob, session.startedAt)
  const fileElapsedMs = performance.now() - fileStartedAt

  logShareDebug('file-ready', {
    elapsedMs: fileElapsedMs,
    totalGenerationElapsedMs: performance.now() - generationStartedAt,
    ...visibleFontMetrics,
    fontEmbedElapsedMs,
    fontEmbedCacheHit,
    fontEmbedSource,
    layoutElapsedMs,
    captureElapsedMs,
    fileName: file.name,
    fileSize: file.size,
    fileType: file.type,
  })

  return file
}

export function createRecordShareFile(
  captureElement: HTMLElement,
  session: PauseSession,
) {
  const cacheKey = getSessionCacheKey(session)
  const cachedPromise = shareFilePromises.get(cacheKey)

  if (cachedPromise !== undefined) {
    logShareDebug('share-file-cache-hit', {
      generationCount,
    })
    return cachedPromise
  }

  logShareDebug('share-file-cache-miss', {
    generationCount,
  })

  // Only the current Result session needs to remain in memory.
  shareFilePromises.clear()

  const generationPromise = generateRecordShareFile(captureElement, session)
    .then((file) => {
      logShareDebug('share-file-cached', {
        generationCount,
        fileSize: file.size,
      })
      return file
    })
    .catch((error) => {
      shareFilePromises.delete(cacheKey)
      throw error
    })

  shareFilePromises.set(cacheKey, generationPromise)
  return generationPromise
}
