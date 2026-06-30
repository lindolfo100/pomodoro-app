import { useEffect, useMemo, useState } from 'react'
import { Controls } from './components/Controls'
import { ModeTabs } from './components/ModeTabs'
import { SettingsModal } from './components/SettingsModal'
import { TimerDisplay } from './components/TimerDisplay'
import { usePomodoro } from './hooks/usePomodoro'
import type { Mode, Settings } from './types'

const THEME_BY_MODE: Record<
  Mode,
  {
    accent: string
    panelGlow: string
    pageGlow: string
  }
> = {
  focus: {
    accent: '#fb7185',
    panelGlow: 'rgba(251, 113, 133, 0.28)',
    pageGlow: 'radial-gradient(circle at top, rgba(251,113,133,0.28), transparent 50%)',
  },
  shortBreak: {
    accent: '#2dd4bf',
    panelGlow: 'rgba(45, 212, 191, 0.25)',
    pageGlow: 'radial-gradient(circle at top, rgba(45,212,191,0.26), transparent 50%)',
  },
  longBreak: {
    accent: '#34d399',
    panelGlow: 'rgba(52, 211, 153, 0.22)',
    pageGlow: 'radial-gradient(circle at top, rgba(52,211,153,0.24), transparent 50%)',
  },
}

function isEditableTarget(target: EventTarget | null) {
  if (!(target instanceof HTMLElement)) return false
  const tagName = target.tagName.toLowerCase()
  return target.isContentEditable || tagName === 'input' || tagName === 'textarea' || tagName === 'select'
}

function getThemeClasses(mode: Mode) {
  switch (mode) {
    case 'focus':
      return 'from-rose-950 via-slate-950 to-slate-900'
    case 'shortBreak':
      return 'from-teal-950 via-slate-950 to-slate-900'
    case 'longBreak':
      return 'from-emerald-950 via-slate-950 to-slate-900'
  }
}

function App() {
  const {
    settings,
    timer,
    labels,
    setMode,
    startTimer,
    pauseTimer,
    resetTimer,
    skipSession,
    updateSettings,
  } = usePomodoro()
  const [settingsOpen, setSettingsOpen] = useState(false)

  const theme = THEME_BY_MODE[timer.mode]
  const progress = useMemo(() => {
    const duration = timer.totalDuration

    return duration > 0 ? Math.max(0, Math.min(1, 1 - timer.remainingSeconds / duration)) : 0
  }, [timer.remainingSeconds, timer.totalDuration])

  const nextCycleLabel = useMemo(() => {
    if (timer.mode === 'focus') {
      const upcomingFocusCount = timer.completedPomodoros + 1
      return upcomingFocusCount % settings.longBreakInterval === 0 ? 'Pausa longa' : 'Pausa curta'
    }

    return 'Foco'
  }, [settings.longBreakInterval, timer.completedPomodoros, timer.mode])

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (settingsOpen) return
      if (event.altKey || event.ctrlKey || event.metaKey) return
      if (isEditableTarget(event.target)) return

      if (event.code === 'Space') {
        event.preventDefault()
        if (timer.isRunning) {
          pauseTimer()
        } else {
          startTimer()
        }
      }

      if (event.key.toLowerCase() === 'r') {
        event.preventDefault()
        resetTimer()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [pauseTimer, resetTimer, settingsOpen, startTimer, timer.isRunning])

  const handleToggleRunning = () => {
    if (timer.isRunning) {
      pauseTimer()
      return
    }

    startTimer()
  }

  const handleSettingsChange = (nextSettings: Settings) => {
    updateSettings({
      ...nextSettings,
      focusDuration: Math.max(1, Math.round(nextSettings.focusDuration)),
      shortBreakDuration: Math.max(1, Math.round(nextSettings.shortBreakDuration)),
      longBreakDuration: Math.max(1, Math.round(nextSettings.longBreakDuration)),
      longBreakInterval: Math.max(1, Math.round(nextSettings.longBreakInterval)),
      volume: Math.min(1, Math.max(0, Number(nextSettings.volume))),
    })
  }

  return (
    <div className={`min-h-screen bg-gradient-to-br ${getThemeClasses(timer.mode)} text-white`}>
      <div className="relative isolate min-h-screen overflow-hidden" style={{ backgroundImage: theme.pageGlow }}>
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.05),transparent_45%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent_18%,transparent_80%,rgba(2,6,23,0.25))]" />

        <main className="relative mx-auto flex min-h-screen w-full max-w-5xl items-center justify-center px-4 py-10 sm:px-6 lg:px-8">
          <section className="w-full max-w-3xl">
            <div
              className="rounded-[2rem] border border-white/10 bg-white/[0.08] p-5 shadow-2xl shadow-black/40 backdrop-blur-2xl transition-colors duration-700 sm:p-8"
              style={{ boxShadow: `0 30px 120px ${theme.panelGlow}` }}
            >
              <div className="flex flex-col gap-6">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row sm:items-start">
                  <div className="text-center sm:text-left">
                    <p className="text-xs font-semibold uppercase tracking-[0.34em] text-white/55">
                      Pomodoro
                    </p>
                    <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">Foque no que importa.</h1>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-white/70">
                      Um timer moderno, rápido e silenciosamente produtivo — com ciclos automáticos,
                      sons suaves e configurações persistentes.
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={() => setSettingsOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70"
                    aria-label="Abrir configurações"
                  >
                    <span aria-hidden="true">⚙</span>
                    Configurações
                  </button>
                </div>

                <ModeTabs
                  mode={timer.mode}
                  completedPomodoros={timer.completedPomodoros}
                  onSelectMode={setMode}
                  labels={labels}
                  durations={{ shortBreak: settings.shortBreakDuration, longBreak: settings.longBreakDuration }}
                />

                <TimerDisplay
                  mode={timer.mode}
                  remainingSeconds={timer.remainingSeconds}
                  progress={progress}
                  accent={theme.accent}
                  labels={labels}
                />

                <Controls
                  isRunning={timer.isRunning}
                  onToggleRunning={handleToggleRunning}
                  onReset={() => resetTimer()}
                  onSkip={skipSession}
                />

                <div className="grid gap-3 rounded-3xl border border-white/10 bg-slate-950/20 p-4 text-sm text-white/75 sm:grid-cols-3">
                  <div className="rounded-2xl bg-white/5 p-4">
                    <span className="block text-xs uppercase tracking-[0.26em] text-white/45">
                      Status
                    </span>
                    <span className="mt-2 block text-base font-medium text-white">
                      {timer.isRunning ? 'Rodando' : 'Pausado'}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <span className="block text-xs uppercase tracking-[0.26em] text-white/45">
                      Pomodoros concluídos
                    </span>
                    <span className="mt-2 block text-base font-medium text-white">
                      {timer.completedPomodoros}
                    </span>
                  </div>
                  <div className="rounded-2xl bg-white/5 p-4">
                    <span className="block text-xs uppercase tracking-[0.26em] text-white/45">
                      Próximo ciclo
                    </span>
                    <span className="mt-2 block text-base font-medium text-white">{nextCycleLabel}</span>
                  </div>
                </div>
              </div>
            </div>

            <p className="mt-5 text-center text-xs text-white/45">
              Atalhos: Espaço para iniciar/pausar, R para resetar.
            </p>
          </section>
        </main>

        <SettingsModal
          open={settingsOpen}
          settings={settings}
          onChange={handleSettingsChange}
          onClose={() => setSettingsOpen(false)}
        />
      </div>
    </div>
  )
}

export default App
