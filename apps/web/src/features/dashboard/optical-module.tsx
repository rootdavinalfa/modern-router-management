import { Badge } from '@modern-router-management/ui/components/badge'
import { Card, CardContent } from '@modern-router-management/ui/components/card'
import {
  Progress,
  ProgressLabel,
  ProgressValue,
} from '@modern-router-management/ui/components/progress'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import type { PONStatusDTO } from '@modern-router-management/types/router'

interface OpticalModuleProps {
  /** Full PON status payload; renders skeleton tiles while undefined. */
  data: PONStatusDTO | undefined
  /** Signal percentage computed from rxPower (0-100). */
  signal: number | null
}

interface PONMetricProps {
  label: string
  value: string
  hint?: string
}

function PONMetric({ label, value, hint }: PONMetricProps) {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-1">
        <p className="text-xs font-semibold tracking-widest text-muted-foreground uppercase">
          {label}
        </p>
        <p className="font-medium text-foreground">{value}</p>
        {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
      </CardContent>
    </Card>
  )
}

function PONMetricSkeleton() {
  return (
    <Card size="sm">
      <CardContent className="flex flex-col gap-2">
        <Skeleton className="h-3 w-20" />
        <Skeleton className="h-4 w-16" />
      </CardContent>
    </Card>
  )
}

const formatVoltage = (millivolts: number): string =>
  `${(millivolts / 1000).toFixed(3)} V`

const ONU_STATE_VARIANT: Record<string, 'default' | 'secondary'> = {
  Online: 'default',
  O1: 'default',
  O5: 'default',
}

function onuVariant(state: string): 'default' | 'secondary' {
  return ONU_STATE_VARIANT[state] ?? 'secondary'
}

export function OpticalModule({ data, signal }: OpticalModuleProps) {
  return (
    <section className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <h2 className="font-heading text-lg font-semibold tracking-wide text-foreground uppercase">
          PON Optical Module
        </h2>
        {data ? (
          <Badge variant={onuVariant(data.onuState)}>{data.onuState}</Badge>
        ) : (
          <Skeleton className="h-5 w-20" />
        )}
      </div>

      {data ? (
        <>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <PONMetric
              label="Rx Power"
              value={`${data.rxPower.toFixed(2)} dBm`}
            />
            <PONMetric
              label="Tx Power"
              value={`${data.txPower.toFixed(2)} dBm`}
            />
            <PONMetric
              label="Temperature"
              value={`${data.temperature.toFixed(1)} °C`}
            />
            <PONMetric
              label="Supply Voltage"
              value={formatVoltage(data.voltage)}
            />
            <PONMetric
              label="Bias Current"
              value={`${data.current.toFixed(1)} mA`}
            />
            <PONMetric label="ONU ID" value={String(data.onuId)} />
          </div>

          {signal !== null && (
            <Progress value={signal} className="gap-2">
              <ProgressLabel>Optical signal</ProgressLabel>
              <ProgressValue>{() => `${signal}%`}</ProgressValue>
            </Progress>
          )}
        </>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <PONMetricSkeleton />
          <PONMetricSkeleton />
          <PONMetricSkeleton />
          <PONMetricSkeleton />
          <PONMetricSkeleton />
          <PONMetricSkeleton />
        </div>
      )}
    </section>
  )
}
