export type Mode = 'focus' | 'shortBreak' | 'longBreak'

export interface Settings {
  focusDuration: number
  shortBreakDuration: number
  longBreakDuration: number
  longBreakInterval: number
  autoStartBreaks: boolean
  autoStartPomodoros: boolean
  soundEnabled: boolean
  volume: number
}

export interface TimerState {
  mode: Mode
  isRunning: boolean
  remainingSeconds: number
  totalDuration: number
  completedPomodoros: number
  endAt: number | null
}

export interface PersistedData {
  settings: Settings
  timer: TimerState
}
