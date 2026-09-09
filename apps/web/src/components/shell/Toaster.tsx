'use client'

import { Toaster as Sonner } from 'sonner'
import { useThemeState } from './theme'
import type { ToasterProps } from 'sonner'

/**
 * Theme-aware toaster mount. The shadcn registry sonner wrapper reads
 * next-themes, which this app does not use — theme lives in localStorage
 * (shell/theme.ts) applied by THEME_INIT_SCRIPT + ThemeToggle. This wrapper
 * feeds sonner the same resolved theme so toasts follow light/dark.
 */
export function Toaster(props: ToasterProps) {
  const { resolved } = useThemeState()

  return (
    <Sonner
      theme={resolved}
      className="toaster group"
      style={
        {
          '--normal-bg': 'var(--popover)',
          '--normal-text': 'var(--popover-foreground)',
          '--normal-border': 'var(--border)',
          '--border-radius': 'var(--radius)',
        } as React.CSSProperties
      }
      {...props}
    />
  )
}
