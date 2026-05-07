import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle,
  ArmchairIcon,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  LayoutDashboard,
  Tent,
  TentTree,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { useLocations } from '@/hooks/useLocations'
import { useReservations } from '@/hooks/useReservations'
import { STOCK } from '@/lib/pricing'
import { disponibilitePeriode } from '@/lib/stock'
import { fmtDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { ComponentType } from 'react'

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
    <>
      <PageHeader
        title="Tableau de bord"
        description="Aperçu des locations en cours, réservations et conflits"
        icon={<LayoutDashboard className="h-5 w-5" />}
      />

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
        <Stat
          label="Locations en cours"
          value={actives.length}
          icon={ClipboardList}
          tone="default"
        />
        <Stat
          label="Réservations"
          value={reservations.length}
          icon={CalendarDays}
          tone="default"
        />
        <Stat
          label="Tables dispo"
          value={`${STOCK.tables - tablesEnc}/${STOCK.tables}`}
          icon={ArmchairIcon}
          tone={STOCK.tables - tablesEnc === 0 ? 'danger' : 'default'}
        />
        <Stat
          label="Tentes marron"
          value={`${STOCK.tente_marron - marronEnc}/${STOCK.tente_marron}`}
          icon={Tent}
          tone={STOCK.tente_marron - marronEnc === 0 ? 'danger' : 'default'}
        />
        <Stat
          label="Tente blanche"
          value={`${STOCK.tente_blanche - blancheEnc}/${STOCK.tente_blanche}`}
          icon={TentTree}
          tone={STOCK.tente_blanche - blancheEnc === 0 ? 'danger' : 'default'}
        />
        <Stat
          label="Conflits stock"
          value={conflits.length}
          icon={conflits.length ? AlertTriangle : CheckCircle2}
          tone={conflits.length ? 'warn' : 'success'}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-4">
            <CardTitle className="text-base">Locations en cours</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/locations">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {actives.length === 0 ? (
              <EmptyState
                className="m-4"
                icon={<ClipboardList className="h-5 w-5" />}
                title="Aucune location en cours"
              />
            ) : (
              <MiniTable
                rows={actives.slice(0, 5).map((l) => ({
                  id: l.id,
                  nom: l.nom,
                  debut: l.date_retrait,
                  fin: l.date_prev_retour,
                  qty: l.tables,
                }))}
                more={actives.length - 5}
              />
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-4">
            <CardTitle className="text-base">Réservations à venir</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/reservations">Voir tout</Link>
            </Button>
          </CardHeader>
          <CardContent className="p-0">
            {reservations.length === 0 ? (
              <EmptyState
                className="m-4"
                icon={<CalendarDays className="h-5 w-5" />}
                title="Aucune réservation"
              />
            ) : (
              <MiniTable
                rows={reservations.slice(0, 5).map((r) => ({
                  id: r.id,
                  nom: r.nom,
                  debut: r.date_debut,
                  fin: r.date_fin,
                  qty: r.tables,
                }))}
                more={reservations.length - 5}
              />
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="mt-4">
        <CardHeader className="py-4">
          <CardTitle className="flex items-center gap-2 text-base">
            {conflits.length === 0 ? (
              <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            ) : (
              <AlertTriangle className="h-4 w-4 text-amber-600" />
            )}
            Conflits de stock
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {conflits.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              title="Aucun conflit détecté"
              description="Le stock est suffisant pour toutes les locations et réservations en cours."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">T.Marron</TableHead>
                  <TableHead className="text-right">T.Blanche</TableHead>
                  <TableHead>Source</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {conflits.map((c) => (
                  <TableRow key={`${c.src}-${c.id}`} className="bg-amber-50/40">
                    <TableCell className="font-mono text-xs font-medium">{c.id}</TableCell>
                    <TableCell className="font-medium">{c.nom}</TableCell>
                    <TableCell className="text-sm">
                      {fmtDate(c.debut)} <span className="text-muted-foreground">→</span>{' '}
                      {fmtDate(c.fin)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{c.tables}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.tente_marron}</TableCell>
                    <TableCell className="text-right tabular-nums">{c.tente_blanche}</TableCell>
                    <TableCell>
                      <Badge variant={c.src === 'reservation' ? 'default' : 'enc'}>
                        {c.src === 'reservation' ? 'Réservation' : 'Location'}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </>
  )
}

interface StatProps {
  label: string
  value: number | string
  icon: ComponentType<{ className?: string }>
  tone: 'default' | 'success' | 'warn' | 'danger'
}

function Stat({ label, value, icon: Icon, tone }: StatProps) {
  const valueCls = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warn: 'text-amber-600',
    danger: 'text-rose-600',
  }[tone]
  return (
    <Card>
      <CardContent className="flex items-center justify-between gap-3 px-4 py-3">
        <div className="min-w-0">
          <div className="text-xs text-muted-foreground">{label}</div>
          <div className={cn('text-2xl font-semibold tabular-nums', valueCls)}>{value}</div>
        </div>
        <Icon className={cn('h-5 w-5 shrink-0', valueCls, 'opacity-70')} />
      </CardContent>
    </Card>
  )
}

interface MiniRow {
  id: string
  nom: string
  debut: string
  fin: string | null
  qty: number
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
            <TableCell className="font-mono text-xs">{r.id}</TableCell>
            <TableCell className="font-medium">{r.nom}</TableCell>
            <TableCell>{fmtDate(r.debut)}</TableCell>
            <TableCell className="text-muted-foreground">{fmtDate(r.fin)}</TableCell>
            <TableCell className="text-right tabular-nums">{r.qty}</TableCell>
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
