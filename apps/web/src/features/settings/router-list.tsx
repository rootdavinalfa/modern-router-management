import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
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
import { Badge } from '@modern-router-management/ui/components/badge'
import { Button } from '@modern-router-management/ui/components/button'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@modern-router-management/ui/components/card'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@modern-router-management/ui/components/dropdown-menu'
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
  EllipsisVerticalIcon,
  PlusIcon,
  RouterIcon,
  Trash2Icon,
} from 'lucide-react'
import { useState } from 'react'
import { toast } from 'sonner'
import { fetchDeleteRouter } from '../../lib/api'
import { routersOptions } from '../../lib/query-options'
import { useActiveRouter } from '../routers'
import type { RouterSummaryDTO } from '@modern-router-management/types/router'

interface RouterListProps {
  /** Opens the add-router setup dialog (owned by the settings page). */
  onAddRouter: () => void
}

export function RouterList({ onAddRouter }: RouterListProps) {
  const routersQuery = useQuery(routersOptions)
  const { routerId } = useActiveRouter()
  const [routerToDelete, setRouterToDelete] = useState<RouterSummaryDTO | null>(
    null,
  )

  const queryClient = useQueryClient()

  const deleteMutation = useMutation({
    mutationFn: (id: number) => fetchDeleteRouter(id),
    onSuccess: (_data, id) => {
      toast.success('Router deleted.')
      setRouterToDelete(null)
      queryClient.invalidateQueries({ queryKey: ['routers'] })
      queryClient.invalidateQueries({ queryKey: ['router', 'active'] })
      // Drop any cached per-router state (status/devices/…) for the row.
      queryClient.removeQueries({
        predicate: (query) =>
          query.queryKey[0] === 'router' && query.queryKey[1] === id,
      })
    },
    onError: (error: Error) => {
      toast.error(
        error instanceof Error ? error.message : 'Unable to delete router.',
      )
      setRouterToDelete(null)
    },
  })

  const routers = routersQuery.data ?? []

  if (routersQuery.isPending) {
    return <RouterListSkeleton />
  }

  if (routersQuery.isError) {
    return (
      <Card className="border-destructive/40">
        <CardHeader>
          <CardTitle>Routers unavailable</CardTitle>
          <CardDescription>{routersQuery.error.message}</CardDescription>
        </CardHeader>
        <CardContent>
          <Button variant="outline" onClick={() => routersQuery.refetch()}>
            Try again
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Routers</CardTitle>
        <CardAction>
          <Button variant="outline" size="sm" onClick={onAddRouter}>
            <PlusIcon aria-hidden="true" />
            Add router
          </Button>
        </CardAction>
        <CardDescription>
          Routers you manage. Deleting a router removes its encrypted
          credentials and connection.
        </CardDescription>
      </CardHeader>

      <CardContent>
        {routers.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10 text-center">
            <RouterIcon className="size-10 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No routers saved yet.
            </p>
            <Button onClick={onAddRouter}>
              <PlusIcon aria-hidden="true" />
              Add your first router
            </Button>
          </div>
        ) : (
          <Table aria-label="Saved routers">
            <RouterListTableHeader />
            <TableBody>
              {routers.map((router) => (
                <RouterRow
                  key={router.id}
                  router={router}
                  isActive={router.id === routerId}
                  onDelete={() => setRouterToDelete(router)}
                />
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <DeleteRouterDialog
        router={routerToDelete}
        isPending={deleteMutation.isPending}
        onCancel={() => setRouterToDelete(null)}
        onConfirm={() => {
          if (routerToDelete !== null) {
            deleteMutation.mutate(routerToDelete.id)
          }
        }}
      />
    </Card>
  )
}

function RouterListTableHeader() {
  return (
    <TableHeader>
      <TableRow>
        <TableHead>Name</TableHead>
        <TableHead>Host</TableHead>
        <TableHead>Driver</TableHead>
        <TableHead>Created</TableHead>
        <TableHead className="w-12">
          <span className="sr-only">Actions</span>
        </TableHead>
      </TableRow>
    </TableHeader>
  )
}

function RouterRow({
  router,
  isActive,
  onDelete,
}: {
  router: RouterSummaryDTO
  isActive: boolean
  onDelete: () => void
}) {
  return (
    <TableRow>
      <TableCell>
        <span className="flex items-center gap-2 font-medium text-foreground">
          {router.name}
          {isActive ? (
            <Badge variant="default" className="uppercase">
              Active
            </Badge>
          ) : null}
        </span>
      </TableCell>
      <TableCell className="font-mono text-xs">{router.host}</TableCell>
      <TableCell className="font-mono text-xs">{router.driver}</TableCell>
      <TableCell className="text-muted-foreground">
        {formatCreatedAt(router.createdAt)}
      </TableCell>
      <TableCell>
        <DropdownMenu>
          <DropdownMenuTrigger
            render={
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Actions for ${router.name}`}
              />
            }
          >
            <EllipsisVerticalIcon className="size-4" aria-hidden="true" />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              variant="destructive"
              closeOnClick={false}
              onClick={onDelete}
            >
              <Trash2Icon aria-hidden="true" />
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </TableCell>
    </TableRow>
  )
}

function DeleteRouterDialog({
  router,
  isPending,
  onCancel,
  onConfirm,
}: {
  router: RouterSummaryDTO | null
  isPending: boolean
  onCancel: () => void
  onConfirm: () => void
}) {
  return (
    <AlertDialog
      open={router !== null}
      onOpenChange={(open) => {
        if (!open && !isPending) {
          onCancel()
        }
      }}
    >
      <AlertDialogContent size="sm">
        <AlertDialogHeader>
          <AlertDialogTitle>Delete router?</AlertDialogTitle>
          <AlertDialogDescription>
            {router !== null ? (
              <>
                <span className="font-medium text-foreground">
                  {router.name}
                </span>{' '}
                and its encrypted credentials and connection will be removed.
                This cannot be undone.
              </>
            ) : null}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={isPending} onClick={onCancel}>
            Cancel
          </AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={isPending}
            onClick={onConfirm}
          >
            {isPending ? 'Deleting…' : 'Delete'}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Skeleton card mirroring the loaded list while the first fetch is pending. */
export function RouterListSkeleton() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Routers</CardTitle>
        <CardAction>
          <Skeleton className="h-9 w-28" />
        </CardAction>
        <CardDescription>Routers you manage.</CardDescription>
      </CardHeader>
      <CardContent>
        <Table aria-label="Saved routers">
          <RouterListTableHeader />
          <TableBody>
            {Array.from({ length: 3 }, (_, index) => (
              <TableRow key={index}>
                <TableCell>
                  <Skeleton className="h-4 w-36" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-24" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-16" />
                </TableCell>
                <TableCell>
                  <Skeleton className="h-4 w-20" />
                </TableCell>
                <TableCell>
                  <Skeleton className="size-9" />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}

/** Absolute date for a router's creation timestamp; passes raw through. */
function formatCreatedAt(value: string): string {
  const time = new Date(value).getTime()
  if (Number.isNaN(time)) {
    return value
  }
  return new Date(time).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}
