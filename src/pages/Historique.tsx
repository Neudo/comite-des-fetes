import { useMemo, useState } from 'react'
import { History, Search } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
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
import { fmtDate } from '@/lib/dates'
import type { EtatRetour } from '@/types/database'

function etatVariant(e: EtatRetour | null) {
  if (!e) return 'muted' as const
  if (e === 'Bon') return 'bon' as const
  return 'end' as const
}

export function HistoriquePage() {
  const { data: locations = [], isLoading } = useLocations()

  const [q, setQ] = useState('')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')

  const terminees = useMemo(
    () =>
      locations
        .filter((l) => l.date_retour)
        .sort((a, b) => (a.date_retour! < b.date_retour! ? 1 : -1)),
    [locations],
  )

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase()
    return terminees.filter((l) => {
      if (needle) {
        const hay = `${l.id} ${l.nom} ${l.evenement ?? ''}`.toLowerCase()
        if (!hay.includes(needle)) return false
      }
      if (from && l.date_retour! < from) return false
      if (to && l.date_retour! > to) return false
      return true
    })
  }, [terminees, q, from, to])

  const totalRevenu = filtered.reduce((s, l) => s + (l.prix || 0), 0)

  return (
    <>
      <PageHeader
        title="Historique"
        description={`${filtered.length} location${filtered.length > 1 ? 's' : ''} terminée${filtered.length > 1 ? 's' : ''} · ${totalRevenu} € encaissés`}
        icon={<History className="h-5 w-5" />}
      />

      <Card className="mb-4">
        <CardContent className="grid gap-3 py-4 sm:grid-cols-[1fr_auto_auto]">
          <div className="grid gap-1.5">
            <Label htmlFor="hist-q" className="text-xs">
              Rechercher
            </Label>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="hist-q"
                placeholder="Nom, évènement, n°…"
                value={q}
                onChange={(e) => setQ(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hist-from" className="text-xs">
              Retour à partir de
            </Label>
            <Input
              id="hist-from"
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
              className="w-40"
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="hist-to" className="text-xs">
              Jusqu'à
            </Label>
            <Input
              id="hist-to"
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
              className="w-40"
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : filtered.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={<History className="h-5 w-5" />}
              title={
                terminees.length === 0
                  ? 'Aucune location terminée'
                  : 'Aucun résultat'
              }
              description={
                terminees.length === 0
                  ? 'Les locations clôturées s\'afficheront ici.'
                  : 'Essaie d\'élargir tes filtres.'
              }
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Emprunteur</TableHead>
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
                {filtered.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-medium">{l.id}</TableCell>
                    <TableCell className="font-medium">{l.nom}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {l.evenement || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.type === 'Association' ? 'assoc' : 'part'}>
                        {l.type}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDate(l.date_retrait)}</TableCell>
                    <TableCell>{fmtDate(l.date_retour)}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.tables}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.tente_marron}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.tente_blanche}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {l.prix} €
                    </TableCell>
                    <TableCell>
                      <Badge variant={etatVariant(l.etat_retour)}>
                        {l.etat_retour || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[260px] truncate text-xs text-muted-foreground">
                      {l.notes || '—'}
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
