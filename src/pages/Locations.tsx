import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import { Trash2, PackageCheck, Loader2 } from 'lucide-react'
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  useLocations,
  useCreateLocation,
  useRegisterReturn,
  useDeleteLocation,
} from '@/hooks/useLocations'
import { calculerPrix, STOCK } from '@/lib/pricing'
import { stockEngageActuel } from '@/lib/stock'
import { addJours, fmtDate, today } from '@/lib/dates'
import type { Adherent, EtatRetour, Location, TypeEmprunteur } from '@/types/database'

interface FormState {
  nom: string
  evenement: string
  type: TypeEmprunteur
  adherent: Adherent
  date_retrait: string
  date_prev_retour: string
  tables: number
  bancs: number
  tente_marron: number
  tente_blanche: number
}

function emptyForm(): FormState {
  const t = today()
  return {
    nom: '',
    evenement: '',
    type: 'Particulier',
    adherent: 'Non',
    date_retrait: t,
    date_prev_retour: addJours(t, 1),
    tables: 0,
    bancs: 0,
    tente_marron: 0,
    tente_blanche: 0,
  }
}

export function LocationsPage() {
  const { data: locations = [], isLoading } = useLocations()
  const createMut = useCreateLocation()
  const returnMut = useRegisterReturn()
  const deleteMut = useDeleteLocation()

  const [form, setForm] = useState<FormState>(emptyForm)
  const [returnTarget, setReturnTarget] = useState<Location | null>(null)

  const actives = useMemo(() => locations.filter((l) => !l.date_retour), [locations])
  const dispoActuel = useMemo(() => stockEngageActuel(locations), [locations])

  const adh: Adherent = form.type === 'Association' ? 'N/A' : form.adherent
  const prix = calculerPrix(
    form.type,
    adh,
    form.tables,
    form.tente_marron,
    form.tente_blanche,
  )

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }

  function setTables(v: number) {
    setForm((f) => ({ ...f, tables: v, bancs: v * 2 }))
  }

  function setRetrait(v: string) {
    setForm((f) => {
      const next = { ...f, date_retrait: v }
      if (!f.date_prev_retour || f.date_prev_retour <= v) {
        next.date_prev_retour = addJours(v, 1)
      }
      return next
    })
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const nom = form.nom.trim()
    if (!nom || !form.date_retrait) {
      toast.error('Nom et date de retrait obligatoires.')
      return
    }
    if (form.tables === 0 && form.tente_marron === 0 && form.tente_blanche === 0) {
      toast.error('Sélectionnez au moins un article.')
      return
    }
    if (form.tables > dispoActuel.tables) {
      toast.error(`Seulement ${dispoActuel.tables} table(s) disponible(s) actuellement.`)
      return
    }
    if (form.tente_marron > dispoActuel.tente_marron) {
      toast.error(
        `Seulement ${dispoActuel.tente_marron} tente(s) marron disponible(s) actuellement.`,
      )
      return
    }
    if (form.tente_blanche > dispoActuel.tente_blanche) {
      toast.error(
        `Seulement ${dispoActuel.tente_blanche} tente(s) blanche disponible(s) actuellement.`,
      )
      return
    }

    try {
      const id = await createMut.mutateAsync({
        nom,
        evenement: form.evenement.trim() || null,
        type: form.type,
        adherent: adh,
        date_retrait: form.date_retrait,
        date_prev_retour: form.date_prev_retour || null,
        tables: form.tables,
        bancs: form.bancs,
        tente_marron: form.tente_marron,
        tente_blanche: form.tente_blanche,
        prix,
      })
      toast.success(`Location ${id} enregistrée.`)
      setForm(emptyForm())
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Supprimer cette location ?')) return
    try {
      await deleteMut.mutateAsync(id)
      toast.success('Location supprimée.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  return (
    <div className="grid gap-4">
      <Card>
        <CardHeader>
          <CardTitle>➕ Nouvelle location (retrait effectif)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-4 rounded-md border-l-4 border-amber-400 bg-amber-50 px-4 py-3 text-sm text-amber-900">
            ⚠️ Ici on enregistre un retrait <strong>réel</strong> de matériel. Le stock
            disponible est vérifié.
          </div>

          <form onSubmit={handleSubmit} className="grid gap-4">
            <div className="grid gap-1.5">
              <Label htmlFor="loc-nom">Nom emprunteur ou association</Label>
              <Input
                id="loc-nom"
                placeholder="Nom complet…"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
              />
            </div>

            <div className="grid gap-1.5">
              <Label htmlFor="loc-event">🎉 Évènement</Label>
              <Input
                id="loc-event"
                placeholder="Ex : Fête du village, Repas annuel…"
                value={form.evenement}
                onChange={(e) => setField('evenement', e.target.value)}
              />
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
              <div className="grid gap-1.5">
                <Label htmlFor="loc-type">Type</Label>
                <Select
                  id="loc-type"
                  value={form.type}
                  onChange={(e) => setField('type', e.target.value as TypeEmprunteur)}
                >
                  <option value="Particulier">Particulier</option>
                  <option value="Association">Association</option>
                </Select>
              </div>

              {form.type !== 'Association' && (
                <div className="grid gap-1.5">
                  <Label htmlFor="loc-adh">Adhérent ?</Label>
                  <Select
                    id="loc-adh"
                    value={form.adherent}
                    onChange={(e) => setField('adherent', e.target.value as Adherent)}
                  >
                    <option value="Non">Non</option>
                    <option value="Oui">Oui</option>
                  </Select>
                </div>
              )}

              <div className="grid gap-1.5">
                <Label htmlFor="loc-retrait">Date de retrait</Label>
                <Input
                  id="loc-retrait"
                  type="date"
                  value={form.date_retrait}
                  onChange={(e) => setRetrait(e.target.value)}
                />
              </div>

              <div className="grid gap-1.5">
                <Label htmlFor="loc-prev">Date prévisible retour</Label>
                <Input
                  id="loc-prev"
                  type="date"
                  min={form.date_retrait}
                  value={form.date_prev_retour}
                  onChange={(e) => setField('date_prev_retour', e.target.value)}
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4">
              <div className="grid gap-1.5">
                <Label htmlFor="loc-tables">
                  Tables <span className="text-muted-foreground">(× 2 bancs incl.)</span>
                </Label>
                <Input
                  id="loc-tables"
                  type="number"
                  min={0}
                  max={STOCK.tables}
                  value={form.tables}
                  onChange={(e) => setTables(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="loc-bancs">Bancs (info)</Label>
                <Input
                  id="loc-bancs"
                  type="number"
                  min={0}
                  max={STOCK.bancs}
                  value={form.bancs}
                  onChange={(e) => setField('bancs', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="loc-tmarron">Tentes armée marron</Label>
                <Input
                  id="loc-tmarron"
                  type="number"
                  min={0}
                  max={STOCK.tente_marron}
                  value={form.tente_marron}
                  onChange={(e) => setField('tente_marron', parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid gap-1.5">
                <Label htmlFor="loc-tblanche">Tente blanche 15m</Label>
                <Input
                  id="loc-tblanche"
                  type="number"
                  min={0}
                  max={STOCK.tente_blanche}
                  value={form.tente_blanche}
                  onChange={(e) => setField('tente_blanche', parseInt(e.target.value) || 0)}
                />
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg bg-blue-50 px-4 py-3">
              <div className="flex items-center gap-3">
                <span className="text-xl">💶</span>
                <div>
                  <div className="text-xs text-muted-foreground">Prix total</div>
                  <div className="text-2xl font-bold text-blue-700">
                    {prix} €{form.type === 'Association' && ' (Gratuit)'}
                  </div>
                </div>
              </div>
              <div className="text-xs text-muted-foreground">
                Dispo. actuel : {dispoActuel.tables} tables · {dispoActuel.tente_marron}{' '}
                marron · {dispoActuel.tente_blanche} blanche
              </div>
            </div>

            <div className="flex justify-end">
              <Button type="submit" disabled={createMut.isPending}>
                {createMut.isPending && <Loader2 className="h-4 w-4 animate-spin" />}
                ✅ Enregistrer le retrait
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>📋 Locations en cours ({actives.length})</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-4 w-4 animate-spin" /> Chargement…
            </div>
          ) : actives.length === 0 ? (
            <div className="rounded-md border-l-4 border-blue-400 bg-blue-50 px-4 py-3 text-sm text-blue-900">
              Aucune location active.
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
                  <TableHead>Retrait</TableHead>
                  <TableHead>Prév. retour</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">Bancs</TableHead>
                  <TableHead className="text-right">T.Marron</TableHead>
                  <TableHead className="text-right">T.Blanche</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {actives.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-semibold">{l.id}</TableCell>
                    <TableCell>{l.nom}</TableCell>
                    <TableCell>{l.evenement || '—'}</TableCell>
                    <TableCell>
                      <Badge variant={l.type === 'Association' ? 'assoc' : 'part'}>
                        {l.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {l.adherent === 'N/A' ? (
                        <span className="text-muted-foreground">—</span>
                      ) : (
                        <Badge variant={l.adherent === 'Oui' ? 'adh' : 'non'}>
                          {l.adherent}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>{fmtDate(l.date_retrait)}</TableCell>
                    <TableCell>{fmtDate(l.date_prev_retour)}</TableCell>
                    <TableCell className="text-right">{l.tables}</TableCell>
                    <TableCell className="text-right">{l.bancs}</TableCell>
                    <TableCell className="text-right">{l.tente_marron}</TableCell>
                    <TableCell className="text-right">{l.tente_blanche}</TableCell>
                    <TableCell className="text-right font-semibold">{l.prix} €</TableCell>
                    <TableCell className="whitespace-nowrap text-right">
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => setReturnTarget(l)}
                      >
                        <PackageCheck className="h-3.5 w-3.5" /> Retour
                      </Button>
                      <Button
                        size="icon-sm"
                        variant="ghost"
                        className="ml-1 text-rose-600 hover:bg-rose-50 hover:text-rose-700"
                        onClick={() => handleDelete(l.id)}
                        disabled={deleteMut.isPending}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReturnDialog
        location={returnTarget}
        onClose={() => setReturnTarget(null)}
        onSubmit={async (input) => {
          try {
            await returnMut.mutateAsync(input)
            toast.success('Retour enregistré.')
            setReturnTarget(null)
          } catch (err) {
            toast.error(err instanceof Error ? err.message : 'Erreur.')
          }
        }}
        pending={returnMut.isPending}
      />
    </div>
  )
}

interface ReturnDialogProps {
  location: Location | null
  pending: boolean
  onClose: () => void
  onSubmit: (input: {
    id: string
    date_retour: string
    etat_retour: EtatRetour
    notes: string | null
  }) => void
}

function ReturnDialog({ location, pending, onClose, onSubmit }: ReturnDialogProps) {
  const [date, setDate] = useState(today())
  const [etat, setEtat] = useState<EtatRetour>('Bon')
  const [notes, setNotes] = useState('')

  // Reset state quand on ouvre/change de cible
  useMemo(() => {
    if (location) {
      setDate(today())
      setEtat('Bon')
      setNotes('')
    }
  }, [location])

  if (!location) return null

  return (
    <Dialog open={!!location} onOpenChange={(v) => !v && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>📦 Retour — {location.id}</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="text-sm text-muted-foreground">
            <strong className="text-foreground">{location.nom}</strong>
            {location.evenement && ` · ${location.evenement}`}
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ret-date">Date de retour réelle</Label>
            <Input
              id="ret-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ret-etat">État du matériel</Label>
            <Select
              id="ret-etat"
              value={etat}
              onChange={(e) => setEtat(e.target.value as EtatRetour)}
            >
              <option value="Bon">Bon</option>
              <option value="Endommagé">Endommagé</option>
              <option value="Manquant">Manquant</option>
            </Select>
          </div>
          <div className="grid gap-1.5">
            <Label htmlFor="ret-notes">Notes</Label>
            <Textarea
              id="ret-notes"
              placeholder="Observations éventuelles…"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
            />
          </div>
        </div>
        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Annuler
          </Button>
          <Button
            type="button"
            disabled={pending || !date}
            onClick={() =>
              onSubmit({
                id: location.id,
                date_retour: date,
                etat_retour: etat,
                notes: notes.trim() || null,
              })
            }
          >
            {pending && <Loader2 className="h-4 w-4 animate-spin" />}
            Valider le retour
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
