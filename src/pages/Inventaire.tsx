import { useMemo, useState } from 'react'
import { Armchair, Package, Tent, TentTree } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/PageHeader'
import { useLocations } from '@/hooks/useLocations'
import { useReservations } from '@/hooks/useReservations'
import { STOCK } from '@/lib/pricing'
import { disponibilitePeriode, stockEngageActuel } from '@/lib/stock'
import { addJours, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { ComponentType } from 'react'

type Mode = 'now' | 'period'

interface Row {
  key: 'tables' | 'bancs' | 'tente_marron' | 'tente_blanche'
  nom: string
  icon: ComponentType<{ className?: string }>
  total: number
  enLocation: number
  dispo: number
}

export function InventairePage() {
  const { data: locations = [] } = useLocations()
  const { data: reservations = [] } = useReservations()

  const [mode, setMode] = useState<Mode>('now')
  const [debut, setDebut] = useState(today())
  const [fin, setFin] = useState(addJours(today(), 1))

  const rows = useMemo<Row[]>(() => {
    if (mode === 'now') {
      const dispo = stockEngageActuel(locations)
      const enc = locations.filter((l) => !l.date_retour)
      const tablesEnc = enc.reduce((s, l) => s + l.tables, 0)
      const bancsEnc = enc.reduce((s, l) => s + l.bancs, 0)
      const marronEnc = enc.reduce((s, l) => s + l.tente_marron, 0)
      const blancheEnc = enc.reduce((s, l) => s + l.tente_blanche, 0)
      return [
        {
          key: 'tables',
          nom: 'Tables',
          icon: Armchair,
          total: STOCK.tables,
          enLocation: tablesEnc,
          dispo: dispo.tables,
        },
        {
          key: 'bancs',
          nom: 'Bancs',
          icon: Armchair,
          total: STOCK.bancs,
          enLocation: bancsEnc,
          dispo: STOCK.bancs - bancsEnc,
        },
        {
          key: 'tente_marron',
          nom: 'Tentes armée marron',
          icon: Tent,
          total: STOCK.tente_marron,
          enLocation: marronEnc,
          dispo: dispo.tente_marron,
        },
        {
          key: 'tente_blanche',
          nom: 'Tente blanche 15m',
          icon: TentTree,
          total: STOCK.tente_blanche,
          enLocation: blancheEnc,
          dispo: dispo.tente_blanche,
        },
      ]
    }
    const dispo = disponibilitePeriode(debut, fin, locations, reservations)
    return [
      {
        key: 'tables',
        nom: 'Tables',
        icon: Armchair,
        total: STOCK.tables,
        enLocation: STOCK.tables - dispo.tables,
        dispo: dispo.tables,
      },
      {
        key: 'bancs',
        nom: 'Bancs',
        icon: Armchair,
        total: STOCK.bancs,
        enLocation: 0,
        dispo: STOCK.bancs,
      },
      {
        key: 'tente_marron',
        nom: 'Tentes armée marron',
        icon: Tent,
        total: STOCK.tente_marron,
        enLocation: STOCK.tente_marron - dispo.tente_marron,
        dispo: dispo.tente_marron,
      },
      {
        key: 'tente_blanche',
        nom: 'Tente blanche 15m',
        icon: TentTree,
        total: STOCK.tente_blanche,
        enLocation: STOCK.tente_blanche - dispo.tente_blanche,
        dispo: dispo.tente_blanche,
      },
    ]
  }, [mode, debut, fin, locations, reservations])

  return (
    <>
      <PageHeader
        title="Inventaire"
        description="Stock total, engagements et disponibilité"
        icon={<Package className="h-5 w-5" />}
      />

      <Card className="mb-4">
        <CardContent className="flex flex-wrap items-end gap-4 py-4">
          <div className="inline-flex rounded-md border p-0.5">
            <Button
              variant={mode === 'now' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('now')}
            >
              Maintenant
            </Button>
            <Button
              variant={mode === 'period' ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setMode('period')}
            >
              Sur une période
            </Button>
          </div>

          {mode === 'period' && (
            <>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-debut" className="text-xs">
                  Début
                </Label>
                <Input
                  id="inv-debut"
                  type="date"
                  value={debut}
                  onChange={(e) => setDebut(e.target.value)}
                  className="w-40"
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="inv-fin" className="text-xs">
                  Fin
                </Label>
                <Input
                  id="inv-fin"
                  type="date"
                  min={debut}
                  value={fin}
                  onChange={(e) => setFin(e.target.value)}
                  className="w-40"
                />
              </div>
              <p className="ml-auto text-xs text-muted-foreground">
                Inclut locations en cours et réservations qui chevauchent la période.
              </p>
            </>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-base">Stock & disponibilité</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériel</TableHead>
                <TableHead className="text-right">Total</TableHead>
                <TableHead className="text-right">
                  {mode === 'now' ? 'En location' : 'Engagé'}
                </TableHead>
                <TableHead className="text-right">Disponible</TableHead>
                <TableHead className="w-[260px]">Disponibilité</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((r) => {
                const dispo = Math.max(0, r.dispo)
                const pct = r.total > 0 ? Math.round((dispo / r.total) * 100) : 0
                const tone =
                  pct === 0
                    ? 'bg-rose-500'
                    : pct <= 33
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                return (
                  <TableRow key={r.key}>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <r.icon className="h-4 w-4 text-muted-foreground" />
                        <span>{r.nom}</span>
                      </div>
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{r.total}</TableCell>
                    <TableCell className="text-right tabular-nums">{r.enLocation}</TableCell>
                    <TableCell
                      className={cn(
                        'text-right font-semibold tabular-nums',
                        dispo === 0 && 'text-rose-600',
                      )}
                    >
                      {dispo}
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center gap-2">
                        <Progress value={pct} indicatorClassName={tone} />
                        <span className="w-10 text-right text-xs tabular-nums text-muted-foreground">
                          {pct}%
                        </span>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
