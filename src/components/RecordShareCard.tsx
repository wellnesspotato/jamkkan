import { forwardRef } from 'react'
import type { PauseSession } from '../types/pause'
import RecordCard from './RecordCard'

type RecordShareCardProps = {
  session: PauseSession
}

const RecordShareCard = forwardRef<HTMLElement, RecordShareCardProps>(
  function RecordShareCard({ session }, ref) {
    return (
      <div className="share-capture-wrapper">
        <RecordCard ref={ref} session={session} showInstagramHandle />
      </div>
    )
  },
)

export default RecordShareCard
