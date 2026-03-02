import { Card, CardContent } from '@modern-router-management/ui'
import type { RouterSummaryDTO } from '@modern-router-management/types/router'

interface RouterSelectorProps {
  routers: RouterSummaryDTO[]
  selectedRouterId: number | null
  onSelectRouter: (routerId: number) => void
}

export function RouterSelector({
  routers,
  selectedRouterId,
  onSelectRouter,
}: RouterSelectorProps) {
  if (routers.length === 0) {
    return null
  }

  return (
    <Card className="rounded-2xl p-4">
      <CardContent>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="island-kicker mb-1">Select Router</p>
            <h2 className="m-0 text-lg font-semibold text-[var(--sea-ink)]">
              Choose a device to manage
            </h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {routers.map((router) => (
              <button
                key={router.id}
                onClick={() => onSelectRouter(router.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${
                  selectedRouterId === router.id
                    ? 'bg-[var(--lagoon)] text-white shadow-lg'
                    : 'bg-[var(--surface-strong)] text-[var(--sea-ink)] hover:bg-[var(--lagoon-soft)]'
                }`}
              >
                {router.name}
              </button>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
