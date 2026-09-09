import { queryOptions } from '@tanstack/react-query'
import {
  fetchActiveRouter,
  fetchPONStatus,
  fetchRouterDevices,
  fetchRouters,
  fetchSystemStatus,
  fetchWANStatus,
  fetchWifiStatus,
} from './api'

export const routersOptions = queryOptions({
  queryKey: ['routers'],
  queryFn: fetchRouters,
})

export const activeRouterOptions = queryOptions({
  queryKey: ['router', 'active'],
  queryFn: fetchActiveRouter,
})

export const systemStatusOptions = (routerId: number) =>
  queryOptions({
    queryKey: ['router', routerId, 'system-status'],
    queryFn: () => fetchSystemStatus(routerId),
    refetchInterval: 10_000,
  })

export const wanStatusOptions = (routerId: number) =>
  queryOptions({
    queryKey: ['router', routerId, 'wan-status'],
    queryFn: () => fetchWANStatus(routerId),
    refetchInterval: 10_000,
  })

export const ponStatusOptions = (routerId: number) =>
  queryOptions({
    queryKey: ['router', routerId, 'pon-status'],
    queryFn: () => fetchPONStatus(routerId),
    refetchInterval: 10_000,
  })

export const devicesOptions = (routerId: number) =>
  queryOptions({
    queryKey: ['router', routerId, 'devices'],
    queryFn: () => fetchRouterDevices(routerId),
    refetchInterval: 15_000,
  })

// Config page: no polling — the page reflects what the router reported and is
// refreshed manually (header refresh button) or after each successful save.
export const wifiStatusOptions = (routerId: number) =>
  queryOptions({
    queryKey: ['router', routerId, 'wifi-status'],
    queryFn: () => fetchWifiStatus(routerId),
  })
