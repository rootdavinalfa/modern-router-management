import { Badge, Card, CardContent, CardHeader } from '@modern-router-management/ui'
import type { WanConnection } from '../../lib/api'

interface WANConnectionCardProps {
  connection: WanConnection
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

export function WANConnectionCard({ connection, index }: WANConnectionCardProps) {
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
    gatewayV6,
  } = connection

  const hasIPv6 = lla || gua || dnsV6 || connectionStatusV6 || uptimeV6 || gatewayV6

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
          <WANDetailItem label="IP Address" value={ipAddress} />
          <WANDetailItem label="Gateway" value={gateway} />
          <WANDetailItem label="DNS" value={dns} />
          <WANDetailItem label="MAC Address" value={macAddress} />
          <WANDetailItem label="NAT" value={nat} />
          <WANDetailItem label="Uptime" value={uptime} />
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
                <WANDetailItem label="Connection Status" value={connectionStatusV6} />
              )}
              {uptimeV6 && (
                <WANDetailItem label="IPv6 Uptime" value={uptimeV6} />
              )}
              {gatewayV6 && (
                <WANDetailItem label="Gateway" value={gatewayV6} />
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
