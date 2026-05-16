import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  ArmchairIcon,
  CalendarDays,
  CheckCircle2,
  ClipboardList,
  Euro,
  LayoutDashboard,
  Tent,
  TentTree,
} from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
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
import { fmtDate } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { ComponentType } from 'react'

export function DashboardPage() {
  const { data: locations = [] } = useLocations()
  const { data: reservations = [] } = useReservations()
  const [unpaidOpen, setUnpaidOpen] = useState(false)

  const actives = useMemo(() => locations.filter((l) => !l.date_retour), [locations])
  const impayees = useMemo(
    () =>
      locations
        .filter((l) => l.date_retour && !l.is_payed)
        .sort((a, b) => (a.date_retour! < b.date_retour! ? 1 : -1)),
    [locations],
  )
  const totalImpayes = impayees.reduce((s, l) => s + (l.prix || 0), 0)
  const tablesEnc = actives.reduce((s, l) => s + l.tables, 0)
  const marronEnc = actives.reduce((s, l) => s + l.tente_marron, 0)
  const blancheEnc = actives.reduce((s, l) => s + l.tente_blanche, 0)

  return (
    <>
      <PageHeader
        title="Tableau de bord"
        description="Aperçu des locations en cours, réservations et paiements"
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
          label="Total impayé"
          value={`${totalImpayes} €`}
          icon={totalImpayes > 0 ? Euro : CheckCircle2}
          tone={totalImpayes > 0 ? 'warn' : 'success'}
          onClick={() => setUnpaidOpen(true)}
        />
      </div>

      <div className="mt-4 grid gap-4 lg:grid-cols-2">
        <Card>
          <CardHeader className="flex-row items-center justify-between gap-2 space-y-0 py-4">
            <CardTitle className="text-base">Locations en cours</CardTitle>
            <Button asChild variant="ghost" size="sm">
              <Link to="/admin/locations">Voir tout</Link>
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
              <Link to="/admin/reservations">Voir tout</Link>
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

      <Dialog open={unpaidOpen} onOpenChange={setUnpaidOpen}>
        <DialogContent className="w-[min(820px,96vw)]">
          <DialogHeader>
            <DialogTitle>Locations impayées</DialogTitle>
            <DialogDescription>
              Locations terminées avec une date de retour renseignée et non marquées comme payées.
            </DialogDescription>
          </DialogHeader>
          {impayees.length === 0 ? (
            <EmptyState
              icon={<CheckCircle2 className="h-5 w-5 text-emerald-600" />}
              title="Aucun impayé"
              description="Toutes les locations terminées sont indiquées comme payées."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Emprunteur</TableHead>
                  <TableHead>Évènement</TableHead>
                  <TableHead>Retour</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {impayees.map((l) => (
                  <TableRow key={l.id} className="bg-amber-50/40">
                    <TableCell className="font-mono text-xs font-medium">{l.id}</TableCell>
                    <TableCell className="font-medium">{l.nom}</TableCell>
                    <TableCell className="max-w-[220px] truncate text-muted-foreground">
                      {l.evenement || '—'}
                    </TableCell>
                    <TableCell>{fmtDate(l.date_retour)}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {l.prix} €
                    </TableCell>
                  </TableRow>
                ))}
                <TableRow>
                  <TableCell colSpan={4} className="text-right font-medium">
                    Total
                  </TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {totalImpayes} €
                  </TableCell>
                </TableRow>
              </TableBody>
            </Table>
          )}
        </DialogContent>
      </Dialog>
    </>
  )
}

interface StatProps {
  label: string
  value: number | string
  icon: ComponentType<{ className?: string }>
  tone: 'default' | 'success' | 'warn' | 'danger'
  onClick?: () => void
}

function Stat({ label, value, icon: Icon, tone, onClick }: StatProps) {
  const valueCls = {
    default: 'text-foreground',
    success: 'text-emerald-600',
    warn: 'text-amber-600',
    danger: 'text-rose-600',
  }[tone]
  return (
    <Card
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={(e) => {
        if (!onClick) return
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault()
          onClick()
        }
      }}
      className={cn(onClick && 'cursor-pointer transition-colors hover:bg-accent/20')}
    >
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
