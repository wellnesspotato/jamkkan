import { getFontEmbedCSS, toBlob } from 'html-to-image'
import type { KeywordFont } from '../types/pause'
import { logShareDebug } from './shareDebug'

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

const KEYWORD_FONT_FAMILY: Record<KeywordFont, string> = {
  sans: 'Noto Sans KR',
  serif: 'Noto Serif KR',
  daughter: 'NanumURiDdarSonGeurSsi',
  newlywed: 'NanumSinHonBuBu',
}

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

function startFontEmbedCssGeneration(origin: 'prewarmed' | 'generated') {
  const probe = createFontEmbedProbe()
  fontEmbedPromiseOrigin = origin

  const promise = getFontEmbedCSS(probe, {
    preferredFontFormat: 'woff2',
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
    .finally(() => {
      probe.remove()
    })

  fontEmbedCssPromise = promise
  return promise
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
  logShareDebug('font-embed-prewarm-start')

  const promise = startFontEmbedCssGeneration('prewarmed')
  void promise.then(
    (fontEmbedCSS) => {
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
