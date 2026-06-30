import type { Mode } from '../types'

interface TimerDisplayProps {
  mode: Mode
  remainingSeconds: number
  progress: number
  accent: string
  labels: Record<Mode, string>
}

function formatTime(totalSeconds: number) {
  const safeSeconds = Math.max(0, Math.floor(totalSeconds))
  const minutes = Math.floor(safeSeconds / 60)
  const seconds = safeSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

export function TimerDisplay({ mode, remainingSeconds, progress, accent, labels }: TimerDisplayProps) {
  const size = 248
  const strokeWidth = 12
  const radius = (size - strokeWidth) / 2
  const circumference = 2 * Math.PI * radius
  const dashOffset = circumference * (1 - progress)

  return (
    <div className="relative mx-auto flex w-full max-w-sm items-center justify-center py-2">
      <svg
        viewBox={`0 0 ${size} ${size}`}
        className="absolute inset-0 h-full w-full drop-shadow-[0_10px_30px_rgba(0,0,0,0.35)]"
        aria-hidden="true"
      >
        <defs>
          <linearGradient id="ringGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor={accent} />
            <stop offset="100%" stopColor="#ffffff" stopOpacity="0.4" />
          </linearGradient>
        </defs>
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={strokeWidth}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="url(#ringGradient)"
          strokeWidth={strokeWidth}
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={dashOffset}
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          className="transition-[stroke-dashoffset] duration-300 ease-linear"
        />
      </svg>

      <div className="relative z-10 flex h-[248px] w-[248px] flex-col items-center justify-center rounded-full bg-slate-950/25 backdrop-blur-sm">
        <div className="text-xs font-semibold uppercase tracking-[0.32em] text-white/60">
          {labels[mode]}
        </div>
        <div className="mt-3 tabular-nums text-6xl font-semibold tracking-tight text-white sm:text-7xl">
          {formatTime(remainingSeconds)}
        </div>
        <div className="mt-3 text-sm text-white/60">O anel mostra o progresso da sessão</div>
      </div>
    </div>
  )
}
