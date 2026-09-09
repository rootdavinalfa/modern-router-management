import { routerCreateSchema } from '@modern-router-management/types/router'
import type {
  DeviceDTO,
  PONStatusDTO,
  RouterCreateDTO,
  RouterStatusDTO,
  RouterSummaryDTO,
  SystemStatusDTO,
  WanConnectionDTO,
  WifiConfigDTO,
} from '@modern-router-management/types/router'

// Use relative URL in production (nginx proxy), absolute in development
const API_BASE_URL = import.meta.env.VITE_API_URL ?? ''

const request = async <T>(path: string, init?: RequestInit): Promise<T> => {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      'Content-Type': 'application/json',
      ...(init?.headers ?? {}),
    },
    ...init,
  })

  if (!response.ok) {
    const message = await response.text()
    throw new Error(message || 'Request failed')
  }

  return response.json() as Promise<T>
}

export const createRouter = async (
  payload: RouterCreateDTO,
): Promise<RouterSummaryDTO> => {
  const parsed = routerCreateSchema.parse(payload)
  return request<RouterSummaryDTO>('/routers', {
    method: 'POST',
    body: JSON.stringify(parsed),
  })
}

export const fetchRouters = () => request<Array<RouterSummaryDTO>>('/routers')

export const fetchActiveRouter = () =>
  request<RouterSummaryDTO | null>('/routers/active')

export type WanConnection = WanConnectionDTO

export const fetchRouterStatus = (routerId: number) =>
  request<RouterStatusDTO>(`/routers/${routerId}/status`)

export const fetchSystemStatus = (routerId: number) =>
  request<SystemStatusDTO>(`/routers/${routerId}/system-status`)

export const fetchWANStatus = (routerId: number) =>
  request<Array<WanConnectionDTO>>(`/routers/${routerId}/wan-status`)

export const fetchPONStatus = (routerId: number) =>
  request<PONStatusDTO>(`/routers/${routerId}/pon-status`)

export const fetchRouterDevices = (routerId: number) =>
  request<Array<DeviceDTO>>(`/routers/${routerId}/devices`)

export const updateWifi = (routerId: number, config: WifiConfigDTO) =>
  request<{ ok: boolean }>(`/routers/${routerId}/wifi`, {
    method: 'POST',
    body: JSON.stringify(config),
  })

export const rebootRouter = (routerId: number) =>
  request<{ ok: boolean }>(`/routers/${routerId}/reboot`, {
    method: 'POST',
  })

export const submitInternet = (routerId: number) =>
  request<{ ok: boolean }>(`/routers/${routerId}/internet/submit`, {
    method: 'POST',
  })
