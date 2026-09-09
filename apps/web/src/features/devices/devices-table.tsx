import { Badge } from '@modern-router-management/ui/components/badge'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import { Input } from '@modern-router-management/ui/components/input'
import { Progress } from '@modern-router-management/ui/components/progress'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@modern-router-management/ui/components/table'
import {
  CableIcon,
  CheckIcon,
  CopyIcon,
  RefreshCwIcon,
  WifiIcon,
} from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import type { DeviceDTO } from '@modern-router-management/types/router'

const MINUTE_MS = 60_000
const HOUR_MS = 60 * MINUTE_MS
const DAY_MS = 24 * HOUR_MS

interface DevicesTableProps {
  devices: Array<DeviceDTO>
  /** True while a refetch is in flight and a previous result is still shown. */
  isFetching: boolean
  onRefresh: () => void
}

export function DevicesTable({
  devices,
  isFetching,
  onRefresh,
}: DevicesTableProps) {
  const [filter, setFilter] = useState('')

  const query = filter.trim().toLowerCase()
  const visibleDevices = useMemo(() => {
    if (!query) {
      return devices
    }
    return devices.filter(
      (device) =>
        device.name.toLowerCase().includes(query) ||
        device.ipAddress.toLowerCase().includes(query) ||
        device.macAddress.toLowerCase().includes(query),
    )
  }, [devices, query])

  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardAction className="flex items-center gap-3">
          <Badge variant="secondary">{devices.length} connected</Badge>
          <Button
            type="button"
            variant="outline"
            size="icon-sm"
            aria-label="Refresh devices"
            title="Refresh devices"
            onClick={onRefresh}
          >
            <RefreshCwIcon
              className={isFetching ? 'size-4 animate-spin' : 'size-4'}
              aria-hidden="true"
            />
          </Button>
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        {devices.length > 0 ? (
          <Input
            type="text"
            value={filter}
            onChange={(event) => setFilter(event.target.value)}
            placeholder="Filter by name, IP or MAC"
            aria-label="Filter devices by name, IP address or MAC address"
          />
        ) : null}

        <Table aria-label="Connected devices list">
          <DevicesTableHeader />
          <TableBody>
            {visibleDevices.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={6}
                  className="h-24 text-center text-muted-foreground"
                >
                  {devices.length === 0
                    ? 'No devices connected'
                    : 'No devices match'}
                </TableCell>
              </TableRow>
            ) : (
              visibleDevices.map((device) => (
                <DeviceRow key={device.id} device={device} />
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** Skeleton card mirroring the loaded table while the first fetch is pending. */
export function DevicesTableSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Connected Devices</CardTitle>
        <CardAction className="flex items-center gap-3">
          <Skeleton className="h-5 w-24" />
          <Skeleton className="size-9" />
        </CardAction>
      </CardHeader>

      <CardContent className="space-y-4">
        <Skeleton className="h-10 w-full" />
        <Table aria-label="Connected devices list">
          <DevicesTableHeader />
          <TableBody>
            {Array.from({ length: 5 }, (_, row) => (
              <TableRow key={row}>
                <TableCell>
                  <div className="flex flex-col gap-1.5">
                    <Skeleton className="h-3.5 w-28" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-28" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-14" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-3.5 w-14" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

function DevicesTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Device</TableHead>
        <TableHead>IP address</TableHead>
        <TableHead>MAC</TableHead>
        <TableHead>Type</TableHead>
        <TableHead>Signal</TableHead>
        <TableHead>Connected</TableHead>
      </TableRow>
    </TableHeader>
  )
}

function DeviceRow({ device }: { device: DeviceDTO }) {
  // Wireless clients report a 0-100 signal; clamp defensively since the
  // driver sometimes exposes raw RSSI values outside that range.
  const signal =
    device.connectionType === 'wireless' &&
    typeof device.signalStrength === 'number'
      ? Math.max(0, Math.min(100, device.signalStrength))
      : null

  return (
    <TableRow>
      <TableCell>
        <p className="font-medium text-foreground">{device.name}</p>
        <p className="text-xs text-muted-foreground">{device.id}</p>
      </TableCell>
      <TableCell className="font-medium">{device.ipAddress}</TableCell>
      <TableCell>
        <span className="flex items-center gap-1.5">
          <span className="font-mono text-xs tracking-wide text-muted-foreground">
            {device.macAddress}
          </span>
          <CopyMacButton mac={device.macAddress} />
        </span>
      </TableCell>
      <TableCell>
        {device.connectionType === 'wireless' ? (
          <Badge variant="default">
            <WifiIcon aria-hidden="true" />
            Wireless
          </Badge>
        ) : (
          <Badge variant="secondary">
            <CableIcon aria-hidden="true" />
            Wired
          </Badge>
        )}
      </TableCell>
      <TableCell>
        {signal === null ? (
          <span className="text-muted-foreground" aria-label="No signal">
            —
          </span>
        ) : (
          <span className="flex items-center gap-2">
            <Progress
              value={signal}
              aria-label={`Signal ${signal} percent`}
              className="w-14"
            />
            <span className="text-xs text-muted-foreground tabular-nums">
              {signal}%
            </span>
          </span>
        )}
      </TableCell>
      <TableCell>
        <span
          className="text-muted-foreground"
          title={formatAbsoluteTime(device.connectedAt)}
        >
          {formatConnectedAt(device.connectedAt)}
        </span>
      </TableCell>
    </TableRow>
  )
}

function CopyMacButton({ mac }: { mac: string }) {
  const [copied, setCopied] = useState(false)
  const resetTimer = useRef<number | undefined>(undefined)

  useEffect(() => {
    return () => {
      clearTimeout(resetTimer.current)
    }
  }, [])

  const handleCopy = () => {
    navigator.clipboard
      .writeText(mac)
      .then(() => {
        setCopied(true)
        clearTimeout(resetTimer.current)
        resetTimer.current = window.setTimeout(() => setCopied(false), 1500)
      })
      .catch(() => {
        // Clipboard unavailable (e.g. insecure context); the MAC text above
        // can still be selected and copied by hand.
      })
  }

  return (
    <Button
      type="button"
      variant="ghost"
      size="icon-xs"
      aria-label={copied ? 'MAC copied' : `Copy MAC address ${mac}`}
      title={copied ? 'Copied' : 'Copy MAC address'}
      onClick={handleCopy}
    >
      {copied ? (
        <CheckIcon className="size-3 text-primary" aria-hidden="true" />
      ) : (
        <CopyIcon className="size-3" aria-hidden="true" />
      )}
    </Button>
  )
}

/** Relative time since the device connected; falls back to the raw value. */
function formatConnectedAt(value: string): string {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return value
  }
  const elapsed = Date.now() - time
  if (elapsed < MINUTE_MS) {
    return 'just now'
  }
  if (elapsed < HOUR_MS) {
    return `${Math.floor(elapsed / MINUTE_MS)}m ago`
  }
  if (elapsed < DAY_MS) {
    return `${Math.floor(elapsed / HOUR_MS)}h ago`
  }
  if (elapsed < 30 * DAY_MS) {
    return `${Math.floor(elapsed / DAY_MS)}d ago`
  }
  return formatAbsoluteTime(value)
}

/** Absolute local timestamp for hover detail; raw value when unparseable. */
function formatAbsoluteTime(value: string): string {
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString()
}
