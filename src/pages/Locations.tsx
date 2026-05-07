import { useEffect, useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  ClipboardList,
  Loader2,
  MoreHorizontal,
  PackageCheck,
  Plus,
  Trash2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import {
  Sheet,
  SheetBody,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
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
import {
  useCreateLocation,
  useDeleteLocation,
  useLocations,
  useRegisterReturn,
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

  const [createOpen, setCreateOpen] = useState(false)
  const [returnTarget, setReturnTarget] = useState<Location | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Location | null>(null)

  const actives = useMemo(
    () =>
      locations
        .filter((l) => !l.date_retour)
        .sort((a, b) => (a.date_retrait < b.date_retrait ? 1 : -1)),
    [locations],
  )
  const dispoActuel = useMemo(() => stockEngageActuel(locations), [locations])

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Location supprimée.')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  return (
    <>
      <PageHeader
        title="Locations"
        description={`${actives.length} location${actives.length > 1 ? 's' : ''} en cours`}
        icon={<ClipboardList className="h-5 w-5" />}
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" />
            Nouvelle location
          </Button>
        }
      />

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="space-y-2 p-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : actives.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={<ClipboardList className="h-5 w-5" />}
              title="Aucune location en cours"
              description="Quand un emprunteur retire du matériel, enregistre la sortie ici."
              action={
                <Button onClick={() => setCreateOpen(true)} variant="outline">
                  <Plus className="h-4 w-4" />
                  Nouvelle location
                </Button>
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
                  <TableHead>Prév. retour</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">T.Marron</TableHead>
                  <TableHead className="text-right">T.Blanche</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {actives.map((l) => (
                  <TableRow key={l.id}>
                    <TableCell className="font-mono text-xs font-medium">{l.id}</TableCell>
                    <TableCell className="font-medium">{l.nom}</TableCell>
                    <TableCell className="max-w-[200px] truncate text-muted-foreground">
                      {l.evenement || '—'}
                    </TableCell>
                    <TableCell>
                      <Badge variant={l.type === 'Association' ? 'assoc' : 'part'}>
                        {l.type}
                        {l.adherent !== 'N/A' && ` · ${l.adherent === 'Oui' ? 'Adh.' : 'Non adh.'}`}
                      </Badge>
                    </TableCell>
                    <TableCell>{fmtDate(l.date_retrait)}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {fmtDate(l.date_prev_retour)}
                    </TableCell>
                    <TableCell className="text-right tabular-nums">{l.tables}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.tente_marron}</TableCell>
                    <TableCell className="text-right tabular-nums">{l.tente_blanche}</TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {l.prix} €
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon-sm">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Actions</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setReturnTarget(l)}>
                            <PackageCheck className="h-4 w-4" />
                            Enregistrer le retour
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem
                            variant="destructive"
                            onClick={() => setDeleteTarget(l)}
                          >
                            <Trash2 className="h-4 w-4" />
                            Supprimer
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <CreateLocationSheet
        open={createOpen}
        onOpenChange={setCreateOpen}
        dispo={dispoActuel}
        onSubmit={async (input) => {
          const id = await createMut.mutateAsync(input)
          toast.success(`Location ${id} enregistrée.`)
          setCreateOpen(false)
        }}
        pending={createMut.isPending}
      />

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

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer la location {deleteTarget?.id} ?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.nom} — retrait du {fmtDate(deleteTarget?.date_retrait)}. Cette
              action est irréversible.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction variant="destructive" onClick={handleDelete}>
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

interface CreateSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  dispo: { tables: number; tente_marron: number; tente_blanche: number }
  onSubmit: (input: {
    nom: string
    evenement: string | null
    type: TypeEmprunteur
    adherent: Adherent
    date_retrait: string
    date_prev_retour: string | null
    tables: number
    bancs: number
    tente_marron: number
    tente_blanche: number
    prix: number
  }) => Promise<void>
  pending: boolean
}

function CreateLocationSheet({ open, onOpenChange, dispo, onSubmit, pending }: CreateSheetProps) {
  const [form, setForm] = useState<FormState>(emptyForm)

  useEffect(() => {
    if (open) setForm(emptyForm())
  }, [open])

  const adh: Adherent = form.type === 'Association' ? 'N/A' : form.adherent
  const prix = calculerPrix(form.type, adh, form.tables, form.tente_marron, form.tente_blanche)

  function setField<K extends keyof FormState>(k: K, v: FormState[K]) {
    setForm((f) => ({ ...f, [k]: v }))
  }
  function setTables(v: number) {
    setForm((f) => ({ ...f, tables: v, bancs: v * 2 }))
  }
  function setRetrait(v: string) {
    setForm((f) => {
      const next = { ...f, date_retrait: v }
      if (!f.date_prev_retour || f.date_prev_retour <= v) next.date_prev_retour = addJours(v, 1)
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
    if (form.tables > dispo.tables) {
      toast.error(`Seulement ${dispo.tables} table(s) disponible(s).`)
      return
    }
    if (form.tente_marron > dispo.tente_marron) {
      toast.error(`Seulement ${dispo.tente_marron} tente(s) marron disponible(s).`)
      return
    }
    if (form.tente_blanche > dispo.tente_blanche) {
      toast.error(`Seulement ${dispo.tente_blanche} tente(s) blanche disponible(s).`)
      return
    }

    try {
      await onSubmit({
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
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>Nouvelle location</SheetTitle>
          <SheetDescription>
            Enregistrer un retrait effectif. Le stock disponible est vérifié.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <SheetBody className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="loc-nom">Emprunteur *</Label>
              <Input
                id="loc-nom"
                placeholder="Nom complet ou association"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="loc-event">Évènement</Label>
              <Input
                id="loc-event"
                placeholder="Ex : Fête du village"
                value={form.evenement}
                onChange={(e) => setField('evenement', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
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
                <div className="grid gap-2">
                  <Label htmlFor="loc-adh">Adhérent</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="loc-retrait">Date de retrait *</Label>
                <Input
                  id="loc-retrait"
                  type="date"
                  value={form.date_retrait}
                  onChange={(e) => setRetrait(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="loc-prev">Retour prévu</Label>
                <Input
                  id="loc-prev"
                  type="date"
                  min={form.date_retrait}
                  value={form.date_prev_retour}
                  onChange={(e) => setField('date_prev_retour', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Matériel</Label>
                <span className="text-xs text-muted-foreground">
                  Dispo : {dispo.tables}T · {dispo.tente_marron}M · {dispo.tente_blanche}B
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                <Counter
                  label="Tables"
                  hint="× 2 bancs"
                  value={form.tables}
                  max={STOCK.tables}
                  onChange={setTables}
                />
                <Counter
                  label="Bancs"
                  value={form.bancs}
                  max={STOCK.bancs}
                  onChange={(v) => setField('bancs', v)}
                />
                <Counter
                  label="T. marron"
                  value={form.tente_marron}
                  max={STOCK.tente_marron}
                  onChange={(v) => setField('tente_marron', v)}
                />
                <Counter
                  label="T. blanche"
                  value={form.tente_blanche}
                  max={STOCK.tente_blanche}
                  onChange={(v) => setField('tente_blanche', v)}
                />
              </div>
            </div>

            <div className="flex items-center justify-between rounded-md border bg-muted/40 px-4 py-3">
              <span className="text-sm text-muted-foreground">Prix total</span>
              <span className="text-xl font-semibold tabular-nums">
                {prix} €
                {form.type === 'Association' && (
                  <span className="ml-2 text-xs font-normal text-muted-foreground">
                    Gratuit
                  </span>
                )}
              </span>
            </div>
          </SheetBody>

          <SheetFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" disabled={pending}>
              {pending && <Loader2 className="h-4 w-4 animate-spin" />}
              Enregistrer le retrait
            </Button>
          </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  )
}

interface CounterProps {
  label: string
  hint?: string
  value: number
  max: number
  onChange: (v: number) => void
}

function Counter({ label, hint, value, max, onChange }: CounterProps) {
  return (
    <div className="grid gap-1.5">
      <Label className="text-xs">
        {label}
        {hint && <span className="ml-1 font-normal text-muted-foreground">({hint})</span>}
      </Label>
      <Input
        type="number"
        min={0}
        max={max}
        value={value}
        onChange={(e) => onChange(parseInt(e.target.value) || 0)}
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

  useEffect(() => {
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
          <DialogTitle>Enregistrer le retour — {location.id}</DialogTitle>
          <DialogDescription>
            {location.nom}
            {location.evenement && ` · ${location.evenement}`}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label htmlFor="ret-date">Date de retour</Label>
            <Input
              id="ret-date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </div>
          <div className="grid gap-2">
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
          <div className="grid gap-2">
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
