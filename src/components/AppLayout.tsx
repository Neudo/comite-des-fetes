import { NavLink, Outlet } from 'react-router-dom'
import {
  CalendarDays,
  ClipboardList,
  History,
  LayoutDashboard,
  LogOut,
  Package,
  Receipt,
  Tent,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Seo } from '@/components/Seo'
import { Separator } from '@/components/ui/separator'
import { TooltipProvider } from '@/components/ui/tooltip'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

interface NavItem {
  to: string
  label: string
  icon: typeof LayoutDashboard
  end?: boolean
}

const NAV: NavItem[] = [
  { to: '/admin', label: 'Tableau de bord', icon: LayoutDashboard, end: true },
  { to: '/admin/reservations', label: 'Réservations', icon: CalendarDays },
  { to: '/admin/locations', label: 'Locations', icon: ClipboardList },
  { to: '/admin/calendrier', label: 'Calendrier', icon: CalendarDays },
  { to: '/admin/inventaire', label: 'Inventaire', icon: Package },
  { to: '/admin/tarification', label: 'Tarification', icon: Receipt },
  { to: '/admin/historique', label: 'Historique', icon: History },
]

export function AppLayout() {
  const { session, signOut } = useAuth()

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-muted/30">
        <Seo
          title="Administration"
          description="Espace de gestion interne du Comité des Fêtes."
          path="/admin"
          noindex
        />
        <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/75">
          <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4 md:px-6">
            <div className="flex items-center gap-2.5">
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-primary text-primary-foreground">
                <Tent className="h-4 w-4" />
              </div>
              <div className="hidden leading-tight sm:block">
                <div className="text-sm font-semibold">Comité des Fêtes</div>
                <div className="text-[11px] text-muted-foreground">Tannerre-en-Puisaye</div>
              </div>
            </div>

            <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />

            <nav className="flex flex-1 items-center gap-0.5 overflow-x-auto">
              {NAV.map(({ to, label, icon: Icon, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    cn(
                      'inline-flex items-center gap-2 whitespace-nowrap rounded-md px-3 py-1.5 text-sm font-medium transition-colors',
                      'text-muted-foreground hover:bg-muted hover:text-foreground',
                      isActive && 'bg-muted text-foreground',
                    )
                  }
                >
                  <Icon className="h-4 w-4" />
                  <span className="hidden md:inline">{label}</span>
                </NavLink>
              ))}
            </nav>

            <div className="hidden text-xs text-muted-foreground lg:block">
              {session?.user.email}
            </div>
            <Button variant="ghost" size="icon-sm" onClick={signOut} title="Déconnexion">
              <LogOut className="h-4 w-4" />
              <span className="sr-only">Déconnexion</span>
            </Button>
          </div>
        </header>

        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          <Outlet />
        </main>
      </div>
    </TooltipProvider>
  )
}
