import { useState, type FormEvent } from 'react'

type ReflectionScreenProps = {
  keyword: string
  note: string
  place: string
  postitColor: string
  onComplete: (keyword: string, note: string, place: string) => void
}

function ReflectionScreen({
  keyword: initialKeyword,
  note: initialNote,
  place: initialPlace,
  postitColor,
  onComplete,
}: ReflectionScreenProps) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [note, setNote] = useState(initialNote)
  const [place, setPlace] = useState(initialPlace)
  const [isPlaceVisible, setIsPlaceVisible] = useState(initialPlace !== '')
  const [validationMessage, setValidationMessage] = useState('')

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    const trimmedKeyword = keyword.trim()

    if (trimmedKeyword === '') {
      setValidationMessage('짧게 하나만 남겨주세요.')
      return
    }

    onComplete(trimmedKeyword, note.trim(), place.trim())
  }

  return (
    <main className="screen reflection-screen">
      <form
        className="screen-content reflection-form"
        onSubmit={handleSubmit}
      >
        <div className="postit" style={{ backgroundColor: postitColor }}>
          <label className="reflection-question" htmlFor="keyword">
            방금 가장 눈에 들어온 것은 무엇이었나요?
          </label>
          <input
            id="keyword"
            type="text"
            value={keyword}
            maxLength={30}
            placeholder="예: 구름"
            onChange={(event) => {
              setKeyword(event.target.value)
              setValidationMessage('')
            }}
          />

          <label className="field-label" htmlFor="note">
            조금 더 남기고 싶다면
          </label>
          <textarea
            id="note"
            value={note}
            maxLength={100}
            placeholder="생각보다 하늘이 빠르게 움직이고 있었다."
            onChange={(event) => setNote(event.target.value)}
          />

          {isPlaceVisible ? (
            <div className="place-field">
              <label className="field-label" htmlFor="place">
                장소
              </label>
              <input
                id="place"
                type="text"
                value={place}
                placeholder="예: 석촌호수"
                onChange={(event) => setPlace(event.target.value)}
              />
            </div>
          ) : (
            <button
              className="place-action"
              type="button"
              onClick={() => setIsPlaceVisible(true)}
            >
              + 장소 남기기
            </button>
          )}
        </div>

        {validationMessage !== '' && (
          <p className="validation-message" aria-live="polite">
            {validationMessage}
          </p>
        )}
        <button className="reflection-submit" type="submit">
          기록 남기기
        </button>
      </form>
    </main>
  )
}

export default ReflectionScreen
