import { COPY } from '../constants/copy'

function BrandLogo() {
  return (
    <span className="brand-logo">
      <span className="brand-logo__bold">{COPY.landing.title.slice(0, 1)}</span>
      <span className="brand-logo__medium">—</span>
      <span className="brand-logo__bold">{COPY.landing.title.slice(1, 2)}</span>
    </span>
  )
}

export default BrandLogo
