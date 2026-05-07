import { Receipt } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { PageHeader } from '@/components/PageHeader'

const ROWS = [
  { label: 'Tente d\'armée (la toile)', adh: '10 €', non: '15 €' },
  { label: '1 table avec 2 bancs', adh: '2 €', non: '3 €' },
  { label: 'Tente blanche 15m', adh: '70 €', non: '80 €' },
] as const

export function TarificationPage() {
  return (
    <>
      <PageHeader
        title="Tarification"
        description="Tarif forfaitaire par location, indépendant de la durée"
        icon={<Receipt className="h-5 w-5" />}
      />

      <Card className="mb-4">
        <CardContent className="py-4 text-sm text-muted-foreground">
          Les associations bénéficient de la <strong className="text-foreground">gratuité</strong>.
          Pour les particuliers, le tarif dépend de l'adhésion.
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Matériel</TableHead>
                <TableHead className="text-right">Adhérent</TableHead>
                <TableHead className="text-right">Non-adhérent</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {ROWS.map((r) => (
                <TableRow key={r.label}>
                  <TableCell className="font-medium">{r.label}</TableCell>
                  <TableCell className="text-right font-semibold tabular-nums">
                    {r.adh}
                  </TableCell>
                  <TableCell className="text-right tabular-nums">{r.non}</TableCell>
                </TableRow>
              ))}
              <TableRow className="bg-emerald-50/40">
                <TableCell className="font-medium">Associations</TableCell>
                <TableCell colSpan={2} className="text-center font-semibold text-emerald-700">
                  Gratuit
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </>
  )
}
