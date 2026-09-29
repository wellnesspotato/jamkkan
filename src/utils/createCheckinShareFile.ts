import {
  createRecordImage,
  prepareCheckinImageFonts,
  RECORD_IMAGE_PIXEL_RATIO,
} from './createRecordImage'
import { logExportTiming } from './shareDebug'

let generationCount = 0

function createCheckinImageFileName(startedAt: number) {
  const date = new Date(startedAt)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')

  return `-checkin-${year}-${month}-${day}-${hours}${minutes}.png`
}

function waitForPaintFrames() {
  return new Promise<void>((resolve) => {
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => resolve())
    })
  })
}

export async function createCheckinShareFile(
  captureElement: HTMLElement,
  startedAt: number,
) {
  const generationStartedAt = performance.now()
  generationCount += 1
  const captureRect = captureElement.getBoundingClientRect()

  logExportTiming('checkin', 'generation-start', {
    generationCount,
    captureCssWidth: captureRect.width,
    captureCssHeight: captureRect.height,
    pixelRatio: RECORD_IMAGE_PIXEL_RATIO,
    outputWidth: Math.round(captureRect.width * RECORD_IMAGE_PIXEL_RATIO),
    outputHeight: Math.round(captureRect.height * RECORD_IMAGE_PIXEL_RATIO),
  })

  const documentFontsStartedAt = performance.now()
  await document.fonts.ready
  const documentFontsElapsedMs = performance.now() - documentFontsStartedAt
  logExportTiming('checkin', 'document-fonts-ready', {
    elapsedMs: documentFontsElapsedMs,
  })

  const fontEmbedStartedAt = performance.now()
  const fontEmbed = await prepareCheckinImageFonts(
    captureElement.textContent ?? '',
  )
  const fontEmbedElapsedMs = performance.now() - fontEmbedStartedAt
  logExportTiming('checkin', 'font-embed-ready', {
    elapsedMs: fontEmbedElapsedMs,
    cacheHit: fontEmbed.cacheHit,
    source: fontEmbed.source,
    cssLength: fontEmbed.fontEmbedCSS.length,
    resourceCount: fontEmbed.resourceCount,
  })

  const paintFramesStartedAt = performance.now()
  await waitForPaintFrames()
  const paintFramesElapsedMs = performance.now() - paintFramesStartedAt
  logExportTiming('checkin', 'paint-frames-ready', {
    elapsedMs: paintFramesElapsedMs,
    frameCount: 2,
  })

  // The existing record image utility embeds the same Noto Sans KR font used here.
  const captureStartedAt = performance.now()
  const blob = await createRecordImage(
    captureElement,
    'sans',
    fontEmbed.fontEmbedCSS,
    RECORD_IMAGE_PIXEL_RATIO,
  )
  const captureElapsedMs = performance.now() - captureStartedAt
  logExportTiming('checkin', 'dom-to-blob-complete', {
    elapsedMs: captureElapsedMs,
    blobSize: blob.size,
    blobType: blob.type,
  })

  const fileStartedAt = performance.now()
  const file = new File([blob], createCheckinImageFileName(startedAt), {
    type: 'image/png',
  })
  const fileElapsedMs = performance.now() - fileStartedAt

  if (file.size === 0 || file.type !== 'image/png') {
    throw new Error('Check-in PNG file could not be created.')
  }

  logExportTiming('checkin', 'file-ready', {
    elapsedMs: fileElapsedMs,
    totalGenerationElapsedMs: performance.now() - generationStartedAt,
    generationCount,
    fileName: file.name,
    fileSize: file.size,
    documentFontsElapsedMs,
    fontEmbedElapsedMs,
    paintFramesElapsedMs,
    captureElapsedMs,
  })

  return file
}
