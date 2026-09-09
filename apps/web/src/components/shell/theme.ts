import { useSyncExternalStore } from 'react'

export type ThemeMode = 'light' | 'dark' | 'auto'
export type ResolvedTheme = 'light' | 'dark'

export const THEME_STORAGE_KEY = 'theme'

export interface ThemeState {
  mode: ThemeMode
  resolved: ResolvedTheme
}

// --- reactive store ----------------------------------------------------
// Single client-side source of truth for the theme, shared by ThemeToggle
// and the toaster (which both must react to mode changes). The server render
// and first client render agree on the defaults below; real values are
// applied/hydrated in effects once mounted.

const listeners = new Set<() => void>()
let state: ThemeState = { mode: 'auto', resolved: 'light' }

// First-paint guard: the store defaults to 'light' so the server render and
// first client render agree, but the Toaster/ThemeToggle must show the REAL
// resolved theme (stored preference + OS scheme) as early as possible. The
// inline THEME_INIT_SCRIPT in __root.tsx already paints <html> correctly; this
// reconciles the store on the first client subscription, before the toaster
// draws its first toast, without touching window at module scope.
let initialized = false

function ensureResolved() {
  if (initialized || typeof window === 'undefined') {
    return
  }
  initialized = true
  publish()
}

function readStoredMode(): ThemeMode {
  if (typeof window === 'undefined') {
    return 'auto'
  }
  const stored = window.localStorage.getItem(THEME_STORAGE_KEY)
  return stored === 'light' || stored === 'dark' || stored === 'auto'
    ? stored
    : 'auto'
}

function resolveMode(mode: ThemeMode): ResolvedTheme {
  if (mode !== 'auto') {
    return mode
  }
  if (typeof window !== 'undefined') {
    return window.matchMedia('(prefers-color-scheme: dark)').matches
      ? 'dark'
      : 'light'
  }
  return 'light'
}

function publish() {
  const mode = readStoredMode()
  state = { mode, resolved: resolveMode(mode) }
  for (const listener of listeners) {
    listener()
  }
}

export function subscribeTheme(listener: () => void): () => void {
  ensureResolved()
  listeners.add(listener)
  return () => {
    listeners.delete(listener)
  }
}

export function getThemeSnapshot(): ThemeState {
  return state
}

export function useThemeState(): ThemeState {
  return useSyncExternalStore(subscribeTheme, getThemeSnapshot, () => ({
    mode: 'auto',
    resolved: 'light',
  }))
}

// --- DOM application ---------------------------------------------------

/** Apply a mode to <html>: `.light`/`.dark` class, data-theme, color-scheme. */
export function applyThemeMode(mode: ThemeMode) {
  if (typeof document === 'undefined') {
    return
  }

  const resolved = resolveMode(mode)
  const root = document.documentElement

  root.classList.remove('light', 'dark')
  root.classList.add(resolved)

  if (mode === 'auto') {
    root.removeAttribute('data-theme')
  } else {
    root.setAttribute('data-theme', mode)
  }

  root.style.colorScheme = resolved
}

/** Persist a mode, apply it to the DOM, and notify subscribers. */
export function setThemeMode(mode: ThemeMode) {
  window.localStorage.setItem(THEME_STORAGE_KEY, mode)
  applyThemeMode(mode)
  publish()
}

/** Re-apply the stored mode from storage + OS preference (auto mode). */
export function syncThemeMode() {
  applyThemeMode(readStoredMode())
  publish()
}
