import { Card, CardContent } from '@modern-router-management/ui'
import { WANConnectionCard } from './WANConnectionCard'
import type { WanConnection } from '../../lib/api'

interface WANConnectionsProps {
  connections: WanConnection[]
}

export function WANConnections({ connections }: WANConnectionsProps) {
  return (
    <div className="mt-6">
      <h3 className="mb-4 text-lg font-semibold text-[var(--sea-ink)]">
        WAN Connections
      </h3>
      <div className="space-y-4">
        {connections.length === 0 ? (
          <Card className="rise-in rounded-2xl p-4">
            <CardContent>
              <p className="text-sm text-[var(--sea-ink-soft)]">
                No WAN connections available.
              </p>
            </CardContent>
          </Card>
        ) : (
          connections.map((connection, index) => (
            <WANConnectionCard
              key={`${connection.name}-${index}`}
              connection={connection}
              index={index}
            />
          ))
        )}
      </div>
    </div>
  )
}
