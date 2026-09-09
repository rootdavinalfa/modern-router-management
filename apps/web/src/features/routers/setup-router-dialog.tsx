import { zodResolver } from '@hookform/resolvers/zod'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@modern-router-management/ui/components/dialog'
import { Input } from '@modern-router-management/ui/components/input'
import { Label } from '@modern-router-management/ui/components/label'
import { routerCreateSchema } from '@modern-router-management/types/router'
import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { toast } from 'sonner'
import { createRouter } from '../../lib/api'
import type { z } from 'zod'
import type { RouterCreateDTO } from '@modern-router-management/types/router'

type RouterCreateInput = z.input<typeof routerCreateSchema>

interface SetupRouterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function SetupRouterDialog({
  open,
  onOpenChange,
}: SetupRouterDialogProps) {
  const queryClient = useQueryClient()

  const form = useForm<RouterCreateInput, unknown, RouterCreateDTO>({
    resolver: zodResolver(routerCreateSchema),
    defaultValues: {
      name: 'Home Router',
      host: '192.168.1.1',
      driver: 'zte-f6600p',
      username: 'admin',
      password: '',
    },
  })

  // Start each open with a clean form (drop stale values/errors).
  useEffect(() => {
    if (open) {
      form.reset()
    }
  }, [open, form])

  const errors = form.formState.errors

  const setupMutation = useMutation({
    mutationFn: createRouter,
    onSuccess: () => {
      toast.success('Router saved securely.')
      queryClient.invalidateQueries({ queryKey: ['routers'] })
      queryClient.invalidateQueries({ queryKey: ['router', 'active'] })
      onOpenChange(false)
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof Error ? error.message : 'Unable to save router.',
      )
    },
  })

  const onSubmit = (values: RouterCreateDTO) => {
    setupMutation.mutate(values)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Add router</DialogTitle>
          <DialogDescription>
            Save the credentials for a router you manage.
          </DialogDescription>
        </DialogHeader>

        <form
          id="setup-router-form"
          className="space-y-5"
          onSubmit={form.handleSubmit(onSubmit)}
        >
          <input
            type="hidden"
            value="zte-f6600p"
            {...form.register('driver')}
          />

          <div className="space-y-2">
            <Label htmlFor="router-name">Router name</Label>
            <Input id="router-name" {...form.register('name')} />
            {errors.name?.message && (
              <p className="text-sm text-destructive">{errors.name.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-host">Router IP</Label>
            <Input id="router-host" {...form.register('host')} />
            {errors.host?.message && (
              <p className="text-sm text-destructive">{errors.host.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-username">Username</Label>
            <Input id="router-username" {...form.register('username')} />
            {errors.username?.message && (
              <p className="text-sm text-destructive">
                {errors.username.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-password">Password</Label>
            <Input
              id="router-password"
              type="password"
              {...form.register('password')}
            />
            {errors.password?.message && (
              <p className="text-sm text-destructive">
                {errors.password.message}
              </p>
            )}
          </div>
        </form>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            type="submit"
            form="setup-router-form"
            disabled={setupMutation.isPending}
          >
            {setupMutation.isPending ? 'Saving…' : 'Save router'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
