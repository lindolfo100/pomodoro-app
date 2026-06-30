import type { Mode } from '../types'

interface ModeTabsProps {
  mode: Mode
  completedPomodoros: number
  onSelectMode: (mode: Mode) => void
  labels: Record<Mode, string>
  durations: Record<Exclude<Mode, 'focus'>, number>
}

const modes: Mode[] = ['focus', 'shortBreak', 'longBreak']

export function ModeTabs({ mode, completedPomodoros, onSelectMode, labels, durations }: ModeTabsProps) {
  return (
    <div
      className="inline-flex w-full rounded-full border border-white/10 bg-white/5 p-1 shadow-inner shadow-black/20"
      role="tablist"
      aria-label="Modos do Pomodoro"
    >
      {modes.map((item) => {
        const active = item === mode
        return (
          <button
            key={item}
            type="button"
            role="tab"
            aria-selected={active}
            className={[
              'flex-1 rounded-full px-4 py-3 text-sm font-medium transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-white/70',
              active ? 'bg-white text-slate-950 shadow-lg shadow-black/20' : 'text-white/80 hover:bg-white/10',
            ].join(' ')}
            onClick={() => onSelectMode(item)}
          >
            <span className="block">{labels[item]}</span>
            <span className="block text-[11px] font-normal opacity-70">
              {item === 'focus'
                ? `${completedPomodoros} concluídos`
                : `${durations[item as Exclude<Mode, 'focus'>]} min ajustados`}
            </span>
          </button>
        )
      })}
    </div>
  )
}
