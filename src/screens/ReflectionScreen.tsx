import { useState, type FormEvent } from 'react'
import { COPY } from '../constants/copy'

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
      setValidationMessage(COPY.reflection.validationKeyword)
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
            {COPY.reflection.question}
          </label>
          <input
            className="reflection-keyword-input"
            id="keyword"
            type="text"
            value={keyword}
            maxLength={30}
            placeholder={COPY.reflection.keywordPlaceholder}
            onChange={(event) => {
              setKeyword(event.target.value)
              setValidationMessage('')
            }}
          />

          <label className="field-label" htmlFor="note">
            {COPY.reflection.noteLabel}
          </label>
          <textarea
            className="reflection-note-input"
            id="note"
            value={note}
            maxLength={100}
            placeholder={COPY.reflection.notePlaceholder}
            onChange={(event) => setNote(event.target.value)}
          />

          {isPlaceVisible ? (
            <div className="place-field">
              <label className="field-label" htmlFor="place">
                {COPY.reflection.placeLabel}
              </label>
              <input
                className="reflection-place-input"
                id="place"
                type="text"
                value={place}
                placeholder={COPY.reflection.placePlaceholder}
                onChange={(event) => setPlace(event.target.value)}
              />
            </div>
          ) : (
            <button
              className="place-action"
              type="button"
              onClick={() => setIsPlaceVisible(true)}
            >
              {COPY.reflection.placeAction}
            </button>
          )}
        </div>

        {validationMessage !== '' && (
          <p className="validation-message" aria-live="polite">
            {validationMessage}
          </p>
        )}
        <button className="reflection-submit" type="submit">
          {COPY.reflection.submit}
        </button>
      </form>
    </main>
  )
}

export default ReflectionScreen
