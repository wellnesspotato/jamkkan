import { useRef, useState } from 'react'
import RecordCard from '../components/RecordCard'
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
      setActionError('이미지를 만들지 못했어요. 다시 한 번 시도해주세요.')
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
        setActionError('이미지로 저장해 직접 공유할 수 있어요.')
        return
      }

      await navigator.share(shareData)
    } catch (error) {
      if (error instanceof DOMException && error.name === 'AbortError') {
        return
      }

      setActionError(
        '공유하지 못했어요. 이미지로 저장해 직접 공유할 수 있어요.',
      )
    } finally {
      setIsSharing(false)
    }
  }

  return (
    <main className="screen result-screen">
      <div className="screen-content result-content">
        <RecordCard ref={recordCardRef} session={session} />

        <div className="result-controls">
          <button
            className="save-image-button"
            type="button"
            disabled={isBusy}
            onClick={handleSaveImage}
          >
            {isCreatingImage ? '이미지 만드는 중...' : '이미지로 저장하기'}
          </button>
          {canSharePngFiles && (
            <button
              className="share-button"
              type="button"
              disabled={isBusy}
              onClick={handleShare}
            >
              {isSharing ? '공유 준비 중...' : '공유하기'}
            </button>
          )}
          {actionError !== '' && (
            <p className="image-error" aria-live="polite">
              {actionError}
            </p>
          )}
          <p className="result-guidance">
            이 기록은 이곳에 저장되지 않아요.
            <br />
            남겨두고 싶다면 이미지로 가져가세요.
          </p>
          <button className="restart-button" type="button" onClick={onRestart}>
            처음으로
          </button>
        </div>
      </div>
    </main>
  )
}

export default ResultScreen
