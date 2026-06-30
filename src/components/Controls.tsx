interface ControlsProps {
  isRunning: boolean
  onToggleRunning: () => void
  onReset: () => void
  onSkip: () => void
}

export function Controls({ isRunning, onToggleRunning, onReset, onSkip }: ControlsProps) {
  const primaryLabel = isRunning ? 'Pausar' : 'Iniciar'

  return (
    <div className="flex flex-wrap items-center justify-center gap-3">
      <button
        type="button"
        onClick={onToggleRunning}
        className="inline-flex items-center justify-center rounded-full bg-white px-6 py-3 text-sm font-semibold text-slate-950 shadow-lg shadow-black/20 transition hover:scale-[1.02] hover:bg-slate-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label={primaryLabel}
      >
        {primaryLabel}
      </button>

      <button
        type="button"
        onClick={onReset}
        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="Redefinir o timer"
      >
        Resetar
      </button>

      <button
        type="button"
        onClick={onSkip}
        className="inline-flex items-center justify-center rounded-full border border-white/15 bg-white/5 px-5 py-3 text-sm font-medium text-white transition hover:bg-white/10 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/80"
        aria-label="Pular sessão atual"
      >
        Pular
      </button>
    </div>
  )
}
