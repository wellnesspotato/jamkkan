export type CheckInState = {
  startedAt: number
  body: string[]
  mind: string[]
  bodyCustomValue: string
  mindCustomValue: string
  bodyCustomEnabled: boolean
  mindCustomEnabled: boolean
  intention?: string
}

export type CheckInPhase =
  | 'intro'
  | 'body'
  | 'mind'
  | 'intention'
  | 'preparing'
  | 'complete'
