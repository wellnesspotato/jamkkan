import { getFontEmbedCSS, toBlob } from 'html-to-image'

export const RECORD_IMAGE_PIXEL_RATIO = 2

let fontEmbedCssPromise: Promise<string> | null = null

async function getRecordImageFontEmbedCss(element: HTMLElement) {
  await document.fonts.ready

  if (fontEmbedCssPromise === null) {
    fontEmbedCssPromise = getFontEmbedCSS(element).catch((error) => {
      fontEmbedCssPromise = null
      throw error
    })
  }

  return fontEmbedCssPromise
}

export async function prepareRecordImageFonts(element: HTMLElement) {
  await getRecordImageFontEmbedCss(element)
}

export async function createRecordImage(element: HTMLElement): Promise<Blob> {
  const fontEmbedCSS = await getRecordImageFontEmbedCss(element)
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
