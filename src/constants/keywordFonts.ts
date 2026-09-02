import type { KeywordFont } from '../types/pause'

export const KEYWORD_FONT_ORDER: readonly KeywordFont[] = [
  'sans',
  'serif',
  'daughter',
  'newlywed',
]

export const KEYWORD_FONT_CLASS: Record<KeywordFont, string> = {
  sans: 'keyword-font--sans',
  serif: 'keyword-font--serif',
  daughter: 'keyword-font--daughter',
  newlywed: 'keyword-font--newlywed',
}

const KEYWORD_FONT_LOAD_VALUE: Record<KeywordFont, string> = {
  sans: '600 28px "Noto Sans KR"',
  serif: '500 29px "Noto Serif KR"',
  daughter: '400 36px "NanumURiDdarSonGeurSsi"',
  newlywed: '400 35px "NanumSinHonBuBu"',
}

const keywordFontLoadPromises = new Map<KeywordFont, Promise<void>>()

export function getNextKeywordFont(currentFont: KeywordFont): KeywordFont {
  const currentIndex = KEYWORD_FONT_ORDER.indexOf(currentFont)

  return KEYWORD_FONT_ORDER[(currentIndex + 1) % KEYWORD_FONT_ORDER.length]
}

export function preloadKeywordFont(font: KeywordFont) {
  const existingPromise = keywordFontLoadPromises.get(font)

  if (existingPromise !== undefined) {
    return existingPromise
  }

  if (typeof document === 'undefined' || !('fonts' in document)) {
    return Promise.resolve()
  }

  const fontLoadPromise = document.fonts
    .load(KEYWORD_FONT_LOAD_VALUE[font])
    .then(() => undefined)
    .catch(() => undefined)

  keywordFontLoadPromises.set(font, fontLoadPromise)

  return fontLoadPromise
}

export function preloadKeywordFonts() {
  void Promise.all(KEYWORD_FONT_ORDER.map(preloadKeywordFont))
}
