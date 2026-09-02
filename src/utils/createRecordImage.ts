import { toBlob } from 'html-to-image'

export async function createRecordImage(element: HTMLElement): Promise<Blob> {
  await document.fonts.ready
  const backgroundColor = window.getComputedStyle(element).backgroundColor

  const blob = await toBlob(element, {
    backgroundColor,
    pixelRatio: 2,
  })

  if (blob === null) {
    throw new Error('RecordCard PNG blob could not be created.')
  }

  return blob
}
