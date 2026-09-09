import { useMutation, useQueryClient } from '@tanstack/react-query'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@modern-router-management/ui/components/alert-dialog'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import { Input } from '@modern-router-management/ui/components/input'
import { PowerIcon, ShieldAlertIcon } from 'lucide-react'
import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import { rebootRouter } from '../../lib/api'
import type { RouterSummaryDTO } from '@modern-router-management/types/router'

const REBOOT_CONFIRM_TEXT = 'REBOOT'

interface DangerZoneProps {
  /** Currently effective router id (stored selection or active fallback). */
  routerId: number | null
  /** Resolved active router, or null while the store is still loading. */
  activeRouter: RouterSummaryDTO | null
  /** True while the routers list is loading (selection unknown). */
  storeLoading: boolean
  /** Whether any router records exist at all. */
  hasRouters: boolean
}

export function DangerZone({
  routerId,
  activeRouter,
  storeLoading,
  hasRouters,
}: DangerZoneProps) {
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [typedText, setTypedText] = useState('')
  const queryClient = useQueryClient()

  // Reset the typed confirmation whenever the dialog (re)opens.
  useEffect(() => {
    if (!confirmOpen) {
      setTypedText('')
    }
  }, [confirmOpen])

  const rebootMutation = useMutation({
    mutationFn: () => rebootRouter(routerId ?? 0),
    onSuccess: () => {
      toast.success('Reboot command sent')
      setConfirmOpen(false)
      // Invalidate every router-scoped query for the rebooted device so the
      // UI reflects its (eventual) reconnection, e.g. the dashboard statuses.
      queryClient.invalidateQueries({
        predicate: (query) =>
          routerId !== null &&
          query.queryKey[0] === 'router' &&
          query.queryKey[1] === routerId,
      })
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof Error ? error.message : 'Unable to send reboot.',
      )
      setConfirmOpen(false)
    },
  })

  const rebootTargetName =
    routerId !== null
      ? (activeRouter?.name ?? `router #${routerId}`)
      : 'the router'

  const rebootDisabled =
    storeLoading || routerId === null || rebootMutation.isPending

  return (
    <Card className="border-destructive/40">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-destructive">
          <ShieldAlertIcon className="size-4" aria-hidden="true" />
          Danger Zone
        </CardTitle>
        <CardDescription>
          Actions that disrupt connectivity for the active router.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center justify-between gap-x-6 gap-y-4">
        <div className="min-w-0">
          <p className="font-medium text-foreground">
            Reboot {rebootTargetName}
          </p>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {storeLoading
              ? 'Loading router state…'
              : routerId === null
                ? hasRouters
                  ? 'Select an active router to enable reboot.'
                  : 'Add a router before you can reboot one.'
                : 'Briefly disconnects the router and its clients.'}
          </p>
        </div>
        <Button
          variant="destructive"
          disabled={rebootDisabled}
          onClick={() => setConfirmOpen(true)}
        >
          <PowerIcon aria-hidden="true" />
          Reboot router
        </Button>
      </CardContent>

      <AlertDialog
        open={confirmOpen}
        onOpenChange={(open) => {
          if (!open && !rebootMutation.isPending) {
            setConfirmOpen(false)
          }
        }}
      >
        <AlertDialogContent size="sm">
          <AlertDialogHeader>
            <AlertDialogTitle>Reboot {rebootTargetName}?</AlertDialogTitle>
            <AlertDialogDescription>
              This will briefly disconnect the router and every connected
              client. Type{' '}
              <span className="font-semibold tracking-widest text-foreground">
                REBOOT
              </span>{' '}
              to confirm.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <Input
            value={typedText}
            onChange={(event) => setTypedText(event.target.value)}
            placeholder="Type REBOOT to confirm"
            autoComplete="off"
            autoFocus
            disabled={rebootMutation.isPending}
          />
          <AlertDialogFooter>
            <AlertDialogCancel
              disabled={rebootMutation.isPending}
              onClick={() => setConfirmOpen(false)}
            >
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={
                typedText !== REBOOT_CONFIRM_TEXT || rebootMutation.isPending
              }
              onClick={() => rebootMutation.mutate()}
            >
              {rebootMutation.isPending ? 'Rebooting…' : 'Reboot router'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  )
}
