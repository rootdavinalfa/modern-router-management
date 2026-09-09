import { cn } from 'cn'
import { Link } from '@tanstack/react-router'
import {
  LayoutDashboardIcon,
  MonitorSmartphoneIcon,
  SettingsIcon,
  WifiIcon,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface AppNavItem {
  to: string
  label: string
  icon: LucideIcon
  /** Dashboard matches only the exact path; nested routes under a section keep its link active. */
  exact?: boolean
}

export const APP_NAV_ITEMS: Array<AppNavItem> = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboardIcon, exact: true },
  { to: '/devices', label: 'Devices', icon: MonitorSmartphoneIcon },
  { to: '/wifi', label: 'WiFi', icon: WifiIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

interface AppNavProps {
  className?: string
  /** Vertical (sheet drawer) vs inline (app bar) layout. */
  orientation?: 'vertical' | 'inline'
  onNavigate?: () => void
}

const itemBaseClass =
  'inline-flex items-center gap-2.5 rounded-sm px-3 py-2 text-sm font-medium tracking-wide text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50 focus-visible:outline-none'

const itemActiveClass = 'bg-muted text-foreground'

export function AppNav({
  className,
  orientation = 'vertical',
  onNavigate,
}: AppNavProps) {
  const inline = orientation === 'inline'

  return (
    <nav
      aria-label="Primary"
      className={cn(
        inline
          ? 'flex items-center gap-1'
          : 'flex flex-col gap-1',
        className
      )}
    >
      {APP_NAV_ITEMS.map((item) => {
        const Icon = item.icon
        return (
          <Link
            key={item.to}
            to={item.to}
            onClick={onNavigate}
            activeOptions={{ exact: item.exact ?? false }}
            activeProps={{ className: itemActiveClass }}
            className={itemBaseClass}
          >
            <Icon className="size-4 shrink-0" aria-hidden="true" />
            {item.label}
          </Link>
        )
      })}
    </nav>
  )
}
