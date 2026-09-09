import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import { Separator } from '@modern-router-management/ui/components/separator'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import { RouterIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import {
  ponStatusOptions,
  systemStatusOptions,
  wanStatusOptions,
} from '../../lib/query-options'
import { SetupRouterDialog, useActiveRouter } from '../routers'
import { DashboardHeader, DashboardHeaderSkeleton } from './dashboard-header'
import { rxPowerToSignal } from './format'
import { SystemMetrics } from './metrics'
import { OpticalModule } from './optical-module'
import { WANConnections, WANConnectionsSkeleton } from './wan-connections'
import type { WanConnectionDTO } from '@modern-router-management/types/router'

interface DashboardSnapshot {
  wanIp: string
  online: boolean
  signal: number
  wanConnections: Array<WanConnectionDTO>
}

function DashboardPage() {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const {
    routerId,
    activeRouter,
    routers,
    isLoading: storeLoading,
  } = useActiveRouter()

  // Sequential queries: system -> WAN -> PON. Each depends on the previous one
  // completing first so the PON call does not race ahead of the system data.
  const systemStatusQuery = useQuery({
    ...systemStatusOptions(routerId ?? 0),
    enabled: routerId !== null,
  })
  const wanStatusQuery = useQuery({
    ...wanStatusOptions(routerId ?? 0),
    enabled: routerId !== null && systemStatusQuery.isSuccess,
  })
  const ponStatusQuery = useQuery({
    ...ponStatusOptions(routerId ?? 0),
    enabled:
      routerId !== null &&
      systemStatusQuery.isSuccess &&
      wanStatusQuery.isSuccess,
  })

  // Latest successful fetch across the three status queries (updates on each
  // 10s poll and manual refresh).
  const lastUpdatedAt = useMemo(() => {
    const updated = [
      systemStatusQuery.dataUpdatedAt,
      wanStatusQuery.dataUpdatedAt,
      ponStatusQuery.dataUpdatedAt,
    ].filter((timestamp) => timestamp > 0)
    return updated.length > 0 ? Math.max(...updated) : null
  }, [
    systemStatusQuery.dataUpdatedAt,
    wanStatusQuery.dataUpdatedAt,
    ponStatusQuery.dataUpdatedAt,
  ])

  const snapshot = useMemo((): DashboardSnapshot => {
    if (!systemStatusQuery.data || !wanStatusQuery.data) {
      return { wanIp: '', online: false, signal: 0, wanConnections: [] }
    }
    const internet = wanStatusQuery.data.find((w) => w.name === 'INTERNET')
    const online = Boolean(internet)
    const wanIp = internet?.ipAddress.split('/')[0] ?? ''
    return {
      wanIp,
      online,
      signal: ponStatusQuery.data
        ? rxPowerToSignal(ponStatusQuery.data.rxPower)
        : 0,
      wanConnections: wanStatusQuery.data,
    }
  }, [systemStatusQuery.data, wanStatusQuery.data, ponStatusQuery.data])

  const queryClient = useQueryClient()
  const refreshStatuses = () => {
    queryClient.refetchQueries({
      predicate: (query) =>
        routerId !== null &&
        query.queryKey[0] === 'router' &&
        query.queryKey[1] === routerId &&
        typeof query.queryKey[2] === 'string' &&
        query.queryKey[2].endsWith('-status'),
    })
  }

  const routerName = activeRouter?.name ?? 'Router dashboard'

  return (
    <div className="space-y-10">
      {routerId === null && !storeLoading ? (
        <NoRouterState
          hasRouters={routers.length > 0}
          onAddRouter={() => setSetupDialogOpen(true)}
        />
      ) : null}

      {routerId === null && storeLoading ? <DashboardLoading /> : null}

      {routerId !== null && systemStatusQuery.isPending ? (
        <DashboardLoading />
      ) : null}

      {routerId !== null && systemStatusQuery.isError ? (
        <DashboardError
          message={systemStatusQuery.error.message}
          onRetry={() => systemStatusQuery.refetch()}
        />
      ) : null}

      {routerId !== null && systemStatusQuery.isSuccess ? (
        <div className="space-y-8">
          <DashboardHeader
            routerName={routerName}
            model={`${systemStatusQuery.data.manufacturer} ${systemStatusQuery.data.model}`}
            online={wanStatusQuery.data ? snapshot.online : null}
            signal={ponStatusQuery.data ? snapshot.signal : null}
            lastUpdatedAt={lastUpdatedAt}
            onRefresh={refreshStatuses}
            onAddRouter={() => setSetupDialogOpen(true)}
          />

          <Separator />

          <SystemMetrics
            system={systemStatusQuery.data}
            wanIp={snapshot.wanIp}
            driver={activeRouter?.driver}
          />

          {wanStatusQuery.isError ? (
            <Card>
              <CardContent className="flex items-center justify-between gap-4">
                <p className="text-sm text-muted-foreground">
                  WAN connection status could not be loaded.
                </p>
                <Button
                  variant="outline"
                  onClick={() => wanStatusQuery.refetch()}
                >
                  Retry
                </Button>
              </CardContent>
            </Card>
          ) : null}

          {wanStatusQuery.isSuccess ? (
            <>
              {ponStatusQuery.isError ? (
                <PONUnavailable onRetry={() => ponStatusQuery.refetch()} />
              ) : (
                <OpticalModule
                  data={
                    ponStatusQuery.isSuccess ? ponStatusQuery.data : undefined
                  }
                  signal={ponStatusQuery.data ? snapshot.signal : null}
                />
              )}
              <WANConnections connections={snapshot.wanConnections} />
            </>
          ) : null}

          {wanStatusQuery.isPending ? <WANConnectionsSkeleton /> : null}
        </div>
      ) : null}

      <SetupRouterDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
      />
    </div>
  )
}

function DashboardLoading() {
  return (
    <div className="space-y-8">
      <DashboardHeaderSkeleton />
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        {Array.from({ length: 6 }, (_, index) => (
          <Card key={index} size="sm">
            <CardContent className="flex flex-col gap-2">
              <Skeleton className="h-3 w-16" />
              <Skeleton className="h-4 w-20" />
            </CardContent>
          </Card>
        ))}
      </div>
      <WANConnectionsSkeleton />
    </div>
  )
}

function DashboardError({
  message,
  onRetry,
}: {
  message: string
  onRetry: () => void
}) {
  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <TriangleAlertIcon className="size-4" aria-hidden="true" />
          Status unavailable
        </CardTitle>
        <CardDescription>{message}</CardDescription>
      </CardHeader>
      <CardContent>
        <Button variant="outline" onClick={onRetry}>
          Try again
        </Button>
      </CardContent>
    </Card>
  )
}

function NoRouterState({
  hasRouters,
  onAddRouter,
}: {
  hasRouters: boolean
  onAddRouter: () => void
}) {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <CardHeader>
        <RouterIcon className="mx-auto size-10 text-muted-foreground" />
        <CardTitle>No router selected</CardTitle>
        <CardDescription>
          {hasRouters
            ? 'No active router is set. Choose one in Settings to see live status.'
            : 'Add your first router to start monitoring it.'}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button onClick={onAddRouter}>
          {hasRouters ? 'Add router' : 'Add your first router'}
        </Button>
      </CardContent>
    </Card>
  )
}

function PONUnavailable({ onRetry }: { onRetry: () => void }) {
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-4">
        <p className="text-sm text-muted-foreground">
          PON optical status could not be loaded.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Retry
        </Button>
      </CardContent>
    </Card>
  )
}

export default DashboardPage
