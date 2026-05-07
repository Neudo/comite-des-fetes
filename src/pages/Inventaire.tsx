import { useMemo } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { useLocations } from '@/hooks/useLocations'
import { STOCK } from '@/lib/pricing'
import { cn } from '@/lib/utils'

interface Row {
  nom: string
  total: number
  enLocation: number
}

export function InventairePage() {
  const { data: locations = [] } = useLocations()

  const rows = useMemo<Row[]>(() => {
    const enc = locations.filter((l) => !l.date_retour)
    const tablesEnc = enc.reduce((s, l) => s + l.tables, 0)
    const bancsEnc = enc.reduce((s, l) => s + l.bancs, 0)
    const marronEnc = enc.reduce((s, l) => s + l.tente_marron, 0)
    const blancheEnc = enc.reduce((s, l) => s + l.tente_blanche, 0)
    return [
      { nom: '🪑 Tables', total: STOCK.tables, enLocation: tablesEnc },
      { nom: '🪑 Bancs', total: STOCK.bancs, enLocation: bancsEnc },
      { nom: '🏕️ Tentes armée marron', total: STOCK.tente_marron, enLocation: marronEnc },
      { nom: '⛺ Tente blanche 15m', total: STOCK.tente_blanche, enLocation: blancheEnc },
    ]
  }, [locations])

  return (
    <Card>
      <CardHeader>
        <CardTitle>📦 Stock & Disponibilité</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matériel</TableHead>
              <TableHead className="text-right">Stock total</TableHead>
              <TableHead className="text-right">En location</TableHead>
              <TableHead className="text-right">Disponible</TableHead>
              <TableHead className="w-[200px]">Disponibilité</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rows.map((r) => {
              const dispo = r.total - r.enLocation
              const pct = Math.max(0, Math.round((dispo / r.total) * 100))
              const tone =
                pct === 0 ? 'bg-rose-500' : pct <= 33 ? 'bg-amber-500' : 'bg-emerald-500'
              return (
                <TableRow key={r.nom}>
                  <TableCell>{r.nom}</TableCell>
                  <TableCell className="text-right">{r.total}</TableCell>
                  <TableCell className="text-right">{r.enLocation}</TableCell>
                  <TableCell className="text-right font-semibold">{dispo}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn('h-full transition-all', tone)}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <span className="w-10 text-right text-xs text-muted-foreground">
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
  )
}
