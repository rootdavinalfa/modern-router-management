import { Button } from '@modern-router-management/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@modern-router-management/ui/components/dropdown-menu'
import { CheckIcon, MonitorIcon, MoonIcon, SunIcon } from 'lucide-react'
import { useEffect } from 'react'
import {
  applyThemeMode,
  setThemeMode,
  syncThemeMode,
  useThemeState,
} from './shell/theme'
import type { ThemeMode } from './shell/theme'

const MODE_OPTIONS: Array<{ mode: ThemeMode; label: string; icon: typeof SunIcon }> = [
  { mode: 'light', label: 'Light', icon: SunIcon },
  { mode: 'dark', label: 'Dark', icon: MoonIcon },
  { mode: 'auto', label: 'Auto (system)', icon: MonitorIcon },
]

export default function ThemeToggle() {
  const { mode, resolved } = useThemeState()

  // Hydrate: apply the stored mode (THEME_INIT_SCRIPT already ran for first
  // paint; this keeps the store in sync) and follow OS changes in auto mode.
  useEffect(() => {
    applyThemeMode(mode)
  }, [mode])

  useEffect(() => {
    const media = window.matchMedia('(prefers-color-scheme: dark)')
    media.addEventListener('change', syncThemeMode)
    return () => media.removeEventListener('change', syncThemeMode)
  }, [])

  const ResolvedIcon = resolved === 'dark' ? MoonIcon : SunIcon
  const activeLabel =
    MODE_OPTIONS.find((option) => option.mode === mode)?.label ?? 'Auto (system)'

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon"
            aria-label={`Theme: ${activeLabel}. Change theme.`}
            title={`Theme: ${activeLabel}`}
          />
        }
      >
        <ResolvedIcon className="size-5" aria-hidden="true" />
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {MODE_OPTIONS.map(({ mode: itemMode, label, icon: Icon }) => {
          const isActive = itemMode === mode
          return (
            <DropdownMenuItem key={itemMode} onClick={() => setThemeMode(itemMode)}>
              <Icon className="size-4" aria-hidden="true" />
              {label}
              {isActive ? <CheckIcon className="ml-auto size-4" /> : null}
            </DropdownMenuItem>
          )
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
