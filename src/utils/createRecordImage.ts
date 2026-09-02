import { toBlob } from 'html-to-image'

export async function createRecordImage(element: HTMLElement): Promise<Blob> {
  await document.fonts.ready

  const blob = await toBlob(element, {
    backgroundColor: '#fffdf8',
    pixelRatio: 2,
  })

  if (blob === null) {
    throw new Error('RecordCard PNG blob could not be created.')
  }

  return blob
}
