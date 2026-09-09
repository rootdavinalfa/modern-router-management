import { Badge } from '@modern-router-management/ui/components/badge'
import { Button } from '@modern-router-management/ui/components/button'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import { PlusIcon, RefreshCwIcon } from 'lucide-react'

interface DashboardHeaderProps {
  /** Active router name shown as the page title. */
  routerName: string
  /** Router model from the system status (falls back to a generic line). */
  model?: string
  /** Link status; `null` while the WAN query has no data yet. */
  online: boolean | null
  /** Optical signal percentage; `null` while the PON query has no data yet. */
  signal: number | null
  /** Epoch ms of the last successful status fetch, if any. */
  lastUpdatedAt: number | null
  onRefresh: () => void
  onAddRouter: () => void
}

function formatUpdatedAt(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString()
}

export function DashboardHeader({
  routerName,
  model,
  online,
  signal,
  lastUpdatedAt,
  onRefresh,
  onAddRouter,
}: DashboardHeaderProps) {
  return (
    <header className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="min-w-0">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          Router-Core Dashboard
        </p>
        <h1 className="font-heading mt-1 text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          {routerName}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          {model ? `${model} · live status snapshot` : 'Live status snapshot'}
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          {online === null ? (
            <Skeleton className="h-3.5 w-14" />
          ) : (
            <Badge variant={online ? 'default' : 'destructive'}>
              {online ? 'Online' : 'Offline'}
            </Badge>
          )}
          {signal === null ? (
            <Skeleton className="h-3.5 w-20" />
          ) : (
            <Badge variant="secondary">Signal {signal}%</Badge>
          )}
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon-sm"
            onClick={onRefresh}
            aria-label="Refresh status"
            title="Refresh status"
          >
            <RefreshCwIcon className="size-4" aria-hidden="true" />
          </Button>
          <Button variant="outline" size="sm" onClick={onAddRouter}>
            <PlusIcon className="size-3.5" aria-hidden="true" />
            Add router
          </Button>
        </div>
      </div>

      {lastUpdatedAt !== null && (
        <p className="w-full text-xs text-muted-foreground sm:w-auto sm:text-right">
          Updated {formatUpdatedAt(lastUpdatedAt)}
        </p>
      )}
    </header>
  )
}

/** Skeleton block mirroring the header while the first statuses load. */
export function DashboardHeaderSkeleton() {
  return (
    <div className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
      <div className="space-y-2">
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-8 w-56" />
        <Skeleton className="h-4 w-40" />
      </div>
      <div className="flex items-center gap-2">
        <Skeleton className="h-9 w-14" />
        <Skeleton className="h-9 w-20" />
        <Skeleton className="h-9 w-24" />
      </div>
    </div>
  )
}
