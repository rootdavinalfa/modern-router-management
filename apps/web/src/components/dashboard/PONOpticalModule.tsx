import type { ReactNode } from 'react'
import { Badge, Card, CardContent } from '@modern-router-management/ui'

interface PONData {
  rxPower: number
  txPower: number
  temperature: number
  voltage: number
  current: number
  onuState: string
}

interface PONOpticalModuleProps {
  ponData: PONData
  signalStrength: number
}

interface PONMetricCardProps {
  label: string
  animationDelay?: number
  children?: ReactNode
}

function PONMetricCard({
  label,
  animationDelay = 0,
  children,
}: PONMetricCardProps) {
  return (
    <Card
      className="rise-in rounded-2xl p-4"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardContent>
        <p className="island-kicker mb-2">{label}</p>
        {children}
      </CardContent>
    </Card>
  )
}

export function PONOpticalModule({
  ponData,
  signalStrength,
}: PONOpticalModuleProps) {
  const signalPercentage = Math.max(
    0,
    Math.min(100, ((ponData.rxPower + 28) / 20) * 100),
  )

  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
        PON Optical Module Status
      </h3>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <PONMetricCard label="Optical Input Power (Rx)">
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {ponData.rxPower.toFixed(2)} dBm
          </p>
          <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface-strong)]">
            <div
              className="h-2 rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--palm)]"
              style={{ width: `${signalPercentage}%` }}
            />
          </div>
          <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
            Signal: {signalStrength}%
          </p>
        </PONMetricCard>

        <PONMetricCard label="Optical Output Power (Tx)" animationDelay={60}>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {ponData.txPower.toFixed(2)} dBm
          </p>
        </PONMetricCard>

        <PONMetricCard label="Temperature" animationDelay={120}>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {ponData.temperature.toFixed(1)} °C
          </p>
        </PONMetricCard>

        <PONMetricCard label="Supply Voltage" animationDelay={180}>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {ponData.voltage} mV
          </p>
        </PONMetricCard>

        <PONMetricCard label="Bias Current" animationDelay={240}>
          <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
            {ponData.current.toFixed(1)} mA
          </p>
        </PONMetricCard>

        <PONMetricCard label="ONU State" animationDelay={300}>
          <Badge>{ponData.onuState}</Badge>
        </PONMetricCard>
      </div>
    </div>
  )
}
