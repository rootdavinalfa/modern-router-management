import {
  routerCreateSchema,
  type DeviceDTO,
  type RouterCreateDTO,
  type RouterStatusDTO,
  type RouterSummaryDTO,
  type WifiConfigDTO,
} from '@modern-router-management/types/router'

const API_BASE_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:3001'

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

export const fetchRouters = () => request<RouterSummaryDTO[]>('/routers')

export const fetchActiveRouter = () =>
  request<RouterSummaryDTO | null>('/routers/active')

export type RouterStatusExtended = RouterStatusDTO & {
  ponData?: Record<string, unknown>
  wanConnections?: WanConnection[]
}

export type WanConnection = {
  name: string
  type: string
  ipVersion: string
  nat: string
  ipAddress: string
  dns: string
  gateway: string
  connectionStatus: string
  uptime: string
  uptimeSeconds: number
  disconnectReason: string
  macAddress: string
  vlanId: string
  lla?: string
  gua?: string
  dnsV6?: string
  connectionStatusV6?: string
  uptimeV6?: string
  gatewayV6?: string
}

export const fetchRouterStatus = (routerId: number) =>
  request<RouterStatusExtended>(`/routers/${routerId}/status`)

export const fetchRouterDevices = (routerId: number) =>
  request<DeviceDTO[]>(`/routers/${routerId}/devices`)

export const updateWifi = (routerId: number, config: WifiConfigDTO) =>
  request<{ ok: boolean }>(`/routers/${routerId}/wifi`, {
    method: 'POST',
    body: JSON.stringify(config),
  })

export const rebootRouter = (routerId: number) =>
  request<{ ok: boolean }>(`/routers/${routerId}/reboot`, {
    method: 'POST',
  })
