import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { RouterCreateDTO } from '@modern-router-management/types/router'
import {
  createRouter,
  fetchActiveRouter,
  fetchRouterStatus,
  fetchRouters,
  fetchSystemStatus,
  fetchWANStatus,
  fetchPONStatus,
  type WanConnection,
} from '../lib/api'
import {
  DashboardHeader,
  StatusCard,
  PONOpticalModule,
  WANConnections,
  RouterSetupForm,
  RouterSelector,
  SubmitInternetButton,
} from '../components/dashboard'

export const Route = createFileRoute('/')({ component: App })

interface StatusSnapshot {
  model: string
  firmware: string
  uptime: string
  wanIp: string
  signal: number
  status: string
  rxPower: number
  txPower: number
  temperature: number
  voltage: number
  current: number
  onuState: string
  wanConnections: WanConnection[]
  cpuUsage: number
  memoryUsage: number
  powerOnTime: number
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return `${days}d ${hours}h ${minutes}m`
}

function App() {
  const queryClient = useQueryClient()
  const [setupStatus, setSetupStatus] = useState<string | null>(null)
  const [selectedRouterId, setSelectedRouterId] = useState<number | null>(null)

  const routersQuery = useQuery({
    queryKey: ['routers'],
    queryFn: fetchRouters,
  })

  const activeRouterQuery = useQuery({
    queryKey: ['router', 'active'],
    queryFn: fetchActiveRouter,
  })

  const routerId = selectedRouterId ?? activeRouterQuery.data?.id ?? null

  // Sequential queries: system -> WAN -> PON
  // Each query depends on the previous one completing first
  const systemStatusQuery = useQuery({
    queryKey: ['router', routerId, 'system-status'],
    queryFn: () => fetchSystemStatus(routerId as number),
    enabled: routerId !== null,
    refetchInterval: 10000,
  })

  const wanStatusQuery = useQuery({
    queryKey: ['router', routerId, 'wan-status'],
    queryFn: () => fetchWANStatus(routerId as number),
    enabled: routerId !== null && systemStatusQuery.isSuccess,
    refetchInterval: 10000,
  })

  const ponStatusQuery = useQuery({
    queryKey: ['router', routerId, 'pon-status'],
    queryFn: () => fetchPONStatus(routerId as number),
    enabled: routerId !== null && systemStatusQuery.isSuccess && wanStatusQuery.isSuccess,
    refetchInterval: 10000,
  })

  const setupMutation = useMutation({
    mutationFn: createRouter,
    onSuccess: () => {
      setSetupStatus('Router saved securely.')
      queryClient.invalidateQueries({ queryKey: ['router'] })
    },
    onError: (error: Error) => {
      setSetupStatus(
        error instanceof Error ? error.message : 'Unable to save router.',
      )
    },
  })

  const handleSelectRouter = (routerId: number) => {
    setSelectedRouterId(routerId)
  }

  const statusSnapshot = useMemo((): StatusSnapshot => {
    if (!systemStatusQuery.data || !ponStatusQuery.data || !wanStatusQuery.data) {
      return {
        model: 'ZTE F6600P',
        firmware: 'unknown',
        uptime: '0d 0h 0m',
        wanIp: '0.0.0.0',
        signal: 0,
        status: 'Offline',
        rxPower: 0,
        txPower: 0,
        temperature: 0,
        voltage: 0,
        current: 0,
        onuState: 'Unknown',
        wanConnections: [],
        cpuUsage: 0,
        memoryUsage: 0,
        powerOnTime: 0,
      }
    }

    // Find INTERNET connection for primary status
    const internetConnection = wanStatusQuery.data.find((w) => w.name === 'INTERNET')
    const wanIp = internetConnection?.ipAddress.split('/')[0] || '0.0.0.0'
    const uptimeSeconds = internetConnection?.uptimeSeconds || 0
    const online = !!internetConnection

    // Calculate signal strength from optical RX power (typical range: -8 to -28 dBm)
    // Map to 0-100 scale: -8 dBm = 100%, -28 dBm = 0%
    const signalStrength = ponStatusQuery.data.rxPower
      ? Math.max(
          0,
          Math.min(100, Math.round(((ponStatusQuery.data.rxPower + 28) / 20) * 100)),
        )
      : 0

    return {
      model: systemStatusQuery.data.model,
      firmware: systemStatusQuery.data.softwareVersion,
      uptime: formatUptime(systemStatusQuery.data.powerOnTime),
      wanIp,
      signal: signalStrength,
      status: online ? 'Online' : 'Offline',
      rxPower: ponStatusQuery.data.rxPower,
      txPower: ponStatusQuery.data.txPower,
      temperature: ponStatusQuery.data.temperature,
      voltage: ponStatusQuery.data.voltage,
      current: ponStatusQuery.data.current,
      onuState: ponStatusQuery.data.onuState,
      wanConnections: wanStatusQuery.data,
      cpuUsage: systemStatusQuery.data.cpuUsage,
      memoryUsage: systemStatusQuery.data.memoryUsage,
      powerOnTime: systemStatusQuery.data.powerOnTime,
    }
  }, [systemStatusQuery.data, ponStatusQuery.data, wanStatusQuery.data])

  const handleSetup = (values: RouterCreateDTO) => {
    setSetupStatus(null)
    setupMutation.mutate(values)
  }

  return (
    <main className="page-wrap space-y-8 px-4 pb-10 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-4-xl px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />

        <RouterSelector
          routers={routersQuery.data ?? []}
          selectedRouterId={routerId}
          onSelectRouter={handleSelectRouter}
        />

        <DashboardHeader
          model={statusSnapshot.model}
          status={statusSnapshot.status}
          signalStrength={statusSnapshot.signal}
        />

        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatusCard
            label="Firmware"
            value={statusSnapshot.firmware}
            animationDelay={120}
          />
          <StatusCard
            label="WAN IP"
            value={statusSnapshot.wanIp}
            animationDelay={210}
          />
          <StatusCard
            label="Uptime"
            value={statusSnapshot.uptime}
            animationDelay={300}
          />
          <StatusCard label="Driver" value="zte-f6600p" animationDelay={390} />
        </div>

        <PONOpticalModule
          ponData={{
            rxPower: statusSnapshot.rxPower,
            txPower: statusSnapshot.txPower,
            temperature: statusSnapshot.temperature,
            voltage: statusSnapshot.voltage,
            current: statusSnapshot.current,
            onuState: statusSnapshot.onuState,
          }}
          signalStrength={statusSnapshot.signal}
        />

        <WANConnections connections={statusSnapshot.wanConnections} />

        {routerId && (
          <div className="mt-6 flex justify-end">
            <SubmitInternetButton routerId={routerId} />
          </div>
        )}
      </section>

      <section>
        <RouterSetupForm
          onSubmit={handleSetup}
          isPending={setupMutation.isPending}
          status={setupStatus}
        />
      </section>
    </main>
  )
}
