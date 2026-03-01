import { zodResolver } from '@hookform/resolvers/zod'
import {
  routerCreateSchema,
  wifiConfigSchema,
  type RouterCreateDTO,
  type WifiConfigDTO,
} from '@modern-router-management/types/router'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { createFileRoute } from '@tanstack/react-router'
import { useMemo, useState } from 'react'
import { useForm } from 'react-hook-form'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@modern-router-management/ui'
import {
  createRouter,
  fetchActiveRouter,
  fetchRouterDevices,
  fetchRouterStatus,
  updateWifi,
  type RouterStatusExtended,
  type WanConnection,
} from '../lib/api'

export const Route = createFileRoute('/')({ component: App })

const formatUptime = (uptimeSeconds: number) => {
  const days = Math.floor(uptimeSeconds / 86400)
  const hours = Math.floor((uptimeSeconds % 86400) / 3600)
  const minutes = Math.floor((uptimeSeconds % 3600) / 60)

  return `${days}d ${hours}h ${minutes}m`
}

function App() {
  const queryClient = useQueryClient()
  const [lastSaved, setLastSaved] = useState<WifiConfigDTO | null>(null)
  const [setupStatus, setSetupStatus] = useState<string | null>(null)
  const [wifiStatus, setWifiStatus] = useState<string | null>(null)

  const activeRouterQuery = useQuery({
    queryKey: ['router', 'active'],
    queryFn: fetchActiveRouter,
  })

  const routerId = activeRouterQuery.data?.id ?? null

  const statusQuery = useQuery({
    queryKey: ['router', routerId, 'status'],
    queryFn: () => fetchRouterStatus(routerId as number),
    enabled: routerId !== null,
    refetchInterval: 10000,
  })

  const devicesQuery = useQuery({
    queryKey: ['router', routerId, 'devices'],
    queryFn: () => fetchRouterDevices(routerId as number),
    enabled: routerId !== null,
    refetchInterval: 10000,
  })

  const setupMutation = useMutation({
    mutationFn: createRouter,
    onSuccess: () => {
      setSetupStatus('Router saved securely.')
      queryClient.invalidateQueries({ queryKey: ['router'] })
    },
    onError: (error) => {
      setSetupStatus(
        error instanceof Error ? error.message : 'Unable to save router.',
      )
    },
  })

  const wifiMutation = useMutation({
    mutationFn: ({ id, config }: { id: number; config: WifiConfigDTO }) =>
      updateWifi(id, config),
    onSuccess: () => {
      setWifiStatus('WiFi update sent.')
    },
    onError: (error) => {
      setWifiStatus(
        error instanceof Error ? error.message : 'Unable to update WiFi.',
      )
    },
  })

  const statusSnapshot = useMemo(() => {
    if (!statusQuery.data) {
      return {
        model: 'ZTE F6600P',
        firmware: 'unknown',
        uptime: '0d 0h 0m',
        wanIp: '0.0.0.0',
        signal: 0,
        status: 'Offline',
        rxPower: 0,
        txPower: 0,
        temperature: 0,
        voltage: 0,
        current: 0,
        onuState: 'Unknown',
        wanConnections: [] as WanConnection[],
      }
    }

    return {
      model: statusQuery.data.model,
      firmware: statusQuery.data.firmware,
      uptime: formatUptime(statusQuery.data.uptimeSeconds),
      wanIp: statusQuery.data.wanIp,
      signal: statusQuery.data.signalStrength ?? 0,
      status: statusQuery.data.online ? 'Online' : 'Offline',
      rxPower: 0,
      txPower: 0,
      temperature: 0,
      voltage: 0,
      current: 0,
      onuState: 'Unknown',
      wanConnections: (statusQuery.data as RouterStatusExtended).wanConnections || [],
    }
  }, [statusQuery.data])

  const devices = devicesQuery.data ?? []

  const routerForm = useForm<RouterCreateDTO>({
    resolver: zodResolver(routerCreateSchema),
    defaultValues: {
      name: 'Home Router',
      host: '192.168.1.1',
      driver: 'zte-f6600p',
      username: 'admin',
      password: '',
    },
  })

  const form = useForm<WifiConfigDTO>({
    resolver: zodResolver(wifiConfigSchema),
    defaultValues: {
      ssid: 'Router-Core HQ',
      password: 'ChangeMe123',
      band: '5ghz',
      enabled: true,
      channel: 44,
    },
  })

  const errors = form.formState.errors
  const selectClasses =
    'w-full rounded-2xl border border-[var(--line)] bg-[var(--surface-strong)] px-4 py-3 text-sm text-[var(--sea-ink)] shadow-[inset_0_1px_0_var(--inset-glint)] focus:outline-none focus:ring-2 focus:ring-[rgba(79,184,178,0.45)]'

  const handleSubmit = (values: WifiConfigDTO) => {
    if (!routerId) {
      setWifiStatus('Connect a router before updating WiFi.')
      return
    }

    wifiMutation.mutate({ id: routerId, config: values })
    setLastSaved(values)
  }

  const handleSetup = (values: RouterCreateDTO) => {
    setSetupStatus(null)
    setupMutation.mutate(values)
  }

  return (
    <main className="page-wrap space-y-8 px-4 pb-10 pt-14">
      <section className="island-shell rise-in relative overflow-hidden rounded-[2rem] px-6 py-10 sm:px-10 sm:py-12">
        <div className="pointer-events-none absolute -left-20 -top-24 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(79,184,178,0.28),transparent_66%)]" />
        <div className="pointer-events-none absolute -bottom-20 -right-20 h-56 w-56 rounded-full bg-[radial-gradient(circle,rgba(47,106,74,0.18),transparent_66%)]" />
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="island-kicker mb-3">Router-Core Dashboard</p>
            <h1 className="display-title mb-3 max-w-2xl text-4xl font-bold tracking-tight text-[var(--sea-ink)] sm:text-5xl">
              {statusSnapshot.model} Control Center
            </h1>
            <p className="max-w-2xl text-base text-[var(--sea-ink-soft)] sm:text-lg">
              Live status snapshots, connected devices, and WiFi tuning in a
              single, type-safe surface.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Badge>{statusSnapshot.status}</Badge>
            <Badge className="bg-[rgba(47,106,74,0.12)] text-[var(--palm)]">
              Signal {statusSnapshot.signal}%
            </Badge>
          </div>
        </div>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            ['Firmware', statusSnapshot.firmware],
            ['WAN IP', statusSnapshot.wanIp],
            ['Uptime', statusSnapshot.uptime],
            ['Driver', 'zte-f6600p'],
          ].map(([label, value], index) => (
            <Card
              key={label}
              className="feature-card rise-in rounded-2xl"
              style={{ animationDelay: `${index * 90 + 120}ms` }}
            >
              <CardContent>
                <p className="island-kicker mb-2">{label}</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {value}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* PON Optical Module Status */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
            PON Optical Module Status
          </h3>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            <Card className="rise-in rounded-2xl">
              <CardContent>
                <p className="island-kicker mb-2">Optical Input Power (Rx)</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {statusSnapshot.rxPower.toFixed(2)} dBm
                </p>
                <div className="mt-2 h-2 w-full rounded-full bg-[var(--surface-strong)]">
                  <div
                    className="h-2 rounded-full bg-gradient-to-r from-[var(--lagoon)] to-[var(--palm)]"
                    style={{ width: `${Math.max(0, Math.min(100, statusSnapshot.signal))}%` }}
                  />
                </div>
                <p className="mt-1 text-xs text-[var(--sea-ink-soft)]">
                  Signal: {statusSnapshot.signal}%
                </p>
              </CardContent>
            </Card>
            <Card className="rise-in rounded-2xl" style={{ animationDelay: '60ms' }}>
              <CardContent>
                <p className="island-kicker mb-2">Optical Output Power (Tx)</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {statusSnapshot.txPower.toFixed(2)} dBm
                </p>
              </CardContent>
            </Card>
            <Card className="rise-in rounded-2xl" style={{ animationDelay: '120ms' }}>
              <CardContent>
                <p className="island-kicker mb-2">Temperature</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {statusSnapshot.temperature.toFixed(1)} °C
                </p>
              </CardContent>
            </Card>
            <Card className="rise-in rounded-2xl" style={{ animationDelay: '180ms' }}>
              <CardContent>
                <p className="island-kicker mb-2">Supply Voltage</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {statusSnapshot.voltage} mV
                </p>
              </CardContent>
            </Card>
            <Card className="rise-in rounded-2xl" style={{ animationDelay: '240ms' }}>
              <CardContent>
                <p className="island-kicker mb-2">Bias Current</p>
                <p className="m-0 text-xl font-semibold text-[var(--sea-ink)]">
                  {statusSnapshot.current.toFixed(1)} mA
                </p>
              </CardContent>
            </Card>
            <Card className="rise-in rounded-2xl" style={{ animationDelay: '300ms' }}>
              <CardContent>
                <p className="island-kicker mb-2">ONU State</p>
                <Badge>{statusSnapshot.onuState}</Badge>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* WAN Connections */}
        <div className="mt-6">
          <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
            WAN Connections
          </h3>
          <div className="space-y-4">
            {statusSnapshot.wanConnections.length === 0 ? (
              <Card className="rise-in rounded-2xl">
                <CardContent>
                  <p className="text-sm text-[var(--sea-ink-soft)]">
                    No WAN connections available.
                  </p>
                </CardContent>
              </Card>
            ) : (
              statusSnapshot.wanConnections.map((wan, index) => (
                <Card
                  key={`${wan.name}-${index}`}
                  className="rise-in rounded-2xl"
                  style={{ animationDelay: `${index * 60}ms` }}
                >
                  <CardHeader>
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div>
                        <p className="island-kicker mb-2">{wan.name}</p>
                        <h4 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
                          {wan.type} {wan.ipVersion}
                        </h4>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        <Badge
                          className={
                            wan.connectionStatus === 'Connected'
                              ? 'bg-[rgba(47,106,74,0.12)] text-[var(--palm)]'
                              : 'bg-[rgba(200,50,50,0.12)] text-[var(--lagoon-deep)]'
                          }
                        >
                          {wan.connectionStatus}
                        </Badge>
                        {wan.vlanId && (
                          <Badge className="bg-[rgba(79,184,178,0.18)]">
                            VLAN {wan.vlanId}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">IP Address</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.ipAddress || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">Gateway</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.gateway || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">DNS</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.dns || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">MAC Address</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.macAddress || 'N/A'}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">NAT</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.nat}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-[var(--sea-ink-soft)]">Uptime</p>
                        <p className="text-sm font-medium text-[var(--sea-ink)]">
                          {wan.uptime || 'N/A'}
                        </p>
                      </div>
                      {wan.disconnectReason && (
                        <div>
                          <p className="text-xs text-[var(--sea-ink-soft)]">
                            Disconnect Reason
                          </p>
                          <p className="text-sm font-medium text-[var(--sea-ink)]">
                            {wan.disconnectReason}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* IPv6 Section (if available) */}
                    {(wan.lla || wan.gua || wan.dnsV6 || wan.connectionStatusV6) && (
                      <div className="mt-4 border-t border-[var(--line)] pt-4">
                        <p className="mb-3 text-xs font-semibold uppercase tracking-wide text-[var(--sea-ink-soft)]">
                          IPv6
                        </p>
                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                          {wan.lla && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">LLA</p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.lla}
                              </p>
                            </div>
                          )}
                          {wan.gua && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">GUA</p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.gua}
                              </p>
                            </div>
                          )}
                          {wan.dnsV6 && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">DNS</p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.dnsV6}
                              </p>
                            </div>
                          )}
                          {wan.connectionStatusV6 && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">
                                Connection Status
                              </p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.connectionStatusV6}
                              </p>
                            </div>
                          )}
                          {wan.uptimeV6 && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">
                                IPv6 Uptime
                              </p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.uptimeV6}
                              </p>
                            </div>
                          )}
                          {wan.gatewayV6 && (
                            <div>
                              <p className="text-xs text-[var(--sea-ink-soft)]">
                                Gateway
                              </p>
                              <p className="text-sm font-medium text-[var(--sea-ink)]">
                                {wan.gatewayV6}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-[2fr_1fr]">
        <Card className="rounded-2xl">
          <CardHeader>
            <p className="island-kicker mb-2">Router Setup</p>
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Save credentials securely
            </h2>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={routerForm.handleSubmit(handleSetup)}
            >
              <input
                type="hidden"
                value="zte-f6600p"
                {...routerForm.register('driver')}
              />
              <div className="space-y-2">
                <Label htmlFor="router-name">Router name</Label>
                <Input id="router-name" {...routerForm.register('name')} />
                {routerForm.formState.errors.name && (
                  <p className="text-xs text-[var(--lagoon-deep)]">
                    {routerForm.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="router-host">Router IP</Label>
                <Input id="router-host" {...routerForm.register('host')} />
              </div>

              <div className="space-y-2">
                <Label htmlFor="router-username">Username</Label>
                <Input
                  id="router-username"
                  {...routerForm.register('username')}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="router-password">Password</Label>
                <Input
                  id="router-password"
                  type="password"
                  {...routerForm.register('password')}
                />
              </div>

              <Button type="submit" disabled={setupMutation.isPending}>
                {setupMutation.isPending ? 'Saving...' : 'Save router'}
              </Button>

              {setupStatus && (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {setupStatus}
                </p>
              )}
            </form>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="island-kicker mb-2">Connected Devices</p>
                <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
                  Active clients on the network
                </h2>
              </div>
              <Badge className="bg-[rgba(79,184,178,0.18)]">
                {devices.length} online
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Device</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead>MAC</TableHead>
                    <TableHead>Connection</TableHead>
                    <TableHead>Signal</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {devices.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={5}>
                        No devices reported yet.
                      </TableCell>
                    </TableRow>
                  ) : (
                    devices.map((device) => (
                      <TableRow key={device.id}>
                        <TableCell>{device.name}</TableCell>
                        <TableCell>{device.ipAddress}</TableCell>
                        <TableCell>{device.macAddress}</TableCell>
                        <TableCell>{device.connectionType}</TableCell>
                        <TableCell>
                          {device.signalStrength !== undefined
                            ? `${device.signalStrength}%`
                            : 'N/A'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-2xl">
          <CardHeader>
            <p className="island-kicker mb-2">WiFi Settings</p>
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Quick edits with Zod validation
            </h2>
          </CardHeader>
          <CardContent>
            <form
              className="space-y-4"
              onSubmit={form.handleSubmit(handleSubmit)}
            >
              <div className="space-y-2">
                <Label htmlFor="ssid">Network name</Label>
                <Input id="ssid" {...form.register('ssid')} />
                {errors.ssid && (
                  <p className="text-xs text-[var(--lagoon-deep)]">
                    {errors.ssid.message}
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  {...form.register('password')}
                />
                {errors.password && (
                  <p className="text-xs text-[var(--lagoon-deep)]">
                    {errors.password.message}
                  </p>
                )}
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="band">Band</Label>
                  <select
                    id="band"
                    className={selectClasses}
                    {...form.register('band')}
                  >
                    <option value="2.4ghz">2.4 GHz</option>
                    <option value="5ghz">5 GHz</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="channel">Channel</Label>
                  <Input
                    id="channel"
                    type="number"
                    min={1}
                    max={165}
                    {...form.register('channel', { valueAsNumber: true })}
                  />
                </div>
              </div>

              <label className="flex items-center gap-3 text-sm text-[var(--sea-ink)]">
                <input
                  type="checkbox"
                  className="h-4 w-4 rounded border-[var(--line)]"
                  {...form.register('enabled')}
                />
                Broadcast this network
              </label>

              <Button type="submit" disabled={wifiMutation.isPending}>
                {wifiMutation.isPending ? 'Sending...' : 'Save settings'}
              </Button>

              {lastSaved && (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  Saved {lastSaved.band.toUpperCase()} {lastSaved.ssid} on
                  channel {lastSaved.channel}.
                </p>
              )}

              {wifiStatus && (
                <p className="text-xs text-[var(--sea-ink-soft)]">
                  {wifiStatus}
                </p>
              )}
            </form>
          </CardContent>
        </Card>
      </section>
    </main>
  )
}
