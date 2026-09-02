import { getFontEmbedCSS, toBlob } from 'html-to-image'
import { KEYWORD_FONT_FAMILY } from '../constants/keywordFonts'
import type { KeywordFont } from '../types/pause'
import { isShareDebugEnabled, logShareDebug } from './shareDebug'

export const RECORD_IMAGE_PIXEL_RATIO = 2

type FontEmbedSource =
  | 'prewarmed'
  | 'cache'
  | 'in-flight-promise'
  | 'generated'

let fontEmbedCssPromise: Promise<string> | null = null
let fontEmbedCssCache: string | null = null
let fontEmbedPromiseOrigin: 'prewarmed' | 'generated' | null = null
let fontEmbedCacheOrigin: 'prewarmed' | 'generated' | null = null
const fontEmbedVariantCache = new Map<KeywordFont, string>()

const GOOGLE_FONT_CSS_URL =
  'https://fonts.googleapis.com/css2?family=Noto+Sans+KR:wght@400;500;600;700&family=Noto+Serif+KR:wght@500&display=swap'

function getFontEmbedCssForKeywordFont(
  allFontEmbedCSS: string,
  keywordFont: KeywordFont,
) {
  const cachedCSS = fontEmbedVariantCache.get(keywordFont)

  if (cachedCSS !== undefined) {
    return cachedCSS
  }

  const selectedFamily = KEYWORD_FONT_FAMILY[keywordFont]
  const fontFaceRules = allFontEmbedCSS.match(/@font-face\s*{[^}]*}/g) ?? []
  const selectedCSS = fontFaceRules
    .filter(
      (rule) =>
        rule.includes('Noto Sans KR') || rule.includes(selectedFamily),
    )
    .join('\n')

  if (!selectedCSS.includes(selectedFamily)) {
    throw new Error(
      `Embedded CSS does not include the selected keyword font: ${selectedFamily}`,
    )
  }

  fontEmbedVariantCache.set(keywordFont, selectedCSS)
  return selectedCSS
}

function createFontEmbedProbe() {
  const probe = document.createElement('div')

  probe.setAttribute('aria-hidden', 'true')
  probe.style.position = 'fixed'
  probe.style.top = '0'
  probe.style.left = '-10000px'
  probe.style.width = '1px'
  probe.style.height = '1px'
  probe.style.overflow = 'hidden'
  probe.style.pointerEvents = 'none'
  probe.style.fontFamily = [
    '"Noto Sans KR"',
    '"Noto Serif KR"',
    '"NanumURiDdarSonGeurSsi"',
    '"NanumSinHonBuBu"',
  ].join(', ')
  probe.textContent = '잠깐'
  document.body.appendChild(probe)

  return probe
}

function generateFontEmbedCssInWorker() {
  return new Promise<string>((resolve, reject) => {
    const worker = new Worker(
      new URL('./recordFontEmbed.worker.ts', import.meta.url),
      { type: 'module' },
    )

    worker.onmessage = (
      event: MessageEvent<
        | {
            type: 'progress'
            step: string
            elapsedMs: number
            resourceCount?: number
          }
        | {
            type: 'complete'
            css: string
            elapsedMs: number
            resourceCount: number
          }
        | { type: 'error'; message: string }
      >,
    ) => {
      if (event.data.type === 'progress') {
        logShareDebug('font-prewarm-worker-progress', event.data)
        return
      }

      worker.terminate()

      if (event.data.type === 'complete') {
        logShareDebug('font-prewarm-worker-complete', {
          elapsedMs: event.data.elapsedMs,
          resourceCount: event.data.resourceCount,
        })
        resolve(event.data.css)
        return
      }

      reject(new Error(event.data.message))
    }

    worker.onerror = (event) => {
      worker.terminate()
      reject(new Error(event.message || 'Font embed worker failed.'))
    }

    worker.postMessage({
      googleCssUrl: GOOGLE_FONT_CSS_URL,
      daughterFontUrl: new URL(
        '../assets/NanumURiDdarSonGeurSsi.woff2',
        import.meta.url,
      ).href,
      newlywedFontUrl: new URL(
        '../assets/NanumSinHonBuBu.woff2',
        import.meta.url,
      ).href,
    })
  })
}

function generateFontEmbedCssOnMainThread() {
  const probe = createFontEmbedProbe()

  return getFontEmbedCSS(probe, {
    preferredFontFormat: 'woff2',
  }).finally(() => {
    probe.remove()
  })
}

function startFontEmbedCssGeneration(origin: 'prewarmed' | 'generated') {
  fontEmbedPromiseOrigin = origin

  const promise = generateFontEmbedCssInWorker()
    .catch((workerError) => {
      logShareDebug('font-prewarm-worker-fallback', {
        message:
          workerError instanceof Error
            ? workerError.message
            : String(workerError),
      })
      return generateFontEmbedCssOnMainThread()
    })
    .then((fontEmbedCSS) => {
      fontEmbedCssCache = fontEmbedCSS
      fontEmbedCssPromise = null
      fontEmbedCacheOrigin = origin
      fontEmbedPromiseOrigin = null
      return fontEmbedCSS
    })
    .catch((error) => {
      fontEmbedCssPromise = null
      fontEmbedPromiseOrigin = null
      throw error
    })

  fontEmbedCssPromise = promise
  return promise
}

function observePrewarmLongTasks() {
  if (
    !isShareDebugEnabled() ||
    typeof PerformanceObserver === 'undefined' ||
    !PerformanceObserver.supportedEntryTypes.includes('longtask')
  ) {
    return () => undefined
  }

  let count = 0
  let longestTaskMs = 0
  const observer = new PerformanceObserver((list) => {
    list.getEntries().forEach((entry) => {
      count += 1
      longestTaskMs = Math.max(longestTaskMs, entry.duration)
    })
  })

  observer.observe({ entryTypes: ['longtask'] })

  return () => {
    observer.disconnect()
    logShareDebug('font-prewarm-main-thread-tasks', {
      count,
      longestTaskMs,
    })
  }
}

export function prewarmRecordImageFonts() {
  if (fontEmbedCssCache !== null) {
    logShareDebug('font-embed-prewarm-cache-hit', {
      cssLength: fontEmbedCssCache.length,
    })
    return Promise.resolve(fontEmbedCssCache)
  }

  if (fontEmbedCssPromise !== null) {
    logShareDebug('font-embed-prewarm-promise-reused', {
      origin: fontEmbedPromiseOrigin,
    })
    return fontEmbedCssPromise
  }

  const prewarmStartedAt = performance.now()
  const stopLongTaskObserver = observePrewarmLongTasks()
  logShareDebug('font-embed-prewarm-start')

  const promise = startFontEmbedCssGeneration('prewarmed')
  void promise.then(
    (fontEmbedCSS) => {
      stopLongTaskObserver()
      logShareDebug('font-embed-prewarm-complete', {
        prewarmElapsedMs: performance.now() - prewarmStartedAt,
        cssLength: fontEmbedCSS.length,
        sansCssLength: getFontEmbedCssForKeywordFont(fontEmbedCSS, 'sans')
          .length,
        serifCssLength: getFontEmbedCssForKeywordFont(fontEmbedCSS, 'serif')
          .length,
        daughterCssLength: getFontEmbedCssForKeywordFont(
          fontEmbedCSS,
          'daughter',
        ).length,
        newlywedCssLength: getFontEmbedCssForKeywordFont(
          fontEmbedCSS,
          'newlywed',
        ).length,
      })
    },
    (error) => {
      stopLongTaskObserver()
      logShareDebug('font-embed-prewarm-failed', {
        prewarmElapsedMs: performance.now() - prewarmStartedAt,
        message: error instanceof Error ? error.message : String(error),
      })
    },
  )

  return promise
}

export function getRecordImageFontEmbedStatus() {
  if (fontEmbedCssCache !== null) {
    return 'ready' as const
  }

  if (fontEmbedCssPromise !== null) {
    return 'in-flight' as const
  }

  return 'not-started' as const
}

export async function prepareRecordImageFonts(keywordFont: KeywordFont) {
  if (fontEmbedCssCache !== null) {
    const source: FontEmbedSource =
      fontEmbedCacheOrigin === 'prewarmed' ? 'prewarmed' : 'cache'

    return {
      fontEmbedCSS: getFontEmbedCssForKeywordFont(
        fontEmbedCssCache,
        keywordFont,
      ),
      cacheHit: true,
      source,
    }
  }

  if (fontEmbedCssPromise !== null) {
    const allFontEmbedCSS = await fontEmbedCssPromise

    return {
      fontEmbedCSS: getFontEmbedCssForKeywordFont(
        allFontEmbedCSS,
        keywordFont,
      ),
      cacheHit: false,
      source: 'in-flight-promise' as const,
    }
  }

  const allFontEmbedCSS = await startFontEmbedCssGeneration('generated')

  return {
    fontEmbedCSS: getFontEmbedCssForKeywordFont(
      allFontEmbedCSS,
      keywordFont,
    ),
    cacheHit: false,
    source: 'generated' as const,
  }
}

export async function createRecordImage(
  element: HTMLElement,
  keywordFont: KeywordFont,
  preparedFontEmbedCSS?: string,
  pixelRatio = RECORD_IMAGE_PIXEL_RATIO,
): Promise<Blob> {
  const fontEmbedCSS =
    preparedFontEmbedCSS ??
    (await prepareRecordImageFonts(keywordFont)).fontEmbedCSS
  const backgroundColor = window.getComputedStyle(element).backgroundColor

  const blob = await toBlob(element, {
    backgroundColor,
    fontEmbedCSS,
    pixelRatio,
  })

  if (
    blob === null ||
    !(blob instanceof Blob) ||
    blob.size === 0 ||
    blob.type !== 'image/png'
  ) {
    throw new Error('RecordCard PNG blob could not be created.')
  }

  return blob
}
