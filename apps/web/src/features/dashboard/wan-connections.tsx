import { Badge } from '@modern-router-management/ui/components/badge'
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@modern-router-management/ui/components/table'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import { formatUptime } from './format'
import type { WanConnectionDTO } from '@modern-router-management/types/router'

interface WANConnectionsProps {
  connections: Array<WanConnectionDTO>
}

export function WANConnections({ connections }: WANConnectionsProps) {
  return (
    <section className="space-y-4">
      <h2 className="font-heading text-lg font-semibold tracking-wide text-foreground uppercase">
        WAN Connections
      </h2>

      {connections.length === 0 ? (
        <Card className="p-5">
          <CardContent>
            <p className="text-sm text-muted-foreground">
              No WAN connections available.
            </p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {connections.map((connection) => (
            <ConnectionCard key={connection.name} connection={connection} />
          ))}
        </div>
      )}
    </section>
  )
}

export function WANConnectionsSkeleton() {
  return (
    <section className="space-y-4">
      <Skeleton className="h-5 w-48" />
      <Card className="p-5">
        <CardContent className="space-y-3">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-4 w-64" />
          <Skeleton className="h-4 w-56" />
        </CardContent>
      </Card>
    </section>
  )
}

function ConnectionCard({ connection }: { connection: WanConnectionDTO }) {
  const connected = connection.connectionStatus === 'Connected'
  const ipv6 = connection.lla || connection.gua || connection.gatewayV6

  return (
    <Card>
      <CardHeader className="flex-row items-center justify-between gap-3">
        <div className="min-w-0">
          <CardTitle className="text-base">{connection.name}</CardTitle>
          <p className="mt-0.5 text-xs text-muted-foreground">
            {[connection.type, connection.ipVersion]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {connection.vlanId ? (
            <Badge variant="secondary">VLAN {connection.vlanId}</Badge>
          ) : null}
          <Badge variant={connected ? 'default' : 'destructive'}>
            {connection.connectionStatus || 'Unknown'}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Property</TableHead>
              <TableHead>Value</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow>
              <TableCell className="text-muted-foreground">IPv4</TableCell>
              <TableCell>
                <span className="flex items-center gap-2">
                  <span className="break-all font-medium text-foreground">
                    {connection.ipAddress}
                  </span>
                  <Badge
                    variant={connection.isPrivate ? 'secondary' : 'outline'}
                  >
                    {connection.isPrivate ? 'Private' : 'Public'}
                  </Badge>
                </span>
              </TableCell>
            </TableRow>
            {connection.gateway ? (
              <TableRow>
                <TableCell className="text-muted-foreground">Gateway</TableCell>
                <TableCell className="font-medium">
                  {connection.gateway}
                </TableCell>
              </TableRow>
            ) : null}
            {connection.dns ? (
              <TableRow>
                <TableCell className="text-muted-foreground">DNS</TableCell>
                <TableCell className="font-medium">{connection.dns}</TableCell>
              </TableRow>
            ) : null}
            {connection.macAddress ? (
              <TableRow>
                <TableCell className="text-muted-foreground">MAC</TableCell>
                <TableCell className="font-medium">
                  {connection.macAddress}
                </TableCell>
              </TableRow>
            ) : null}
            {connection.nat ? (
              <TableRow>
                <TableCell className="text-muted-foreground">NAT</TableCell>
                <TableCell className="font-medium">{connection.nat}</TableCell>
              </TableRow>
            ) : null}
            <TableRow>
              <TableCell className="text-muted-foreground">
                Connection uptime
              </TableCell>
              <TableCell className="font-medium">
                {formatUptime(connection.uptimeSeconds)}
              </TableCell>
            </TableRow>
            {connection.disconnectReason ? (
              <TableRow>
                <TableCell className="text-muted-foreground">
                  Disconnect reason
                </TableCell>
                <TableCell className="font-medium">
                  {connection.disconnectReason}
                </TableCell>
              </TableRow>
            ) : null}
            {ipv6 ? (
              <TableRow>
                <TableCell className="text-muted-foreground">IPv6</TableCell>
                <TableCell className="max-w-md">
                  <span className="block break-all font-medium">
                    {connection.gua ?? connection.lla}
                  </span>
                  {connection.gatewayV6 ? (
                    <span className="block text-xs text-muted-foreground">
                      gw {connection.gatewayV6}
                    </span>
                  ) : null}
                </TableCell>
              </TableRow>
            ) : null}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
