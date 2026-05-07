import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'

const ROWS = [
  { label: '🏕️ Tente d\'armée (la toile)', adh: '10 €', non: '15 €' },
  { label: '🪑 1 table avec 2 bancs', adh: '2 €', non: '3 €' },
  { label: '⛺ Tente blanche 15m', adh: '70 €', non: '80 €' },
] as const

export function TarificationPage() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>💶 Grille tarifaire</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="mb-4 rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
          ℹ️ Tarif forfaitaire par location, indépendant de la durée. Associations :{' '}
          <strong>gratuit</strong>.
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Matériel</TableHead>
              <TableHead className="text-right">Prix Adhérent</TableHead>
              <TableHead className="text-right">Prix Non-Adhérent</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {ROWS.map((r) => (
              <TableRow key={r.label}>
                <TableCell>{r.label}</TableCell>
                <TableCell className="text-right font-semibold">{r.adh}</TableCell>
                <TableCell className="text-right">{r.non}</TableCell>
              </TableRow>
            ))}
            <TableRow className="bg-emerald-50/60">
              <TableCell>🤝 Associations</TableCell>
              <TableCell colSpan={2} className="text-center font-bold text-emerald-700">
                Gratuit
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  )
}
