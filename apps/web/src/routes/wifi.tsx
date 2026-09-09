import { createFileRoute } from '@tanstack/react-router'
import { WifiPage } from '../features/wifi'

export const Route = createFileRoute('/wifi')({ component: WifiPage })
