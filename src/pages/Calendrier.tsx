import { useMemo, useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { useLocations } from '@/hooks/useLocations'
import { useReservations } from '@/hooks/useReservations'
import { cn } from '@/lib/utils'
import type { Location, Reservation } from '@/types/database'

const MOIS_FR = [
  'Janvier',
  'Février',
  'Mars',
  'Avril',
  'Mai',
  'Juin',
  'Juillet',
  'Août',
  'Septembre',
  'Octobre',
  'Novembre',
  'Décembre',
]
const JOURS_FR = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim']

interface DayCell {
  date: Date
  iso: string
  inMonth: boolean
  isToday: boolean
  locs: Location[]
  resas: Reservation[]
}

function isoOf(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function buildMonth(year: number, month: number, locations: Location[], reservations: Reservation[]): DayCell[] {
  const first = new Date(year, month, 1)
  const offset = (first.getDay() + 6) % 7 // semaine commence lundi
  const nbJours = new Date(year, month + 1, 0).getDate()
  const todayIso = isoOf(new Date())

  const cells: DayCell[] = []
  // Cells before the 1st (previous month)
  for (let i = offset - 1; i >= 0; i--) {
    const d = new Date(year, month, -i)
    cells.push({
      date: d,
      iso: isoOf(d),
      inMonth: false,
      isToday: false,
      locs: [],
      resas: [],
    })
  }
  // Cells of the current month
  for (let i = 1; i <= nbJours; i++) {
    const d = new Date(year, month, i)
    const iso = isoOf(d)
    const locs = locations.filter(
      (l) => iso >= l.date_retrait && iso <= (l.date_prev_retour ?? l.date_retrait),
    )
    const resas = reservations.filter((r) => iso >= r.date_debut && iso <= r.date_fin)
    cells.push({
      date: d,
      iso,
      inMonth: true,
      isToday: iso === todayIso,
      locs,
      resas,
    })
  }
  // Pad to fill rows of 7
  while (cells.length % 7 !== 0) {
    const last = cells[cells.length - 1]!.date
    const d = new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1)
    cells.push({
      date: d,
      iso: isoOf(d),
      inMonth: false,
      isToday: false,
      locs: [],
      resas: [],
    })
  }
  return cells
}

export function CalendrierPage() {
  const { data: locations = [] } = useLocations()
  const { data: reservations = [] } = useReservations()
  const [cursor, setCursor] = useState(() => new Date())

  const cells = useMemo(
    () => buildMonth(cursor.getFullYear(), cursor.getMonth(), locations, reservations),
    [cursor, locations, reservations],
  )

  function shift(delta: number) {
    setCursor((c) => new Date(c.getFullYear(), c.getMonth() + delta, 1))
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <Button variant="outline" size="icon-sm" onClick={() => shift(-1)}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-base">
            📅 {MOIS_FR[cursor.getMonth()]} {cursor.getFullYear()}
          </span>
          <Button variant="outline" size="icon-sm" onClick={() => shift(1)}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-3 flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-blue-200" />
            Location réelle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm bg-violet-200" />
            Réservation prévisionnelle
          </span>
          <span className="flex items-center gap-1.5">
            <span className="inline-block h-3 w-3 rounded-sm border-2 border-primary" />
            Aujourd'hui
          </span>
        </div>

        <div className="grid grid-cols-7 gap-1 text-xs">
          {JOURS_FR.map((j) => (
            <div
              key={j}
              className="rounded-md bg-muted/40 py-1 text-center text-[11px] font-semibold uppercase text-muted-foreground"
            >
              {j}
            </div>
          ))}
          {cells.map((c, i) => {
            const has = (c.locs.length > 0 ? 1 : 0) + (c.resas.length > 0 ? 1 : 0)
            return (
              <div
                key={`${c.iso}-${i}`}
                className={cn(
                  'min-h-[80px] rounded-md border p-1.5',
                  !c.inMonth && 'opacity-40',
                  c.isToday && 'border-primary ring-1 ring-primary/40',
                  has === 0 && 'bg-background',
                  c.locs.length && !c.resas.length && 'bg-blue-50',
                  !c.locs.length && c.resas.length && 'bg-violet-50',
                  c.locs.length && c.resas.length && 'bg-gradient-to-br from-blue-50 to-violet-50',
                )}
              >
                <div className="mb-1 text-[11px] font-bold">{c.date.getDate()}</div>
                <div className="space-y-0.5">
                  {c.locs.slice(0, 3).map((l) => (
                    <div
                      key={`L${l.id}`}
                      title={`${l.nom}${l.evenement ? ` — ${l.evenement}` : ''}`}
                      className="truncate rounded-sm bg-blue-200/70 px-1 py-0.5 text-[10px] text-blue-900"
                    >
                      📋 {l.nom}
                    </div>
                  ))}
                  {c.resas.slice(0, 3).map((r) => (
                    <div
                      key={`R${r.id}`}
                      title={`${r.nom}${r.evenement ? ` — ${r.evenement}` : ''}`}
                      className="truncate rounded-sm bg-violet-200/70 px-1 py-0.5 text-[10px] text-violet-900"
                    >
                      🗓️ {r.nom}
                    </div>
                  ))}
                  {c.locs.length + c.resas.length > 6 && (
                    <div className="text-[10px] text-muted-foreground">
                      + {c.locs.length + c.resas.length - 6}…
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
