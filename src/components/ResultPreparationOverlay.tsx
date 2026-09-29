import { COPY } from '../constants/copy'

function ResultPreparationOverlay() {
  return (
    <div className="result-preparation-overlay">
      <div className="result-preparation-status" role="status" aria-live="polite">
        <p className="result-preparation-title">{COPY.preparingResult.title}</p>
        <p className="result-preparation-description">
          {COPY.preparingResult.description}
        </p>
      </div>
    </div>
  )
}

export default ResultPreparationOverlay
