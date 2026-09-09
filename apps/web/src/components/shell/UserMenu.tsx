import { Avatar, AvatarFallback, AvatarImage } from '@modern-router-management/ui/components/avatar'
import { Button } from '@modern-router-management/ui/components/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@modern-router-management/ui/components/dropdown-menu'
import { Skeleton } from '@modern-router-management/ui/components/skeleton'
import { Link } from '@tanstack/react-router'
import { LogOutIcon } from 'lucide-react'
import { authClient } from '#/lib/auth-client'

function getInitial(name: string | null | undefined): string {
  return name?.trim().charAt(0).toUpperCase() || 'U'
}

export function UserMenu() {
  const { data: session, isPending } = authClient.useSession()
  const user = session?.user

  if (isPending) {
    return <Skeleton className="size-9 rounded-full" />
  }

  if (!user) {
    return (
      <Button variant="ghost" size="sm" render={<Link to="/" />}>
        Sign in
      </Button>
    )
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button variant="ghost" size="icon-sm" aria-label="Account menu" />
        }
      >
        <Avatar className="size-8">
          {user.image ? <AvatarImage src={user.image} alt="" /> : null}
          <AvatarFallback>{getInitial(user.name)}</AvatarFallback>
        </Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-56">
        <DropdownMenuLabel className="normal-case">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">
              {user.name}
            </span>
            {user.email ? (
              <span className="truncate font-normal text-muted-foreground">
                {user.email}
              </span>
            ) : null}
          </div>
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          variant="destructive"
          onClick={() => {
            void authClient.signOut()
          }}
        >
          <LogOutIcon aria-hidden="true" />
          Sign out
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
