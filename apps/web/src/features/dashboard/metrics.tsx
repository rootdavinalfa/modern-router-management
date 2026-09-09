import { Card, CardContent } from '@modern-router-management/ui/components/card'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import { formatUptime } from './format'
import type { SystemStatusDTO } from '@modern-router-management/types/router'

interface SystemMetricsProps {
  system?: SystemStatusDTO
  /** Best-known WAN IPv4 (from the INTERNET connection). */
  wanIp?: string
  /** Router driver reported by the registry. */
  driver?: string
}

interface MetricTileProps {
  label: string
  value: string
  hint?: string
}

function MetricTile({ label, value, hint }: MetricTileProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-medium text-foreground break-all">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function MetricTileSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-16" />
        <Skeleton className="h-4 w-20" />
      </CardContent>
    </Card>
  )
}

/** Firmware / WAN IP / uptime / CPU / memory / driver tiles. */
export function SystemMetrics({ system, wanIp, driver }: SystemMetricsProps) {
  if (!system) {
    return (
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
        <MetricTileSkeleton />
        <MetricTileSkeleton />
        <MetricTileSkeleton />
        <MetricTileSkeleton />
        <MetricTileSkeleton />
        <MetricTileSkeleton />
      </div>
    )
  }

  const tiles: Array<MetricTileProps> = [
    { label: 'Firmware', value: system.softwareVersion },
    { label: 'WAN IP', value: wanIp ?? '0.0.0.0' },
    { label: 'Uptime', value: formatUptime(system.powerOnTime) },
    { label: 'CPU', value: `${system.cpuUsage}%` },
    { label: 'Memory', value: `${system.memoryUsage}%` },
    { label: 'Driver', value: driver ?? 'zte-f6600p' },
  ]

  return (
    <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
      {tiles.map((tile) => (
        <MetricTile
          key={tile.label}
          label={tile.label}
          value={tile.value}
          hint={tile.hint}
        />
      ))}
    </div>
  )
}

interface SystemContextProps {
  system?: SystemStatusDTO
}

/** Secondary details (model, hardware, serial) in a compact strip. */
export function SystemContext({ system }: SystemContextProps) {
  if (!system) {
    return <Skeleton className="h-4 w-72" />
  }
  return (
    <p className="text-xs text-muted-foreground">
      {system.manufacturer} {system.model} · HW {system.hardwareVersion} · S/N{' '}
      {system.serialNumber}
    </p>
  )
}
