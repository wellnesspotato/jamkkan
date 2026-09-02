import { useRef, useState } from 'react'
import RecordCard from '../components/RecordCard'
import { COPY } from '../constants/copy'
import type { PauseSession } from '../types/pause'
import { createRecordImage } from '../utils/createRecordImage'

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

function supportsPngFileSharing() {
  if (
    typeof navigator.share !== 'function' ||
    typeof navigator.canShare !== 'function'
  ) {
    return false
  }

  try {
    const testFile = new File([], 'jamkkan.png', { type: 'image/png' })
    return navigator.canShare({ files: [testFile] })
  } catch {
    return false
  }
}

function ResultScreen({ session, onRestart }: ResultScreenProps) {
  const recordCardRef = useRef<HTMLElement>(null)
  const [isCreatingImage, setIsCreatingImage] = useState(false)
  const [isSharing, setIsSharing] = useState(false)
  const [actionError, setActionError] = useState('')
  const [canSharePngFiles] = useState(supportsPngFileSharing)
  const isBusy = isCreatingImage || isSharing

  const handleSaveImage = async () => {
    if (recordCardRef.current === null || isBusy) {
      return
    }

    setIsCreatingImage(true)
    setActionError('')

    try {
      const blob = await createRecordImage(recordCardRef.current)
      const imageUrl = URL.createObjectURL(blob)
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
    if (recordCardRef.current === null || isBusy) {
      return
    }

    setIsSharing(true)
    setActionError('')

    try {
      const blob = await createRecordImage(recordCardRef.current)
      const file = new File(
        [blob],
        createImageFileName(session.startedAt),
        { type: 'image/png' },
      )
      const shareData: ShareData = { files: [file] }

      if (
        typeof navigator.share !== 'function' ||
        typeof navigator.canShare !== 'function' ||
        !navigator.canShare(shareData)
      ) {
        setActionError(COPY.result.shareUnavailable)
        return
      }

      await navigator.share(shareData)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setActionError(COPY.result.shareError)
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <main className="screen result-screen">
      <div className="screen-content result-content">
        <RecordCard ref={recordCardRef} session={session} />

        <div className="result-controls">
          {canSharePngFiles ? (
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
            {canSharePngFiles
              ? COPY.result.saveHint
              : COPY.result.downloadHint}
          </p>
          <button className="restart-button" type="button" onClick={onRestart}>
            {COPY.result.restart}
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultScreen
