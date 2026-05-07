import { useMemo } from 'react'
import { Loader2 } from 'lucide-react'
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
import { fmtDate } from '@/lib/dates'
import type { EtatRetour } from '@/types/database'

function etatVariant(e: EtatRetour | null) {
  if (!e) return 'muted' as const
  if (e === 'Bon') return 'bon' as const
  return 'end' as const
}

export function HistoriquePage() {
  const { data: locations = [], isLoading } = useLocations()

  const terminees = useMemo(
    () =>
      locations
        .filter((l) => l.date_retour)
        .sort((a, b) => (a.date_retour! < b.date_retour! ? 1 : -1)),
    [locations],
  )

  const totalRevenu = useMemo(
    () => terminees.reduce((s, l) => s + (l.prix || 0), 0),
    [terminees],
  )

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>🗂️ Locations terminées ({terminees.length})</span>
          <span className="text-sm font-normal text-muted-foreground">
            Total encaissé : <strong className="text-foreground">{totalRevenu} €</strong>
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
          </div>
        ) : terminees.length === 0 ? (
          <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            Aucune location terminée pour l'instant.
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N°</TableHead>
                <TableHead>Nom</TableHead>
                <TableHead>Évènement</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Retrait</TableHead>
                <TableHead>Retour</TableHead>
                <TableHead className="text-right">Tables</TableHead>
                <TableHead className="text-right">T.Marron</TableHead>
                <TableHead className="text-right">T.Blanche</TableHead>
                <TableHead className="text-right">Prix</TableHead>
                <TableHead>État</TableHead>
                <TableHead>Notes</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {terminees.map((l) => (
                <TableRow key={l.id}>
                  <TableCell className="font-semibold">{l.id}</TableCell>
                  <TableCell>{l.nom}</TableCell>
                  <TableCell>{l.evenement || '—'}</TableCell>
                  <TableCell>
                    <Badge variant={l.type === 'Association' ? 'assoc' : 'part'}>
                      {l.type}
                    </Badge>
                  </TableCell>
                  <TableCell>{fmtDate(l.date_retrait)}</TableCell>
                  <TableCell>{fmtDate(l.date_retour)}</TableCell>
                  <TableCell className="text-right">{l.tables}</TableCell>
                  <TableCell className="text-right">{l.tente_marron}</TableCell>
                  <TableCell className="text-right">{l.tente_blanche}</TableCell>
                  <TableCell className="text-right font-semibold">{l.prix} €</TableCell>
                  <TableCell>
                    <Badge variant={etatVariant(l.etat_retour)}>
                      {l.etat_retour || '—'}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[280px] truncate text-xs text-muted-foreground">
                    {l.notes || '—'}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>
    </Card>
  )
}
