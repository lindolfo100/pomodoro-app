import { useCallback, useEffect, useState, useRef } from 'react'
import type { Mode, PersistedData, Settings, TimerState } from '../types'

const STORAGE_KEY = 'pomodoro-app:v1'

const DEFAULT_SETTINGS: Settings = {
  focusDuration: 25,
  shortBreakDuration: 5,
  longBreakDuration: 15,
  longBreakInterval: 4,
  autoStartBreaks: false,
  autoStartPomodoros: false,
  soundEnabled: true,
  volume: 0.7,
}

const MODE_LABELS: Record<Mode, string> = {
  focus: 'Foco',
  shortBreak: 'Pausa curta',
  longBreak: 'Pausa longa',
}

const MODE_ORDER: Mode[] = ['focus', 'shortBreak', 'longBreak']

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value))
}

function isMode(value: unknown): value is Mode {
  return MODE_ORDER.includes(value as Mode)
}

function durationForMode(mode: Mode, settings: Settings) {
  const minutes = {
    focus: settings.focusDuration,
    shortBreak: settings.shortBreakDuration,
    longBreak: settings.longBreakDuration,
  }[mode]

  return Math.max(1, Math.round(minutes)) * 60
}

function createDefaultTimer(settings: Settings): TimerState {
  const totalDuration = durationForMode('focus', settings)
  return {
    mode: 'focus',
    isRunning: false,
    remainingSeconds: totalDuration,
    totalDuration,
    completedPomodoros: 0,
    endAt: null,
  }
}

function normalizeSettings(value: unknown): Settings {
  const candidate = value as Partial<Settings> | null | undefined
  const volumeValue = candidate?.volume ?? DEFAULT_SETTINGS.volume
  const parsedVolume = Number(volumeValue)

  return {
    focusDuration: clamp(Number(candidate?.focusDuration) || DEFAULT_SETTINGS.focusDuration, 1, 180),
    shortBreakDuration: clamp(
      Number(candidate?.shortBreakDuration) || DEFAULT_SETTINGS.shortBreakDuration,
      1,
      180,
    ),
    longBreakDuration: clamp(
      Number(candidate?.longBreakDuration) || DEFAULT_SETTINGS.longBreakDuration,
      1,
      180,
    ),
    longBreakInterval: clamp(
      Number(candidate?.longBreakInterval) || DEFAULT_SETTINGS.longBreakInterval,
      1,
      12,
    ),
    autoStartBreaks: Boolean(candidate?.autoStartBreaks ?? DEFAULT_SETTINGS.autoStartBreaks),
    autoStartPomodoros: Boolean(
      candidate?.autoStartPomodoros ?? DEFAULT_SETTINGS.autoStartPomodoros,
    ),
    soundEnabled: Boolean(candidate?.soundEnabled ?? DEFAULT_SETTINGS.soundEnabled),
    volume: clamp(Number.isNaN(parsedVolume) ? DEFAULT_SETTINGS.volume : parsedVolume, 0, 1),
  }
}

function normalizeTimer(value: unknown, settings: Settings): TimerState {
  const candidate = value as Partial<TimerState> | null | undefined
  const mode = isMode(candidate?.mode) ? candidate.mode : 'focus'
  const duration = durationForMode(mode, settings)
  const remainingSeconds = clamp(Number(candidate?.remainingSeconds) || duration, 0, 60 * 180)
  const totalDuration = clamp(Number(candidate?.totalDuration) || duration, 1, 60 * 180)
  const isRunning = Boolean(candidate?.isRunning)
  const endAt =
    isRunning && typeof candidate?.endAt === 'number'
      ? candidate.endAt
      : isRunning
        ? Date.now() + remainingSeconds * 1000
        : null

  return {
    mode,
    isRunning,
    remainingSeconds: remainingSeconds > 0 ? remainingSeconds : duration,
    totalDuration: totalDuration > 0 ? totalDuration : duration,
    completedPomodoros: Math.max(0, Math.floor(Number(candidate?.completedPomodoros) || 0)),
    endAt,
  }
}

function loadPersistedData(): PersistedData {
  if (typeof window === 'undefined') {
    return {
      settings: DEFAULT_SETTINGS,
      timer: createDefaultTimer(DEFAULT_SETTINGS),
    }
  }

  try {
    const raw = window.localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return {
        settings: DEFAULT_SETTINGS,
        timer: createDefaultTimer(DEFAULT_SETTINGS),
      }
    }

    const parsed = JSON.parse(raw) as Partial<PersistedData>
    const settings = normalizeSettings(parsed.settings)
    const timer = normalizeTimer(parsed.timer, settings)

    return { settings, timer }
  } catch {
    return {
      settings: DEFAULT_SETTINGS,
      timer: createDefaultTimer(DEFAULT_SETTINGS),
    }
  }
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function formatTitle(remainingSeconds: number, mode: Mode) {
  return `${formatTime(remainingSeconds)} · ${MODE_LABELS[mode]} | Pomodoro`
}

function playBellTone(context: AudioContext, volume: number) {
  const now = context.currentTime
  const notes = [
    { frequency: 784, start: 0, duration: 0.12 },
    { frequency: 988, start: 0.14, duration: 0.12 },
    { frequency: 1174, start: 0.28, duration: 0.16 },
  ]

  notes.forEach(({ frequency, start, duration }) => {
    const oscillator = context.createOscillator()
    const gain = context.createGain()
    const filter = context.createBiquadFilter()

    oscillator.type = 'sine'
    oscillator.frequency.value = frequency
    filter.type = 'lowpass'
    filter.frequency.value = 2200

    const peakVolume = Math.max(0.0001, volume * 0.25)

    gain.gain.setValueAtTime(0.0001, now + start)
    gain.gain.exponentialRampToValueAtTime(peakVolume, now + start + 0.02)
    gain.gain.exponentialRampToValueAtTime(0.0001, now + start + duration)

    oscillator.connect(filter)
    filter.connect(gain)
    gain.connect(context.destination)
    oscillator.start(now + start)
    oscillator.stop(now + start + duration + 0.05)
  })
}

export function usePomodoro() {
  const [initialData] = useState(() => loadPersistedData())
  const [settings, setSettings] = useState<Settings>(initialData.settings)
  const [timer, setTimer] = useState<TimerState>(initialData.timer)
  const audioContextRef = useRef<AudioContext | null>(null)

  const ensureAudioContext = useCallback(() => {
    if (typeof window === 'undefined') return null

    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext

    if (!AudioContextClass) return null

    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContextClass()
    }

    return audioContextRef.current
  }, [])

  const playCompletionSound = useCallback(() => {
    if (!settings.soundEnabled || typeof window === 'undefined') return

    try {
      const context = ensureAudioContext()
      if (!context) return

      if (context.state === 'suspended') {
        void context.resume().then(() => playBellTone(context, settings.volume))
        return
      }

      playBellTone(context, settings.volume)
    } catch {
      // Ignore audio errors.
    }
  }, [ensureAudioContext, settings.soundEnabled, settings.volume])

  const resetTimer = useCallback(
    (mode: Mode = timer.mode) => {
      const remainingSeconds = durationForMode(mode, settings)
      setTimer((prev) => ({
        ...prev,
        mode,
        isRunning: false,
        remainingSeconds,
        totalDuration: remainingSeconds,
        endAt: null,
      }))
    },
    [settings, timer.mode],
  )

  const startTimer = useCallback(() => {
    const context = ensureAudioContext()
    if (context?.state === 'suspended') {
      void context.resume()
    }

    setTimer((prev) => {
      const remainingSeconds =
        prev.remainingSeconds > 0 ? prev.remainingSeconds : durationForMode(prev.mode, settings)
      const totalDuration =
        prev.totalDuration > 0 ? prev.totalDuration : durationForMode(prev.mode, settings)

      return {
        ...prev,
        isRunning: true,
        remainingSeconds,
        totalDuration,
        endAt: Date.now() + remainingSeconds * 1000,
      }
    })
  }, [ensureAudioContext, settings])

  const pauseTimer = useCallback(() => {
    setTimer((prev) => {
      if (!prev.isRunning || prev.endAt == null) {
        return prev
      }

      const remainingSeconds = Math.max(0, Math.ceil((prev.endAt - Date.now()) / 1000))
      return {
        ...prev,
        isRunning: false,
        remainingSeconds,
        endAt: null,
      }
    })
  }, [])

  const advanceSession = useCallback(
    (source: 'completed' | 'skipped') => {
      setTimer((prev) => {
        if (prev.mode === 'focus' && source === 'completed') {
          const completedPomodoros = prev.completedPomodoros + 1
          const nextMode =
            completedPomodoros % settings.longBreakInterval === 0 ? 'longBreak' : 'shortBreak'
          const remainingSeconds = durationForMode(nextMode, settings)
          return {
            ...prev,
            mode: nextMode,
            completedPomodoros,
            isRunning: settings.autoStartBreaks,
            remainingSeconds,
            totalDuration: remainingSeconds,
            endAt: settings.autoStartBreaks ? Date.now() + remainingSeconds * 1000 : null,
          }
        }

        if (prev.mode === 'focus' && source === 'skipped') {
          const nextMode: Mode = 'shortBreak'
          const remainingSeconds = durationForMode(nextMode, settings)
          return {
            ...prev,
            mode: nextMode,
            isRunning: settings.autoStartBreaks,
            remainingSeconds,
            totalDuration: remainingSeconds,
            endAt: settings.autoStartBreaks ? Date.now() + remainingSeconds * 1000 : null,
          }
        }

        const nextMode: Mode = 'focus'
        const remainingSeconds = durationForMode(nextMode, settings)
        return {
          ...prev,
          mode: nextMode,
          isRunning: settings.autoStartPomodoros,
          remainingSeconds,
          totalDuration: remainingSeconds,
          endAt: settings.autoStartPomodoros ? Date.now() + remainingSeconds * 1000 : null,
        }
      })

      if (source === 'completed') {
        playCompletionSound()
      }
    },
    [playCompletionSound, settings],
  )

  const skipSession = useCallback(() => {
    advanceSession('skipped')
  }, [advanceSession])

  const completeSession = useCallback(() => {
    advanceSession('completed')
  }, [advanceSession])

  useEffect(() => {
    if (!timer.isRunning || timer.endAt == null) {
      return
    }

    const endAt = timer.endAt
    let hasCompleted = false

    const tick = () => {
      const remainingMs = endAt - Date.now()
      if (remainingMs <= 0) {
        if (hasCompleted) return
        hasCompleted = true
        completeSession()
        return
      }

      const nextRemaining = Math.max(1, Math.ceil(remainingMs / 1000))
      setTimer((prev) =>
        prev.isRunning && prev.endAt === endAt && prev.remainingSeconds !== nextRemaining
          ? {
              ...prev,
              remainingSeconds: nextRemaining,
            }
          : prev,
      )
    }

    tick()
    const intervalId = window.setInterval(tick, 250)
    return () => window.clearInterval(intervalId)
  }, [completeSession, timer.endAt, timer.isRunning])

  useEffect(() => {
    if (typeof window === 'undefined') return

    try {
      window.localStorage.setItem(
        STORAGE_KEY,
        JSON.stringify({
          settings,
          timer,
        }),
      )
    } catch {
      // Ignore persistence failures.
    }
  }, [settings, timer])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.title = formatTitle(timer.remainingSeconds, timer.mode)
  }, [timer.mode, timer.remainingSeconds])

  const setMode = useCallback(
    (mode: Mode) => {
      const remainingSeconds = durationForMode(mode, settings)
      setTimer((prev) => ({
        ...prev,
        mode,
        isRunning: false,
        remainingSeconds,
        totalDuration: remainingSeconds,
        endAt: null,
      }))
    },
    [settings],
  )

  const updateSettings = useCallback(
    (nextSettings: Settings) => {
      setSettings(nextSettings)
      setTimer((prevTimer) => {
        const currentDuration = durationForMode(prevTimer.mode, settings)
        const nextDuration = durationForMode(prevTimer.mode, nextSettings)

        if (prevTimer.isRunning || prevTimer.remainingSeconds !== currentDuration) {
          return prevTimer
        }

        return {
          ...prevTimer,
          remainingSeconds: nextDuration,
          totalDuration: nextDuration,
          endAt: null,
        }
      })
    },
    [settings],
  )

  return {
    settings,
    timer,
    labels: MODE_LABELS,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    updateSettings,
  }
}
