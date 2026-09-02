import { forwardRef } from 'react'
import type { PauseSession } from '../types/pause'
import RecordCard from './RecordCard'

type RecordShareCardProps = {
  session: PauseSession
}

const RecordShareCard = forwardRef<HTMLDivElement, RecordShareCardProps>(
  function RecordShareCard({ session }, ref) {
    return (
      <div ref={ref} className="share-capture-wrapper">
        <RecordCard session={session} />
      </div>
    )
  },
)

export default RecordShareCard
