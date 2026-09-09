import { zodResolver } from '@hookform/resolvers/zod'
import { Button } from '@modern-router-management/ui/components/button'
import { Card, CardContent } from '@modern-router-management/ui/components/card'
import { Input } from '@modern-router-management/ui/components/input'
import { Label } from '@modern-router-management/ui/components/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@modern-router-management/ui/components/select'
import { Separator } from '@modern-router-management/ui/components/separator'
import { Switch } from '@modern-router-management/ui/components/switch'
import { wifiConfigSchema } from '@modern-router-management/types/router'
import { EyeIcon, EyeOffIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import type { z } from 'zod'

type WifiFormValues = z.input<typeof wifiConfigSchema>

const BAND_LABEL: Record<'2.4ghz' | '5ghz', string> = {
  '2.4ghz': '2.4 GHz',
  '5ghz': '5 GHz',
}

/** Channels the ZTE F6600P exposes on each band's basic-config select. */
export const CHANNELS_BY_BAND: Record<'2.4ghz' | '5ghz', Array<number>> = {
  '2.4ghz': [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11],
  '5ghz': [36, 40, 44, 48, 149, 153, 157, 161, 165],
}

export interface WifiBandFormProps {
  band: '2.4ghz' | '5ghz'
  /** Values the router reported for this band (null when it did not report one). */
  current: {
    enabled: boolean
    ssid: string
    channel?: number
    security?: string
  } | null
  /** True while a save for this band is in flight. */
  isSaving: boolean
  /** True while any band's save is in flight (disables this form's submit). */
  isAnySaving: boolean
  /** Error from the last save attempt, if any. */
  errorMessage: string | null
  onSubmit: (values: WifiFormValues) => void
}

export function WifiBandForm({
  band,
  current,
  isSaving,
  isAnySaving,
  errorMessage,
  onSubmit,
}: WifiBandFormProps) {
  const form = useForm<WifiFormValues>({
    resolver: zodResolver(wifiConfigSchema),
    defaultValues: {
      band,
      enabled: current?.enabled ?? false,
      ssid: current?.ssid ?? '',
      channel: current?.channel ?? CHANNELS_BY_BAND[band][0],
      password: '',
    },
  })

  // Reset only when the router-reported values actually change. `current` is a
  // fresh object every parent render (background refetches included), so
  // primitive deps prevent refetches from wiping the user's in-progress edits
  // (the password especially — it is never re-seeded from the router).
  const { reset } = form
  const reportedEnabled = current?.enabled ?? false
  const reportedSsid = current?.ssid ?? ''
  const reportedChannel = current?.channel ?? CHANNELS_BY_BAND[band][0]
  useEffect(() => {
    reset({
      band,
      enabled: reportedEnabled,
      ssid: reportedSsid,
      channel: reportedChannel,
      password: '',
    })
  }, [band, reportedEnabled, reportedSsid, reportedChannel, reset])

  const errors = form.formState.errors
  const security = current?.security ?? 'WPA2-PSK'
  const passwordRelevant = security !== 'No Security'
  const [showPassword, setShowPassword] = useState(false)

  return (
    <Card>
      <CardContent className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-4">
            <div className="space-y-1">
              <p className="font-heading text-base font-semibold tracking-wider uppercase">
                {BAND_LABEL[band]} radio
              </p>
              <p className="text-xs text-muted-foreground">
                Current values from router
              </p>
            </div>
            <div className="flex items-center gap-2">
              <Label htmlFor={`enabled-${band}`}>Enabled</Label>
              <Switch
                id={`enabled-${band}`}
                checked={form.watch('enabled')}
                onCheckedChange={(checked) => form.setValue('enabled', checked)}
              />
            </div>
          </div>

          <Separator className="my-4" />

          {current === null ? (
            <p className="text-xs text-muted-foreground">
              Router did not report this band — settings may not apply.
            </p>
          ) : null}
        </div>

        <form
          id={`wifi-form-${band}`}
          className="space-y-5"
          onSubmit={form.handleSubmit((values) => onSubmit(values))}
        >
          <input type="hidden" value={band} {...form.register('band')} />

          <div className="space-y-2">
            <Label htmlFor={`ssid-${band}`}>Network name (SSID)</Label>
            <Input
              id={`ssid-${band}`}
              placeholder={
                current === null ? 'SSID' : `Current: ${current.ssid}`
              }
              {...form.register('ssid')}
            />
            {errors.ssid?.message ? (
              <p className="text-sm text-destructive">{errors.ssid.message}</p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label>Security</Label>
            <Select value={security} disabled>
              <SelectTrigger className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={security}>{security}</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Reported by the router — the security mode is read-only here.
            </p>
          </div>

          {passwordRelevant ? (
            <div className="space-y-2">
              <Label htmlFor={`password-${band}`}>Password</Label>
              <div className="relative">
                <Input
                  id={`password-${band}`}
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  placeholder="New password (min. 8 characters)"
                  className="pr-10"
                  aria-invalid={errors.password ? true : undefined}
                  {...form.register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-xs"
                  className="absolute inset-y-0 right-0 my-auto"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  title={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                >
                  {showPassword ? (
                    <EyeOffIcon className="size-4" aria-hidden="true" />
                  ) : (
                    <EyeIcon className="size-4" aria-hidden="true" />
                  )}
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Write-only: the router never returns it. Required to apply
                changes.
              </p>
              {errors.password?.message ? (
                <p className="text-sm text-destructive">
                  {errors.password.message}
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">
              This network has no password — SSID and channel changes cannot be
              applied until the security mode supports one.
            </p>
          )}

          <div className="space-y-2">
            <Label htmlFor={`channel-${band}`}>Channel</Label>
            <Select
              value={String(form.watch('channel'))}
              onValueChange={(value) => form.setValue('channel', Number(value))}
            >
              <SelectTrigger id={`channel-${band}`} className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {CHANNELS_BY_BAND[band].map((channel) => (
                  <SelectItem key={channel} value={String(channel)}>
                    {channel}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {errors.channel?.message ? (
              <p className="text-sm text-destructive">
                {errors.channel.message}
              </p>
            ) : null}
          </div>

          <div className="flex items-center justify-between gap-4 pt-2">
            {errorMessage ? (
              <p className="text-sm text-destructive">{errorMessage}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Changing the channel or band state can briefly interrupt
                wireless clients.
              </p>
            )}
            <Button
              type="submit"
              disabled={!passwordRelevant || isAnySaving}
              className="shrink-0"
            >
              {isSaving ? 'Applying…' : 'Apply settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  )
}
