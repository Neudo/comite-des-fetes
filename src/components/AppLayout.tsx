import { NavLink, Outlet } from 'react-router-dom'
import { LogOut } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { useAuth } from '@/hooks/useAuth'
import { cn } from '@/lib/utils'

const NAV = [
  { to: '/', label: '📊 Tableau de bord', end: true },
  { to: '/reservations', label: '🗓️ Réservations' },
  { to: '/locations', label: '📋 Locations' },
  { to: '/calendrier', label: '📅 Calendrier' },
  { to: '/inventaire', label: '📦 Inventaire' },
  { to: '/tarification', label: '💶 Tarification' },
  { to: '/historique', label: '🗂️ Historique' },
]

export function AppLayout() {
  const { session, signOut } = useAuth()

  return (
    <div className="min-h-screen bg-muted/30">
      <header className="bg-gradient-to-r from-blue-600 to-blue-800 text-white shadow-md">
        <div className="max-w-7xl mx-auto px-6 py-3 flex items-center gap-3">
          <span className="text-2xl">🎪</span>
          <div className="flex-1">
            <h1 className="text-base font-semibold leading-tight">
              Comité des Fêtes — Gestion Location Matériel
            </h1>
            <p className="text-xs opacity-80">Tannerre-en-Puisaye</p>
          </div>
          <div className="text-xs opacity-90 hidden sm:block">{session?.user.email}</div>
          <Button
            variant="ghost"
            size="sm"
            onClick={signOut}
            className="text-white hover:bg-white/15 hover:text-white"
          >
            <LogOut className="h-4 w-4" />
            <span className="hidden sm:inline">Déconnexion</span>
          </Button>
        </div>
      </header>

      <nav className="bg-background border-b">
        <div className="max-w-7xl mx-auto px-4 flex gap-1 overflow-x-auto">
          {NAV.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                cn(
                  'px-4 py-3 text-sm whitespace-nowrap border-b-2 border-transparent transition-colors',
                  'text-muted-foreground hover:text-foreground',
                  isActive && 'text-primary border-primary font-semibold',
                )
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>
      </nav>

      <main className="max-w-7xl mx-auto p-4 md:p-6">
        <Outlet />
      </main>
    </div>
  )
}
