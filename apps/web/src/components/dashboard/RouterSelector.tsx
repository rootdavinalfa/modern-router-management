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
    <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[var(--surface-strong)] p-4 shadow-lg">
      <div>
        <p className="island-kicker mb-1 text-sm">Select Router</p>
        <h2 className="m-0 text-base font-semibold text-[var(--sea-ink)]">
          Choose a device to manage
        </h2>
      </div>
      <div className="flex flex-wrap gap-2">
        {routers.map((router) => (
          <button
            key={router.id}
            onClick={() => onSelectRouter(router.id)}
            className={`rounded-xl px-4 py-2 text-sm font-semibold transition-all ${
              selectedRouterId === router.id
                ? 'bg-[var(--lagoon)] text-white shadow-lg ring-2 ring-[var(--lagoon-deep)] ring-offset-2'
                : 'bg-[var(--surface-strong)] text-[var(--sea-ink)] hover:bg-[var(--lagoon-soft)] border border-[var(--line)]'
            }`}
          >
            {router.name}
          </button>
        ))}
      </div>
    </div>
  )
}
