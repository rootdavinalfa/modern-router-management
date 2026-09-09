import { useState } from 'react'
import { SetupRouterDialog, useActiveRouter } from '../routers'
import { DangerZone } from './danger-zone'
import { RouterList } from './router-list'

function SettingsPage() {
  const [setupDialogOpen, setSetupDialogOpen] = useState(false)
  const {
    routerId,
    activeRouter,
    routers,
    isLoading: storeLoading,
  } = useActiveRouter()

  return (
    <div className="space-y-10">
      <header>
        <h1 className="font-heading text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
          Settings
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage the routers you monitor and device-level actions
        </p>
      </header>

      <RouterList onAddRouter={() => setSetupDialogOpen(true)} />

      <DangerZone
        activeRouter={activeRouter}
        hasRouters={routers.length > 0}
        storeLoading={storeLoading}
        routerId={routerId}
      />

      <SetupRouterDialog
        open={setupDialogOpen}
        onOpenChange={setSetupDialogOpen}
      />
    </div>
  )
}

export default SettingsPage
