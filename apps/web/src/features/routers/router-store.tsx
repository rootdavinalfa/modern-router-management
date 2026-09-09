import { useQuery } from '@tanstack/react-query'
import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { activeRouterOptions, routersOptions } from '../../lib/query-options'
import type { RouterSummaryDTO } from '@modern-router-management/types/router'
import type { ReactNode } from 'react'

const ACTIVE_ROUTER_STORAGE_KEY = 'router-core:activeRouterId'

interface RouterStoreValue {
  /** Currently selected router id (falls back to the active router). */
  routerId: number | null
  setRouterId: (routerId: number) => void
  routers: Array<RouterSummaryDTO>
  activeRouter: RouterSummaryDTO | null
  isLoading: boolean
}

const RouterStoreContext = createContext<RouterStoreValue | null>(null)

export function RouterProvider({ children }: { children: ReactNode }) {
  const [storedRouterId, setStoredRouterId] = useState<number | null>(null)

  // Read the persisted selection only after mount so the server render and
  // first client render agree (SSR-safe); selection applies on the next paint.
  useEffect(() => {
    const stored = window.localStorage.getItem(ACTIVE_ROUTER_STORAGE_KEY)
    const parsed = stored === null ? null : Number(stored)
    setStoredRouterId(parsed === null || Number.isNaN(parsed) ? null : parsed)
  }, [])

  const routersQuery = useQuery(routersOptions)
  const activeRouterQuery = useQuery(activeRouterOptions)

  const routers = routersQuery.data ?? []
  const activeRouter = activeRouterQuery.data ?? null

  const routerId = storedRouterId ?? activeRouter?.id ?? null

  const setRouterId = (id: number) => {
    window.localStorage.setItem(ACTIVE_ROUTER_STORAGE_KEY, String(id))
    setStoredRouterId(id)
  }

  const value = useMemo<RouterStoreValue>(
    () => ({
      routerId,
      setRouterId,
      routers,
      activeRouter,
      isLoading: routersQuery.isLoading || activeRouterQuery.isLoading,
    }),
    [
      routerId,
      routers,
      activeRouter,
      routersQuery.isLoading,
      activeRouterQuery.isLoading,
    ],
  )

  return (
    <RouterStoreContext.Provider value={value}>
      {children}
    </RouterStoreContext.Provider>
  )
}

export function useActiveRouter(): RouterStoreValue {
  const context = useContext(RouterStoreContext)
  if (!context) {
    throw new Error('useActiveRouter must be used within a RouterProvider')
  }
  return context
}
