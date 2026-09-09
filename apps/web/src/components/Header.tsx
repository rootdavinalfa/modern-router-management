import { Button } from '@modern-router-management/ui/components/button'
import {
  Sheet,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@modern-router-management/ui/components/sheet'
import { Link } from '@tanstack/react-router'
import { MenuIcon, RouterIcon } from 'lucide-react'
import { useState } from 'react'
import ThemeToggle from './ThemeToggle'
import { AppNav } from './shell/AppNav'
import { UserMenu } from './shell/UserMenu'

export default function Header() {
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <header className="sticky top-0 z-40 border-b bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-14 w-full max-w-7xl items-center gap-3 px-4 sm:px-6">
        {/* Mobile drawer trigger */}
        <Sheet open={drawerOpen} onOpenChange={setDrawerOpen}>
          <SheetTrigger
            render={
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden"
                aria-label="Open navigation menu"
              />
            }
          >
            <MenuIcon className="size-5" aria-hidden="true" />
          </SheetTrigger>
          <SheetContent side="left" className="w-72">
            <SheetHeader>
              <SheetTitle
                render={
                  <Link
                    to="/"
                    className="inline-flex items-center gap-2"
                    onClick={() => setDrawerOpen(false)}
                  />
                }
              >
                <RouterIcon className="size-5" aria-hidden="true" />
                Router-Core
              </SheetTitle>
            </SheetHeader>
            <div className="px-2">
              <AppNav
                orientation="vertical"
                onNavigate={() => setDrawerOpen(false)}
              />
            </div>
            <SheetFooter>
              <ThemeToggle />
            </SheetFooter>
          </SheetContent>
        </Sheet>

        {/* Brand */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm font-semibold tracking-tight"
        >
          <RouterIcon className="size-5" aria-hidden="true" />
          <span className="hidden sm:inline">Router-Core</span>
          <span className="sm:hidden">RC</span>
        </Link>

        {/* Desktop inline nav */}
        <AppNav orientation="inline" className="ml-6 hidden md:flex" />

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1">
          <ThemeToggle />
          <UserMenu />
        </div>
      </div>
    </header>
  )
}
