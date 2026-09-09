import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import { RouterIcon, TriangleAlertIcon } from 'lucide-react'
import { devicesOptions } from '../../lib/query-options'
import { useActiveRouter } from '../routers'
import { DevicesTable, DevicesTableSkeleton } from './devices-table'

function DevicesPage() {
  const { routerId, isLoading: storeLoading } = useActiveRouter()

  const devicesQuery = useQuery({
    ...devicesOptions(routerId ?? 0),
    enabled: routerId !== null,
  })

  const queryClient = useQueryClient()
  const refreshDevices = () => {
    if (routerId === null) {
      return
    }
    queryClient.refetchQueries({
      predicate: (query) =>
        query.queryKey[0] === 'router' &&
        query.queryKey[1] === routerId &&
        query.queryKey[2] === 'devices',
    })
  }

  if (routerId === null && storeLoading) {
    return <DevicesTableSkeleton />
  }

  if (routerId === null) {
    return <NoRouterState />
  }

  if (devicesQuery.isPending) {
    return <DevicesTableSkeleton />
  }

  if (devicesQuery.isError) {
    return (
      <DevicesError
        message={devicesQuery.error.message}
        onRetry={() => devicesQuery.refetch()}
      />
    )
  }

  return (
    <DevicesTable
      devices={devicesQuery.data}
      isFetching={devicesQuery.isFetching}
      onRefresh={refreshDevices}
    />
  )
}

function NoRouterState() {
  return (
    <Card className="mx-auto max-w-md p-6 text-center">
      <CardHeader>
        <RouterIcon className="mx-auto size-10 text-muted-foreground" />
        <CardTitle>No router selected</CardTitle>
        <CardDescription>
          Select or add a router in Settings to see its connected devices.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex justify-center">
        <Button render={<a href="/settings" />}>Go to Settings</Button>
      </CardContent>
    </Card>
  )
}

function DevicesError({
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
          Devices unavailable
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

export default DevicesPage
