import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@modern-router-management/ui/components/tabs'
import { RefreshCwIcon, RouterIcon, TriangleAlertIcon } from 'lucide-react'
import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { updateWifi } from '../../lib/api'
import { wifiStatusOptions } from '../../lib/query-options'
import { useActiveRouter } from '../routers'
import { WifiBandForm } from './wifi-band-form'
import type {
  WifiConfigDTO,
  WifiStatusBandDTO,
} from '@modern-router-management/types/router'

const BANDS = ['2.4ghz', '5ghz'] as const
type WifiBand = (typeof BANDS)[number]

const BAND_LABEL: Record<WifiBand, string> = {
  '2.4ghz': '2.4 GHz',
  '5ghz': '5 GHz',
}

function WifiPage() {
  const { routerId, isLoading: storeLoading } = useActiveRouter()
  const [activeBand, setActiveBand] = useState<WifiBand>('2.4ghz')

  const wifiStatusQuery = useQuery({
    ...wifiStatusOptions(routerId ?? 0),
    enabled: routerId !== null,
  })

  const queryClient = useQueryClient()
  const refreshWifiStatus = () => {
    if (routerId === null) {
      return
    }
    queryClient.refetchQueries({
      predicate: (query) =>
        query.queryKey[0] === 'router' &&
        query.queryKey[1] === routerId &&
        query.queryKey[2] === 'wifi-status',
    })
  }

  const bandsByKey = useMemo(() => {
    const byKey = {} as Record<WifiBand, WifiStatusBandDTO | undefined>
    for (const band of BANDS) {
      byKey[band] = wifiStatusQuery.data?.bands.find(
        (entry) => entry.band === band,
      )
    }
    return byKey
  }, [wifiStatusQuery.data])

  const updateMutation = useMutation({
    mutationFn: ({ band, values }: { band: WifiBand; values: WifiConfigDTO }) =>
      updateWifi(routerId ?? 0, { ...values, band }),
    onSuccess: () => {
      toast.success('WiFi settings applied')
      queryClient.invalidateQueries({
        queryKey: ['router', routerId, 'wifi-status'],
      })
      refreshWifiStatus()
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : 'Unable to apply WiFi settings.',
      )
    },
  })

  const lastUpdatedAt = wifiStatusQuery.dataUpdatedAt
    ? new Date(wifiStatusQuery.dataUpdatedAt).toLocaleTimeString()
    : null

  if (routerId === null && storeLoading) {
    return <WifiPageSkeleton />
  }

  if (routerId === null) {
    return <NoRouterState />
  }

  if (wifiStatusQuery.isPending) {
    return <WifiPageSkeleton />
  }

  if (wifiStatusQuery.isError) {
    return (
      <WifiError
        message={wifiStatusQuery.error.message}
        onRetry={() => wifiStatusQuery.refetch()}
      />
    )
  }

  const currentFor = (band: WifiBand) => {
    const reported = bandsByKey[band]
    if (!reported) {
      return null
    }
    return {
      enabled: reported.enabled,
      ssid: reported.ssid,
      channel: reported.channel,
      security: reported.security,
    }
  }

  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            WiFi Settings
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Configure each wireless band reported by the router
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Refresh WiFi status"
            title="Refresh WiFi status"
            onClick={refreshWifiStatus}
          >
            <RefreshCwIcon
              className={
                wifiStatusQuery.isFetching ? 'size-4 animate-spin' : 'size-4'
              }
              aria-hidden="true"
            />
          </Button>
          {lastUpdatedAt !== null && (
            <p className="text-xs text-muted-foreground">
              Updated {lastUpdatedAt}
            </p>
          )}
        </div>
      </header>

      <Tabs
        value={activeBand}
        onValueChange={(value) => {
          if (value === '2.4ghz' || value === '5ghz') {
            setActiveBand(value)
          }
        }}
      >
        <TabsList aria-label="Wireless band">
          {BANDS.map((band) => (
            <TabsTrigger key={band} value={band}>
              {BAND_LABEL[band]}
            </TabsTrigger>
          ))}
        </TabsList>
        {BANDS.map((band) => (
          <TabsContent key={band} value={band}>
            <WifiBandForm
              band={band}
              current={currentFor(band)}
              isSaving={
                updateMutation.isPending &&
                updateMutation.variables.band === band
              }
              // A save for either band must finish before another starts: the
              // shared mutation is keyed by variables.band, so a second submit
              // would supersede the in-flight one.
              isAnySaving={updateMutation.isPending}
              errorMessage={
                updateMutation.isError && updateMutation.variables.band === band
                  ? updateMutation.error.message
                  : null
              }
              onSubmit={(values) => updateMutation.mutate({ band, values })}
            />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  )
}

function WifiPageSkeleton() {
  return (
    <div className="space-y-8">
      <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <Skeleton className="h-8 w-44" />
          <Skeleton className="mt-2 h-4 w-64" />
        </div>
        <Skeleton className="size-9" />
      </header>
      <Skeleton className="h-10 w-56" />
      <Card>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between gap-4">
            <Skeleton className="h-5 w-28" />
            <Skeleton className="size-5" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-3 w-32" />
            <Skeleton className="h-10 w-full" />
          </div>
          <div className="flex justify-end">
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

function NoRouterState() {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <CardHeader>
        <RouterIcon className="mx-auto size-10 text-muted-foreground" />
        <CardTitle>No router selected</CardTitle>
        <CardDescription>
          Select or add a router in Settings to configure its WiFi.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button render={<a href="/settings" />}>Go to Settings</Button>
      </CardContent>
    </Card>
  )
}

function WifiError({
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
          WiFi settings unavailable
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

export default WifiPage
