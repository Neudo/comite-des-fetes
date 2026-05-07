import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, CheckCircle2, Pencil, X, Loader2, AlertTriangle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
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
import {
  useReservations,
  useCreateReservation,
  useUpdateReservation,
  useDeleteReservation,
  useConfirmReservation,
} from '@/hooks/useReservations'
import { calculerPrix, STOCK } from '@/lib/pricing'
import { disponibilitePeriode } from '@/lib/stock'
import { addJours, fmtDate, today } from '@/lib/dates'
import type { Adherent, Reservation, TypeEmprunteur } from '@/types/database'

interface FormState {
  nom: string
  evenement: string
  type: TypeEmprunteur
  adherent: Adherent
  date_debut: string
  date_fin: string
  tables: number
  bancs: number
  tente_marron: number
  tente_blanche: number
  notes: string
}

function emptyForm(): FormState {
  const t = today()
  return {
    nom: '',
    evenement: '',
    type: 'Association',
    adherent: 'Non',
    date_debut: t,
    date_fin: addJours(t, 1),
    tables: 0,
    bancs: 0,
    tente_marron: 0,
    tente_blanche: 0,
    notes: '',
  }
}

export function ReservationsPage() {
  const { data: reservations = [], isLoading } = useReservations()
  const { data: locations = [] } = useLocations()
  const createMut = useCreateReservation()
  const updateMut = useUpdateReservation()
  const deleteMut = useDeleteReservation()
  const confirmMut = useConfirmReservation()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [editingId, setEditingId] = useState<string | null>(null)

  const adh: Adherent = form.type === 'Association' ? 'N/A' : form.adherent
  const prix = calculerPrix(
    form.type,
    adh,
    form.tables,
    form.tente_marron,
    form.tente_blanche,
  )

  /** Disponibilité sur la période demandée (excluant la résa en édition). */
  const dispoPeriode = useMemo(() => {
    if (!form.date_debut || !form.date_fin) return null
    return disponibilitePeriode(
      form.date_debut,
      form.date_fin,
      locations,
      reservations,
      editingId ? { kind: 'reservation', id: editingId } : undefined,
    )
  }, [form.date_debut, form.date_fin, locations, reservations, editingId])

  const conflitForm =
    dispoPeriode &&
    (form.tables > dispoPeriode.tables ||
      form.tente_marron > dispoPeriode.tente_marron ||
      form.tente_blanche > dispoPeriode.tente_blanche)

  /** Réservations en conflit (stock dépassé sur leur période). */
  const conflitsIds = useMemo(() => {
    const ids = new Set<string>()
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
        ids.add(r.id)
      }
    }
    return ids
  }, [locations, reservations])

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function setTables(v: number) {
    setForm((f) => ({ ...f, tables: v, bancs: v * 2 }))
  }

  function setDebut(v: string) {
    setForm((f) => {
      const next = { ...f, date_debut: v }
      if (!f.date_fin || f.date_fin <= v) next.date_fin = addJours(v, 1)
      return next
    })
  }

  function startEdit(r: Reservation) {
    setEditingId(r.id)
    setForm({
      nom: r.nom,
      evenement: r.evenement ?? '',
      type: r.type,
      adherent: r.adherent === 'N/A' ? 'Non' : r.adherent,
      date_debut: r.date_debut,
      date_fin: r.date_fin,
      tables: r.tables,
      bancs: r.bancs,
      tente_marron: r.tente_marron,
      tente_blanche: r.tente_blanche,
      notes: r.notes ?? '',
    })
    document.getElementById('res-nom')?.scrollIntoView({ behavior: 'smooth', block: 'center' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(emptyForm())
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nom = form.nom.trim()
    if (!nom || !form.date_debut || !form.date_fin) {
      toast.error('Nom, date début et fin obligatoires.')
      return
    }
    if (form.date_fin < form.date_debut) {
      toast.error('La date de fin doit être après le début.')
      return
    }
    if (form.tables === 0 && form.tente_marron === 0 && form.tente_blanche === 0) {
      toast.error('Sélectionnez au moins un article.')
      return
    }

    const payload = {
      nom,
      evenement: form.evenement.trim() || null,
      type: form.type,
      adherent: adh,
      date_debut: form.date_debut,
      date_fin: form.date_fin,
      tables: form.tables,
      bancs: form.bancs,
      tente_marron: form.tente_marron,
      tente_blanche: form.tente_blanche,
      prix,
      notes: form.notes.trim() || null,
    }

    try {
      if (editingId) {
        await updateMut.mutateAsync({ id: editingId, patch: payload })
        toast.success(`Réservation ${editingId} modifiée.`)
        cancelEdit()
      } else {
        const id = await createMut.mutateAsync(payload)
        toast.success(`Réservation ${id} enregistrée.`)
        setForm(emptyForm())
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette réservation ?')) return
    try {
      await deleteMut.mutateAsync(id)
      if (editingId === id) cancelEdit()
      toast.success('Réservation supprimée.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  async function handleConfirm(r: Reservation) {
    if (!confirm(`Confirmer la réservation ${r.id} en location réelle ?`)) return
    try {
      const id = await confirmMut.mutateAsync(r)
      if (editingId === r.id) cancelEdit()
      toast.success(`Convertie en location ${id}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Stock insuffisant ou erreur.')
    }
  }

  const isPending = createMut.isPending || updateMut.isPending

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between gap-2">
            <span>
              {editingId
                ? `✏️ Modification de la réservation ${editingId}`
                : '➕ Nouvelle réservation prévisionnelle'}
            </span>
            {editingId && (
              <Button type="button" variant="ghost" size="sm" onClick={cancelEdit}>
                <X className="h-3.5 w-3.5" /> Annuler
              </Button>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            ℹ️ Une réservation est enregistrée <strong>sans bloquer le stock</strong>. Les
            conflits éventuels sont signalés. Le stock sera vérifié au moment du retrait réel.
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="res-nom">Nom emprunteur ou association</Label>
              <Input
                id="res-nom"
                placeholder="Ex : Le Ferrier de Tannerre…"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
              />
            </div>
            <div className="grid gap-1.5">
              <Label htmlFor="res-event">🎉 Évènement</Label>
              <Input
                id="res-event"
                placeholder="Ex : Fête du village, Repas annuel…"
                value={form.evenement}
                onChange={(e) => setField('evenement', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="res-type">Type</Label>
                <Select
                  id="res-type"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value as TypeEmprunteur)}
                >
                  <option value="Association">Association</option>
                  <option value="Particulier">Particulier</option>
                </Select>
              </div>
              {form.type !== 'Association' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="res-adh">Adhérent ?</Label>
                  <Select
                    id="res-adh"
                    value={form.adherent}
                    onChange={(e) => setField('adherent', e.target.value as Adherent)}
                  >
                    <option value="Non">Non</option>
                    <option value="Oui">Oui</option>
                  </Select>
                </div>
              )}
              <div className="grid gap-1.5">
                <Label htmlFor="res-debut">Date de début (retrait)</Label>
                <Input
                  id="res-debut"
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setDebut(e.target.value)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="res-fin">Date de fin (retour prévu)</Label>
                <Input
                  id="res-fin"
                  type="date"
                  min={form.date_debut}
                  value={form.date_fin}
                  onChange={(e) => setField('date_fin', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="res-tables">
                  Tables <span className="text-muted-foreground">(× 2 bancs incl.)</span>
                </Label>
                <Input
                  id="res-tables"
                  type="number"
                  min={0}
                  max={STOCK.tables}
                  value={form.tables}
                  onChange={(e) => setTables(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="res-bancs">Bancs (info)</Label>
                <Input
                  id="res-bancs"
                  type="number"
                  min={0}
                  max={STOCK.bancs}
                  value={form.bancs}
                  onChange={(e) => setField('bancs', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="res-tmarron">Tentes armée marron</Label>
                <Input
                  id="res-tmarron"
                  type="number"
                  min={0}
                  max={STOCK.tente_marron}
                  value={form.tente_marron}
                  onChange={(e) => setField('tente_marron', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="res-tblanche">Tente blanche 15m</Label>
                <Input
                  id="res-tblanche"
                  type="number"
                  min={0}
                  max={STOCK.tente_blanche}
                  value={form.tente_blanche}
                  onChange={(e) => setField('tente_blanche', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="res-notes">Notes / demandes spéciales</Label>
              <Textarea
                id="res-notes"
                placeholder="Ex : vaisselle, besoin de branchement…"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-violet-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">💶</span>
                <div>
                  <div className="text-xs text-muted-foreground">Prix estimé</div>
                  <div className="text-2xl font-bold text-violet-700">
                    {prix} €{form.type === 'Association' && ' (Gratuit)'}
                  </div>
                </div>
              </div>
              {conflitForm && (
                <Badge variant="end" className="gap-1">
                  <AlertTriangle className="h-3 w-3" /> Conflit stock détecté
                </Badge>
              )}
              {dispoPeriode && !conflitForm && (
                <div className="text-xs text-muted-foreground">
                  Dispo période : {dispoPeriode.tables} tables · {dispoPeriode.tente_marron}{' '}
                  marron · {dispoPeriode.tente_blanche} blanche
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2">
              {editingId && (
                <Button type="button" variant="outline" onClick={cancelEdit}>
                  Annuler
                </Button>
              )}
              <Button type="submit" disabled={isPending}>
                {isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                {editingId ? '💾 Enregistrer les modifications' : '🗓️ Enregistrer la réservation'}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>
            🗓️ Réservations prévisionnelles ({reservations.length})
            {conflitsIds.size > 0 && (
              <Badge variant="end" className="ml-2 gap-1">
                <AlertTriangle className="h-3 w-3" /> {conflitsIds.size} conflit
                {conflitsIds.size > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : reservations.length === 0 ? (
            <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Aucune réservation prévisionnelle.
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>N°</TableHead>
                  <TableHead>Nom</TableHead>
                  <TableHead>Évènement</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Adh.</TableHead>
                  <TableHead>Début</TableHead>
                  <TableHead>Fin</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">Bancs</TableHead>
                  <TableHead className="text-right">T.Marron</TableHead>
                  <TableHead className="text-right">T.Blanche</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const enConflit = conflitsIds.has(r.id)
                  const enEdition = r.id === editingId
                  return (
                    <TableRow
                      key={r.id}
                      className={
                        enConflit
                          ? 'bg-amber-50/60 hover:bg-amber-50'
                          : enEdition
                            ? 'bg-violet-50/60 hover:bg-violet-50'
                            : undefined
                      }
                    >
                      <TableCell className="font-semibold">
                        {r.id}
                        {enConflit && (
                          <AlertTriangle className="ml-1 inline h-3 w-3 text-amber-600" />
                        )}
                      </TableCell>
                      <TableCell>{r.nom}</TableCell>
                      <TableCell>{r.evenement || '—'}</TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'Association' ? 'assoc' : 'part'}>
                          {r.type}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {r.adherent === 'N/A' ? (
                          <span className="text-muted-foreground">—</span>
                        ) : (
                          <Badge variant={r.adherent === 'Oui' ? 'adh' : 'non'}>
                            {r.adherent}
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{fmtDate(r.date_debut)}</TableCell>
                      <TableCell>{fmtDate(r.date_fin)}</TableCell>
                      <TableCell className="text-right">{r.tables}</TableCell>
                      <TableCell className="text-right">{r.bancs}</TableCell>
                      <TableCell className="text-right">{r.tente_marron}</TableCell>
                      <TableCell className="text-right">{r.tente_blanche}</TableCell>
                      <TableCell className="text-right font-semibold">{r.prix} €</TableCell>
                      <TableCell className="whitespace-nowrap text-right">
                        <Button
                          size="sm"
                          variant="secondary"
                          onClick={() => handleConfirm(r)}
                          disabled={confirmMut.isPending}
                        >
                          <CheckCircle2 className="h-3.5 w-3.5" /> Confirmer
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="ml-1"
                          onClick={() => startEdit(r)}
                          title="Modifier"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="ml-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                          onClick={() => handleDelete(r.id)}
                          disabled={deleteMut.isPending}
                          title="Supprimer"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

