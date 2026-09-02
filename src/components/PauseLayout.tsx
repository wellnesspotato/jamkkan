import type { ReactNode } from 'react'

type PauseLayoutProps = {
  hourglass: ReactNode
  title: ReactNode
  description: ReactNode
}

function PauseLayout({ hourglass, title, description }: PauseLayoutProps) {
  return (
    <div className="pause-layout">
      <div className="hourglass-stage">
        <div className="hourglass-viewport">{hourglass}</div>
      </div>
      <div className="pause-copy-stage">
        <div className="pause-title-stage">
          <p className="pause-layout-title">{title}</p>
        </div>
        <div className="pause-description-stage">{description}</div>
      </div>
    </div>
  )
}

export default PauseLayout
