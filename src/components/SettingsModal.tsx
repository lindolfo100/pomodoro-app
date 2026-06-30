import { useEffect } from 'react'
import type { Settings } from '../types'

interface SettingsModalProps {
  open: boolean
  settings: Settings
  onChange: (settings: Settings) => void
  onClose: () => void
}

const fieldStyles =
  'w-full rounded-2xl border border-white/10 bg-slate-950/40 px-4 py-3 text-sm text-white outline-none transition placeholder:text-white/30 focus:border-white/30 focus:ring-2 focus:ring-white/10'

function ToggleRow({
  label,
  description,
  checked,
  onChange,
}: {
  label: string
  description: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex cursor-pointer items-start justify-between gap-4 rounded-3xl border border-white/10 bg-white/5 p-4 transition hover:bg-white/[0.08]">
      <span>
        <span className="block text-sm font-medium text-white">{label}</span>
        <span className="mt-1 block text-sm text-white/60">{description}</span>
      </span>
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="mt-1 h-5 w-5 rounded border-white/20 bg-transparent text-emerald-400 focus:ring-emerald-400"
      />
    </label>
  )
}

export function SettingsModal({ open, settings, onChange, onClose }: SettingsModalProps) {
  useEffect(() => {
    if (!open) return

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, onClose])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/70 px-4 py-6 backdrop-blur-md sm:items-center"
      onClick={onClose}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="settings-title"
        className="w-full max-w-2xl overflow-hidden rounded-[2rem] border border-white/10 bg-slate-950/90 shadow-2xl shadow-black/50"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-6 py-5">
          <div>
            <h2 id="settings-title" className="text-lg font-semibold text-white">
              Configurações
            </h2>
            <p className="mt-1 text-sm text-white/60">
              Ajuste duração, comportamento automático e áudio.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white transition hover:bg-white/10"
          >
            Fechar
          </button>
        </div>

        <div className="max-h-[75vh] overflow-y-auto px-6 py-6">
          <div className="grid gap-5 sm:grid-cols-2">
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">Foco (min)</span>
              <input
                type="number"
                min={1}
                max={180}
                step={1}
                value={settings.focusDuration}
                onChange={(event) =>
                  onChange({ ...settings, focusDuration: Number(event.target.value) || 1 })
                }
                className={fieldStyles}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">Pausa curta (min)</span>
              <input
                type="number"
                min={1}
                max={180}
                step={1}
                value={settings.shortBreakDuration}
                onChange={(event) =>
                  onChange({ ...settings, shortBreakDuration: Number(event.target.value) || 1 })
                }
                className={fieldStyles}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">Pausa longa (min)</span>
              <input
                type="number"
                min={1}
                max={180}
                step={1}
                value={settings.longBreakDuration}
                onChange={(event) =>
                  onChange({ ...settings, longBreakDuration: Number(event.target.value) || 1 })
                }
                className={fieldStyles}
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-medium text-white">
                Intervalo de pausa longa
              </span>
              <input
                type="number"
                min={1}
                max={12}
                step={1}
                value={settings.longBreakInterval}
                onChange={(event) =>
                  onChange({ ...settings, longBreakInterval: Number(event.target.value) || 1 })
                }
                className={fieldStyles}
              />
            </label>
          </div>

          <div className="mt-6 grid gap-4">
            <ToggleRow
              label="Iniciar pausas automaticamente"
              description="Ao terminar um foco, a próxima pausa começa sozinha."
              checked={settings.autoStartBreaks}
              onChange={(checked) => onChange({ ...settings, autoStartBreaks: checked })}
            />
            <ToggleRow
              label="Iniciar focos automaticamente"
              description="Ao terminar uma pausa, o próximo foco começa automaticamente."
              checked={settings.autoStartPomodoros}
              onChange={(checked) => onChange({ ...settings, autoStartPomodoros: checked })}
            />
            <ToggleRow
              label="Som"
              description="Toca um sino suave ao final de cada sessão."
              checked={settings.soundEnabled}
              onChange={(checked) => onChange({ ...settings, soundEnabled: checked })}
            />
          </div>

          <div className="mt-6 rounded-3xl border border-white/10 bg-white/5 p-4">
            <div className="flex items-center justify-between gap-4">
              <div>
                <p className="text-sm font-medium text-white">Volume</p>
                <p className="mt-1 text-sm text-white/60">
                  {Math.round(settings.volume * 100)}% de intensidade
                </p>
              </div>
              <span className="rounded-full border border-white/10 bg-slate-950/40 px-3 py-1 text-xs uppercase tracking-[0.22em] text-white/60">
                {settings.focusDuration} min foco
              </span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.05}
              value={settings.volume}
              onChange={(event) =>
                onChange({ ...settings, volume: Number(event.target.value) })
              }
              className="mt-4 h-2 w-full cursor-pointer appearance-none rounded-full bg-white/10 accent-emerald-400"
            />
          </div>
        </div>
      </div>
    </div>
  )
}
