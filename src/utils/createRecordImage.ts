import { getFontEmbedCSS, toBlob } from 'html-to-image'

export const RECORD_IMAGE_PIXEL_RATIO = 2

const fontEmbedCssPromises = new Map<string, Promise<string>>()

function getRecordImageFontEmbedCss(element: HTMLElement, fontCacheKey: string) {
  const cachedPromise = fontEmbedCssPromises.get(fontCacheKey)

  if (cachedPromise !== undefined) {
    return cachedPromise
  }

  const fontEmbedCssPromise = getFontEmbedCSS(element).catch((error) => {
    fontEmbedCssPromises.delete(fontCacheKey)
    throw error
  })

  fontEmbedCssPromises.set(fontCacheKey, fontEmbedCssPromise)
  return fontEmbedCssPromise
}

export async function prepareRecordImageFonts(
  element: HTMLElement,
  fontCacheKey = 'default',
) {
  await getRecordImageFontEmbedCss(element, fontCacheKey)
}

export async function createRecordImage(
  element: HTMLElement,
  fontCacheKey = 'default',
): Promise<Blob> {
  const fontEmbedCSS = await getRecordImageFontEmbedCss(element, fontCacheKey)
  const backgroundColor = window.getComputedStyle(element).backgroundColor

  const blob = await toBlob(element, {
    backgroundColor,
    fontEmbedCSS,
    pixelRatio: RECORD_IMAGE_PIXEL_RATIO,
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
