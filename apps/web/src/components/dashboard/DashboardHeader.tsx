import { Badge } from '@modern-router-management/ui'

interface DashboardHeaderProps {
  model: string
  status: string
  signalStrength: number
}

export function DashboardHeader({
  model,
  status,
  signalStrength,
}: DashboardHeaderProps) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-4">
      <div>
        <p className="island-kicker mb-3">Router-Core Dashboard</p>
        <h1 className="display-title mb-3 max-w-2xl text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
          {model} Control Center
        </h1>
        <p className="max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
          Live status snapshots, connected devices, and WiFi tuning in a single,
          type-safe surface.
        </p>
      </div>
      <div className="flex flex-wrap gap-3">
        <Badge>{status}</Badge>
        <Badge className="bg-[rgba(47,106,74,0.12)] text-[var(--palm)]">
          Signal {signalStrength}%
        </Badge>
      </div>
    </div>
  )
}
