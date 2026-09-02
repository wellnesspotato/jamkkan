import { COPY } from '../constants/copy'

function BrandLogo() {
  return (
    <span className="brand-logo">
      <span className="brand-logo__bold">{COPY.landing.title.slice(0, 2)}</span>
      <span className="brand-logo__medium">{COPY.landing.title.slice(2)}</span>
    </span>
  )
}

export default BrandLogo
