import { useEffect, useState, type FormEvent, type KeyboardEvent } from 'react'
import { COPY } from '../constants/copy'
import {
  getNextKeywordFont,
  getKeywordSizeClass,
  KEYWORD_FONT_CLASS,
  preloadKeywordFont,
  preloadKeywordFonts,
} from '../constants/keywordFonts'
import type { KeywordFont } from '../types/pause'

type ReflectionScreenProps = {
  keyword: string
  note: string
  place: string
  keywordFont: KeywordFont
  postitColor: string
  isPreparingResult: boolean
  preparationError: string
  onComplete: (
    keyword: string,
    note: string,
    place: string,
    keywordFont: KeywordFont,
  ) => void
  onKeywordFontChange: (keywordFont: KeywordFont) => void
}

function ReflectionScreen({
  keyword: initialKeyword,
  note: initialNote,
  place: initialPlace,
  keywordFont,
  postitColor,
  isPreparingResult,
  preparationError,
  onComplete,
  onKeywordFontChange,
}: ReflectionScreenProps) {
  const [keyword, setKeyword] = useState(initialKeyword)
  const [note, setNote] = useState(initialNote)
  const [place, setPlace] = useState(initialPlace)
  const [isPlaceVisible, setIsPlaceVisible] = useState(initialPlace !== '')
  const [validationMessage, setValidationMessage] = useState('')

  useEffect(() => {
    preloadKeywordFonts()
  }, [])

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()

    if (isPreparingResult) {
      return
    }

    if ((event.nativeEvent as SubmitEvent).submitter === null) {
      return
    }

    const trimmedKeyword = keyword.trim()

    if (trimmedKeyword === '') {
      setValidationMessage(COPY.reflection.validationKeyword)
      return
    }

    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur()
    }

    onComplete(trimmedKeyword, note.trim(), place.trim(), keywordFont)
  }

  const handleKeywordKeyDown = (
    event: KeyboardEvent<HTMLTextAreaElement>,
  ) => {
    if (event.key === 'Enter' && !event.nativeEvent.isComposing) {
      event.preventDefault()
    }
  }

  const handleKeywordFontCycle = () => {
    const nextFont = getNextKeywordFont(keywordFont)

    onKeywordFontChange(nextFont)
    void preloadKeywordFont(nextFont)
  }

  return (
    <main
      className="screen reflection-screen"
      aria-busy={isPreparingResult}
    >
      <form
        className="screen-content reflection-form"
        inert={isPreparingResult}
        onSubmit={handleSubmit}
      >
        <label className="reflection-question" htmlFor="keyword">
          {COPY.reflection.question}
        </label>
        <p className="reflection-guide">{COPY.reflection.guide}</p>

        <div
          className="keyword-postit reflection-keyword-postit"
          style={{ backgroundColor: postitColor }}
        >
          <div className="keyword-input-zone">
            <textarea
              className={`reflection-keyword-input ${KEYWORD_FONT_CLASS[keywordFont]} ${getKeywordSizeClass(keyword)}`}
              id="keyword"
              value={keyword}
              maxLength={30}
              placeholder={COPY.reflection.keywordPlaceholder}
              onKeyDown={handleKeywordKeyDown}
              onChange={(event) => {
                setKeyword(event.target.value)
                setValidationMessage('')
              }}
              />
          </div>
          <button
            className="keyword-font-cycle-button"
            type="button"
            aria-label={COPY.reflection.fontCycleAria}
            onClick={handleKeywordFontCycle}
          >
            Aa
          </button>
        </div>

        <div className="reflection-details">
          <label className="field-label reflection-note-label" htmlFor="note">
            {COPY.reflection.noteLabel}
          </label>
          <textarea
            className="reflection-note-input"
            id="note"
            value={note}
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

        <button className="reflection-submit" type="submit">
          {COPY.reflection.submit}
        </button>
        {validationMessage !== '' && (
          <p className="validation-message" aria-live="polite">
            {validationMessage}
          </p>
        )}
        {preparationError !== '' && (
          <p className="validation-message" aria-live="polite">
            {preparationError}
          </p>
        )}
      </form>

      {isPreparingResult && (
        <div className="result-preparation-overlay">
          <div
            className="result-preparation-status"
            role="status"
            aria-live="polite"
          >
            <span className="result-preparation-spinner" aria-hidden="true" />
            <p className="result-preparation-title">
              {COPY.preparingResult.title}
            </p>
            <p className="result-preparation-description">
              {COPY.preparingResult.description}
            </p>
          </div>
        </div>
      )}
    </main>
  )
}

export default ReflectionScreen
