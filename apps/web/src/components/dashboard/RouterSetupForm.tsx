import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import {
  routerCreateSchema,
  type RouterCreateDTO,
} from '@modern-router-management/types/router'
import {
  Button,
  Card,
  CardContent,
  CardHeader,
  Input,
  Label,
} from '@modern-router-management/ui'

interface RouterSetupFormProps {
  onSubmit: (values: RouterCreateDTO) => void
  isPending: boolean
  status?: string | null
}

export function RouterSetupForm({
  onSubmit,
  isPending,
  status,
}: RouterSetupFormProps) {
  const form = useForm<RouterCreateDTO>({
    resolver: zodResolver(routerCreateSchema),
    defaultValues: {
      name: 'Home Router',
      host: '192.168.1.1',
      driver: 'zte-f6600p',
      username: 'admin',
      password: '',
    },
  })

  const errors = form.formState.errors

  return (
    <Card className="rounded-2xl p-4">
      <CardHeader>
        <p className="island-kicker mb-2">Router Setup</p>
        <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
          Save credentials securely
        </h2>
      </CardHeader>
      <CardContent>
        <form className="space-y-4" onSubmit={form.handleSubmit(onSubmit)}>
          <input
            type="hidden"
            value="zte-f6600p"
            {...form.register('driver')}
          />
          <div className="space-y-2">
            <Label htmlFor="router-name">Router name</Label>
            <Input id="router-name" {...form.register('name')} />
            {errors.name && (
              <p className="text-xs text-[var(--lagoon-deep)]">
                {errors.name.message}
              </p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-host">Router IP</Label>
            <Input id="router-host" {...form.register('host')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-username">Username</Label>
            <Input id="router-username" {...form.register('username')} />
          </div>

          <div className="space-y-2">
            <Label htmlFor="router-password">Password</Label>
            <Input
              id="router-password"
              type="password"
              {...form.register('password')}
            />
          </div>

          <Button type="submit" disabled={isPending}>
            {isPending ? 'Saving...' : 'Save router'}
          </Button>

          {status && (
            <p className="text-xs text-[var(--sea-ink-soft)]">{status}</p>
          )}
        </form>
      </CardContent>
    </Card>
  )
}
