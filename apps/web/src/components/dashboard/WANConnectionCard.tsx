import {
  Badge,
  Card,
  CardContent,
  CardHeader,
} from '@modern-router-management/ui'
import type { WanConnectionDTO } from '@modern-router-management/types/router'

interface WANConnectionCardProps {
  connection: WanConnectionDTO
  index: number
}

interface WANDetailItemProps {
  label: string
  value: string
}

function WANDetailItem({ label, value }: WANDetailItemProps) {
  return (
    <div>
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <p className="text-sm font-medium text-[var(--sea-ink)]">
        {value || 'N/A'}
      </p>
    </div>
  )
}

interface WANDetailItemWithBadgeProps {
  label: string
  value: string
  badgeLabel?: string
  badgeVariant?: 'private' | 'public'
}

function WANDetailItemWithBadge({
  label,
  value,
  badgeLabel,
  badgeVariant,
}: WANDetailItemWithBadgeProps) {
  return (
    <div className="flex flex-col gap-1">
      <p className="text-xs text-[var(--sea-ink-soft)]">{label}</p>
      <div className="flex items-center gap-2">
        <p className="text-sm font-medium text-[var(--sea-ink)] break-all">
          {value || 'N/A'}
        </p>
        {badgeLabel && (
          <Badge
            className={
              badgeVariant === 'private'
                ? 'bg-[rgba(47,106,74,0.12)] text-[var(--palm)]'
                : 'bg-[rgba(200,50,50,0.12)] text-[var(--lagoon-deep)]'
            }
          >
            {badgeLabel}
          </Badge>
        )}
      </div>
    </div>
  )
}

const formatUptime = (seconds: number): string => {
  const days = Math.floor(seconds / 86400)
  const hours = Math.floor((seconds % 86400) / 3600)
  const minutes = Math.floor((seconds % 3600) / 60)

  return `${days}d ${hours}h ${minutes}m`
}

export function WANConnectionCard({
  connection,
  index,
}: WANConnectionCardProps) {
  const {
    name,
    type,
    ipVersion,
    nat,
    ipAddress,
    dns,
    gateway,
    connectionStatus,
    uptime,
    macAddress,
    vlanId,
    disconnectReason,
    lla,
    gua,
    dnsV6,
    connectionStatusV6,
    uptimeV6,
    uptimeV6Seconds,
    gatewayV6,
    isPrivate,
  } = connection

  const hasIPv6 =
    lla || gua || dnsV6 || connectionStatusV6 || uptimeV6 || gatewayV6

  return (
    <Card
      className="rise-in rounded-2xl p-4"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="island-kicker mb-2">{name}</p>
            <h4 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
              {type} {ipVersion}
            </h4>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge
              className={
                connectionStatus === 'Connected'
                  ? 'bg-[rgba(47,106,74,0.12)] text-[var(--palm)]'
                  : 'bg-[rgba(200,50,50,0.12)] text-[var(--lagoon-deep)]'
              }
            >
              {connectionStatus}
            </Badge>
            {vlanId && (
              <Badge className="bg-[rgba(79,184,178,0.18)]">
                VLAN {vlanId}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <div className="sm:col-span-2 lg:col-span-3">
            <WANDetailItemWithBadge
              label="IP Address"
              value={ipAddress}
              badgeLabel={isPrivate ? 'Private' : 'Public'}
              badgeVariant={isPrivate ? 'private' : 'public'}
            />
          </div>
          <WANDetailItem label="Gateway" value={gateway} />
          <WANDetailItem label="DNS" value={dns} />
          <WANDetailItem label="MAC Address" value={macAddress} />
          <WANDetailItem label="NAT" value={nat} />
          <WANDetailItem label="Uptime" value={formatUptime(uptime)} />
          {disconnectReason && (
            <WANDetailItem label="Disconnect Reason" value={disconnectReason} />
          )}
        </div>

        {hasIPv6 && (
          <div className="mt-4 border-t border-[var(--line)] pt-4">
            <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
              IPv6
            </p>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {lla && <WANDetailItem label="LLA" value={lla} />}
              {gua && <WANDetailItem label="GUA" value={gua} />}
              {dnsV6 && <WANDetailItem label="DNS" value={dnsV6} />}
              {connectionStatusV6 && (
                <WANDetailItem
                  label="Connection Status"
                  value={connectionStatusV6}
                />
              )}
              {uptimeV6 && uptimeV6Seconds !== undefined && (
                <WANDetailItem
                  label="IPv6 Uptime"
                  value={formatUptime(uptimeV6)}
                />
              )}
              {gatewayV6 && <WANDetailItem label="Gateway" value={gatewayV6} />}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
