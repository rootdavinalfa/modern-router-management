import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import type { RouterCreateDTO } from '@modern-router-management/types/router'
import {
  createRouter,
  fetchActiveRouter,
  fetchRouterStatus,
  fetchRouters,
  type RouterStatusExtended,
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
}

const formatUptime = (uptimeSeconds: number): string => {
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)

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

  const statusQuery = useQuery({
    queryKey: ['router', routerId, 'status'],
    queryFn: () => fetchRouterStatus(routerId as number),
    enabled: routerId !== null,
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
    if (!statusQuery.data) {
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
      }
    }

    const extendedData = statusQuery.data as RouterStatusExtended
    const ponData = extendedData.ponData

    return {
      model: statusQuery.data.model,
      firmware: statusQuery.data.firmware,
      uptime: formatUptime(statusQuery.data.uptimeSeconds),
      wanIp: statusQuery.data.wanIp,
      signal: statusQuery.data.signalStrength ?? 0,
      status: statusQuery.data.online ? 'Online' : 'Offline',
      rxPower: (ponData?.rxPower as number) ?? 0,
      txPower: (ponData?.txPower as number) ?? 0,
      temperature: (ponData?.temperature as number) ?? 0,
      voltage: (ponData?.voltage as number) ?? 0,
      current: (ponData?.current as number) ?? 0,
      onuState: (ponData?.onuState as string) ?? 'Unknown',
      wanConnections: extendedData.wanConnections || [],
    }
  }, [statusQuery.data])

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
