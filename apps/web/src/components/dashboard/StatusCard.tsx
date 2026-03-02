import { Card, CardContent } from '@modern-router-management/ui'

interface StatusCardProps {
  label: string
  value: string
  animationDelay?: number
}

export function StatusCard({
  label,
  value,
  animationDelay = 0,
}: StatusCardProps) {
  return (
    <Card
      className="feature-card rise-in rounded-2xl p-4"
      style={{ animationDelay: `${animationDelay}ms` }}
    >
      <CardContent>
        <p className="island-kicker mb-2">{label}</p>
        <p className="m-0 text-xl font-semibold text-[--sea-ink]">{value}</p>
      </CardContent>
    </Card>
  )
}
