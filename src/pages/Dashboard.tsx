import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, CheckCircle2 } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLocations } from '@/hooks/useLocations'
import { useReservations } from '@/hooks/useReservations'
import { STOCK } from '@/lib/pricing'
import { disponibilitePeriode } from '@/lib/stock'
import { fmtDate } from '@/lib/dates'
import { cn } from '@/lib/utils'

interface ConflitRow {
  id: string
  nom: string
  debut: string
  fin: string
  tables: number
  tente_marron: number
  tente_blanche: number
  src: 'reservation' | 'location'
}

export function DashboardPage() {
  const { data: locations = [] } = useLocations()
  const { data: reservations = [] } = useReservations()

  const actives = useMemo(() => locations.filter((l) => !l.date_retour), [locations])
  const tablesEnc = actives.reduce((s, l) => s + l.tables, 0)
  const marronEnc = actives.reduce((s, l) => s + l.tente_marron, 0)
  const blancheEnc = actives.reduce((s, l) => s + l.tente_blanche, 0)

  const conflits = useMemo<ConflitRow[]>(() => {
    const items: ConflitRow[] = []
    for (const r of reservations) {
      const dispo = disponibilitePeriode(r.date_debut, r.date_fin, locations, reservations, {
        kind: 'reservation',
        id: r.id,
      })
      if (
        r.tables > dispo.tables ||
        r.tente_marron > dispo.tente_marron ||
        r.tente_blanche > dispo.tente_blanche
      ) {
        items.push({
          id: r.id,
          nom: r.nom,
          debut: r.date_debut,
          fin: r.date_fin,
          tables: r.tables,
          tente_marron: r.tente_marron,
          tente_blanche: r.tente_blanche,
          src: 'reservation',
        })
      }
    }
    for (const l of actives) {
      const fin = l.date_prev_retour ?? l.date_retrait
      const dispo = disponibilitePeriode(l.date_retrait, fin, locations, reservations, {
        kind: 'location',
        id: l.id,
      })
      if (
        l.tables > dispo.tables ||
        l.tente_marron > dispo.tente_marron ||
        l.tente_blanche > dispo.tente_blanche
      ) {
        items.push({
          id: l.id,
          nom: l.nom,
          debut: l.date_retrait,
          fin,
          tables: l.tables,
          tente_marron: l.tente_marron,
          tente_blanche: l.tente_blanche,
          src: 'location',
        })
      }
    }
    return items
  }, [actives, locations, reservations])

  return (
    <div className="grid gap-4">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat label="📋 Locations en cours" value={actives.length} tone="ok" />
        <Stat label="🗓️ Réservations prév." value={reservations.length} tone="violet" />
        <Stat
          label="🪑 Tables dispo"
          value={`${STOCK.tables - tablesEnc}/${STOCK.tables}`}
          tone={STOCK.tables - tablesEnc === 0 ? 'danger' : 'ok'}
        />
        <Stat
          label="🏕️ Tentes marron"
          value={`${STOCK.tente_marron - marronEnc}/${STOCK.tente_marron}`}
          tone={STOCK.tente_marron - marronEnc === 0 ? 'danger' : 'warn'}
        />
        <Stat
          label="⛺ Tente blanche"
          value={`${STOCK.tente_blanche - blancheEnc}/${STOCK.tente_blanche}`}
          tone={STOCK.tente_blanche - blancheEnc === 0 ? 'danger' : 'ok'}
        />
        <Stat
          label="⚠️ Conflits stock"
          value={conflits.length}
          tone={conflits.length ? 'danger' : 'ok'}
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>📋 Locations en cours</span>
              <Link to="/locations" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {actives.length === 0 ? (
              <Empty msg="Aucune location en cours." />
            ) : (
              <MiniTable
                rows={actives.slice(0, 5).map((l) => ({
                  id: l.id,
                  nom: l.nom,
                  debut: l.date_retrait,
                  fin: l.date_prev_retour,
                  tables: l.tables,
                }))}
                more={actives.length - 5}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>🗓️ Réservations prévisionnelles</span>
              <Link to="/reservations" className="text-xs text-primary hover:underline">
                Voir tout →
              </Link>
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reservations.length === 0 ? (
              <Empty msg="Aucune réservation." />
            ) : (
              <MiniTable
                rows={reservations.slice(0, 5).map((r) => ({
                  id: r.id,
                  nom: r.nom,
                  debut: r.date_debut,
                  fin: r.date_fin,
                  tables: r.tables,
                }))}
                more={reservations.length - 5}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>⚠️ Conflits de stock</CardTitle>
        </CardHeader>
        <CardContent>
          {conflits.length === 0 ? (
            <div className="flex items-center gap-2 rounded-md border-l-4 border-emerald-400 bg-emerald-50 px-4 py-3 text-sm text-emerald-900">
              <CheckCircle2 className="h-4 w-4" /> Aucun conflit de stock détecté.
            </div>
          ) : (
            <>
              <div className="mb-3 flex items-center gap-2 rounded-md border-l-4 border-rose-400 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                <AlertTriangle className="h-4 w-4" /> {conflits.length} conflit
                {conflits.length > 1 ? 's' : ''} détecté{conflits.length > 1 ? 's' : ''} —
                vérifiez le calendrier.
              </div>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N°</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Début</TableHead>
                    <TableHead>Fin</TableHead>
                    <TableHead className="text-right">Tables</TableHead>
                    <TableHead className="text-right">T.Marron</TableHead>
                    <TableHead className="text-right">T.Blanche</TableHead>
                    <TableHead>Source</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conflits.map((c) => (
                    <TableRow key={`${c.src}-${c.id}`} className="bg-amber-50/50">
                      <TableCell className="font-semibold">{c.id}</TableCell>
                      <TableCell>{c.nom}</TableCell>
                      <TableCell>{fmtDate(c.debut)}</TableCell>
                      <TableCell>{fmtDate(c.fin)}</TableCell>
                      <TableCell className="text-right">{c.tables}</TableCell>
                      <TableCell className="text-right">{c.tente_marron}</TableCell>
                      <TableCell className="text-right">{c.tente_blanche}</TableCell>
                      <TableCell>
                        <Badge variant={c.src === 'reservation' ? 'default' : 'enc'}>
                          {c.src === 'reservation' ? 'Réservation' : 'Location'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

interface StatProps {
  label: string
  value: number | string
  tone: 'ok' | 'warn' | 'danger' | 'violet'
}

function Stat({ label, value, tone }: StatProps) {
  const toneCls = {
    ok: 'border-emerald-500 text-emerald-600',
    warn: 'border-amber-500 text-amber-600',
    danger: 'border-rose-500 text-rose-600',
    violet: 'border-violet-500 text-violet-600',
  }[tone]
  return (
    <div className={cn('rounded-xl border-l-4 bg-card px-4 py-3 shadow-sm', toneCls)}>
      <div className={cn('text-2xl font-bold', toneCls.split(' ')[1])}>{value}</div>
      <div className="text-xs text-muted-foreground">{label}</div>
    </div>
  )
}

function Empty({ msg }: { msg: string }) {
  return (
    <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
      {msg}
    </div>
  )
}

interface MiniRow {
  id: string
  nom: string
  debut: string
  fin: string | null
  tables: number
}

function MiniTable({ rows, more }: { rows: MiniRow[]; more: number }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>N°</TableHead>
          <TableHead>Nom</TableHead>
          <TableHead>Début</TableHead>
          <TableHead>Fin</TableHead>
          <TableHead className="text-right">Tables</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {rows.map((r) => (
          <TableRow key={r.id}>
            <TableCell className="font-semibold">{r.id}</TableCell>
            <TableCell>{r.nom}</TableCell>
            <TableCell>{fmtDate(r.debut)}</TableCell>
            <TableCell>{fmtDate(r.fin)}</TableCell>
            <TableCell className="text-right">{r.tables}</TableCell>
          </TableRow>
        ))}
        {more > 0 && (
          <TableRow>
            <TableCell colSpan={5} className="text-center text-xs text-muted-foreground">
              + {more} autre{more > 1 ? 's' : ''}…
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  )
}
