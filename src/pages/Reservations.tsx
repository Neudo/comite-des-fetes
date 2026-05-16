import { useMemo, useState } from 'react'
import { toast } from 'sonner'
import {
  AlertTriangle,
  CalendarCheck2,
  CalendarDays,
  Check,
  Inbox,
  Loader2,
  MoreHorizontal,
  Pencil,
  Plus,
  Trash2,
  X,
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
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { PageHeader } from '@/components/PageHeader'
import { EmptyState } from '@/components/EmptyState'
import { useLocations } from '@/hooks/useLocations'
import {
  useConfirmReservation,
  useCreateReservation,
  useDeleteReservation,
  useReservations,
  useUpdateReservation,
} from '@/hooks/useReservations'
import {
  useAcceptReservationRequest,
  useRejectReservationRequest,
  useReservationRequests,
} from '@/hooks/useReservationRequests'
import { calculerPrix, STOCK } from '@/lib/pricing'
import { disponibilitePeriode } from '@/lib/stock'
import { addJours, fmtDate, today } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type {
  Adherent,
  Location,
  Reservation,
  ReservationRequest,
  TypeEmprunteur,
} from '@/types/database'

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

function fromReservation(r: Reservation): FormState {
  return {
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
  }
}

function requestStatusLabel(status: ReservationRequest['status']) {
  if (status === 'accepted') return 'Acceptée'
  if (status === 'rejected') return 'Refusée'
  return 'En attente'
}

function requestStatusVariant(status: ReservationRequest['status']) {
  if (status === 'accepted') return 'bon' as const
  if (status === 'rejected') return 'end' as const
  return 'enc' as const
}

export function ReservationsPage() {
  const { data: reservations = [], isLoading } = useReservations()
  const { data: requests = [], isLoading: requestsLoading } = useReservationRequests()
  const { data: locations = [] } = useLocations()
  const createMut = useCreateReservation()
  const updateMut = useUpdateReservation()
  const deleteMut = useDeleteReservation()
  const confirmMut = useConfirmReservation()
  const acceptRequestMut = useAcceptReservationRequest()
  const rejectRequestMut = useRejectReservationRequest()

  const [sheetOpen, setSheetOpen] = useState(false)
  const [editing, setEditing] = useState<Reservation | null>(null)
  const [confirmTarget, setConfirmTarget] = useState<Reservation | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Reservation | null>(null)

  const pendingRequests = useMemo(
    () => requests.filter((request) => request.status === 'pending'),
    [requests],
  )

  const conflitsIds = useMemo(() => {
    const ids = new Set<string>()
    for (const r of reservations) {
      const dispo = disponibilitePeriode(
        r.date_debut,
        r.date_fin,
        locations,
        reservations,
        { kind: 'reservation', id: r.id },
      )
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

  function openCreate() {
    setEditing(null)
    setSheetOpen(true)
  }

  function openEdit(r: Reservation) {
    setEditing(r)
    setSheetOpen(true)
  }

  async function handleDelete() {
    if (!deleteTarget) return
    try {
      await deleteMut.mutateAsync(deleteTarget.id)
      toast.success('Réservation supprimée.')
      setDeleteTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur de suppression.')
    }
  }

  async function handleConfirm() {
    if (!confirmTarget) return
    try {
      const id = await confirmMut.mutateAsync(confirmTarget)
      toast.success(`Convertie en location ${id}.`)
      setConfirmTarget(null)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Stock insuffisant ou erreur.')
    }
  }

  async function handleAcceptRequest(request: ReservationRequest) {
    try {
      const id = await acceptRequestMut.mutateAsync(request)
      toast.success(`Demande acceptée en réservation ${id}.`)
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible d’accepter la demande.')
    }
  }

  async function handleRejectRequest(request: ReservationRequest) {
    try {
      await rejectRequestMut.mutateAsync(request.id)
      toast.success('Demande refusée.')
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Impossible de refuser la demande.')
    }
  }

  return (
    <>
      <PageHeader
        title="Réservations"
        description={`${reservations.length} prévisionnelle${reservations.length > 1 ? 's' : ''}${
          conflitsIds.size > 0 ? ` · ${conflitsIds.size} conflit${conflitsIds.size > 1 ? 's' : ''}` : ''
        }${pendingRequests.length > 0 ? ` · ${pendingRequests.length} demande${pendingRequests.length > 1 ? 's' : ''} en attente` : ''}`}
        icon={<CalendarDays className="h-5 w-5" />}
        actions={
          <Button onClick={openCreate}>
            <Plus className="h-4 w-4" />
            Nouvelle réservation
          </Button>
        }
      />

      <Card className="mb-4">
        <CardContent className="p-0">
          <div className="flex items-center justify-between gap-3 px-4 py-3">
            <div>
              <div className="flex items-center gap-2 text-sm font-semibold">
                <Inbox className="h-4 w-4 text-primary" />
                Demandes de réservation
              </div>
              <div className="text-xs text-muted-foreground">
                {pendingRequests.length} en attente · {requests.length} au total
              </div>
            </div>
          </div>
          {requestsLoading ? (
            <div className="space-y-2 p-4 pt-0">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : requests.length === 0 ? (
            <EmptyState
              className="m-4 mt-0"
              icon={<Inbox className="h-5 w-5" />}
              title="Aucune demande reçue"
              description="Les demandes envoyées depuis la page publique s’afficheront ici."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Demandeur</TableHead>
                  <TableHead>Contact</TableHead>
                  <TableHead>Évènement</TableHead>
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Matériel</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead>Statut</TableHead>
                  <TableHead className="w-[150px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((request) => (
                  <TableRow key={request.id}>
                    <TableCell className="font-medium">{request.nom}</TableCell>
                    <TableCell className="text-xs text-muted-foreground">
                      <div>{request.email}</div>
                      <div>{request.telephone}</div>
                    </TableCell>
                    <TableCell className="max-w-[180px] truncate text-muted-foreground">
                      {request.evenement || '—'}
                    </TableCell>
                    <TableCell className="text-sm">
                      {fmtDate(request.date_debut)}{' '}
                      <span className="text-muted-foreground">→</span>{' '}
                      {fmtDate(request.date_fin)}
                    </TableCell>
                    <TableCell className="text-right text-xs tabular-nums">
                      {request.tables}T · {request.tente_marron}M · {request.tente_blanche}B
                    </TableCell>
                    <TableCell className="text-right font-medium tabular-nums">
                      {request.prix} €
                    </TableCell>
                    <TableCell>
                      <Badge variant={requestStatusVariant(request.status)}>
                        {requestStatusLabel(request.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {request.status === 'pending' ? (
                        <div className="flex justify-end gap-1">
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            title="Accepter"
                            disabled={acceptRequestMut.isPending || rejectRequestMut.isPending}
                            onClick={() => handleAcceptRequest(request)}
                          >
                            <Check className="h-4 w-4" />
                            <span className="sr-only">Accepter</span>
                          </Button>
                          <Button
                            type="button"
                            size="icon-sm"
                            variant="outline"
                            title="Refuser"
                            disabled={acceptRequestMut.isPending || rejectRequestMut.isPending}
                            onClick={() => handleRejectRequest(request)}
                          >
                            <X className="h-4 w-4" />
                            <span className="sr-only">Refuser</span>
                          </Button>
                        </div>
                      ) : null}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
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
          ) : reservations.length === 0 ? (
            <EmptyState
              className="m-4"
              icon={<CalendarDays className="h-5 w-5" />}
              title="Aucune réservation"
              description="Note ici les besoins prévisionnels — les conflits seront signalés automatiquement."
              action={
                <Button onClick={openCreate} variant="outline">
                  <Plus className="h-4 w-4" />
                  Nouvelle réservation
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
                  <TableHead>Période</TableHead>
                  <TableHead className="text-right">Tables</TableHead>
                  <TableHead className="text-right">T.Marron</TableHead>
                  <TableHead className="text-right">T.Blanche</TableHead>
                  <TableHead className="text-right">Prix</TableHead>
                  <TableHead className="w-[50px]" />
                </TableRow>
              </TableHeader>
              <TableBody>
                {reservations.map((r) => {
                  const enConflit = conflitsIds.has(r.id)
                  return (
                    <TableRow key={r.id} className={cn(enConflit && 'bg-amber-50/60')}>
                      <TableCell className="font-mono text-xs font-medium">
                        <div className="flex items-center gap-1.5">
                          {r.id}
                          {enConflit && (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <AlertTriangle className="h-3.5 w-3.5 text-amber-600" />
                              </TooltipTrigger>
                              <TooltipContent>
                                Stock insuffisant sur la période
                              </TooltipContent>
                            </Tooltip>
                          )}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{r.nom}</TableCell>
                      <TableCell className="max-w-[200px] truncate text-muted-foreground">
                        {r.evenement || '—'}
                      </TableCell>
                      <TableCell>
                        <Badge variant={r.type === 'Association' ? 'assoc' : 'part'}>
                          {r.type}
                          {r.adherent !== 'N/A' && ` · ${r.adherent === 'Oui' ? 'Adh.' : 'Non adh.'}`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-sm">
                        {fmtDate(r.date_debut)} <span className="text-muted-foreground">→</span>{' '}
                        {fmtDate(r.date_fin)}
                      </TableCell>
                      <TableCell className="text-right tabular-nums">{r.tables}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.tente_marron}</TableCell>
                      <TableCell className="text-right tabular-nums">{r.tente_blanche}</TableCell>
                      <TableCell className="text-right font-medium tabular-nums">
                        {r.prix} €
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
                            <DropdownMenuItem onClick={() => setConfirmTarget(r)}>
                              <CalendarCheck2 className="h-4 w-4" />
                              Confirmer en location
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => openEdit(r)}>
                              <Pencil className="h-4 w-4" />
                              Modifier
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              variant="destructive"
                              onClick={() => setDeleteTarget(r)}
                            >
                              <Trash2 className="h-4 w-4" />
                              Supprimer
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      <ReservationSheet
        key={editing?.id ?? (sheetOpen ? 'create-open' : 'closed')}
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        editing={editing}
        locations={locations}
        reservations={reservations}
        pending={createMut.isPending || updateMut.isPending}
        onSubmit={async (payload) => {
          if (editing) {
            await updateMut.mutateAsync({ id: editing.id, patch: payload })
            toast.success(`Réservation ${editing.id} modifiée.`)
          } else {
            const id = await createMut.mutateAsync(payload)
            toast.success(`Réservation ${id} enregistrée.`)
          }
          setSheetOpen(false)
          setEditing(null)
        }}
      />

      <AlertDialog
        open={!!confirmTarget}
        onOpenChange={(v) => !v && setConfirmTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Confirmer la réservation {confirmTarget?.id} en location ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {confirmTarget?.nom} · {fmtDate(confirmTarget?.date_debut)} →{' '}
              {fmtDate(confirmTarget?.date_fin)} · {confirmTarget?.tables} tables,{' '}
              {confirmTarget?.tente_marron} marron, {confirmTarget?.tente_blanche} blanche. La
              réservation sera convertie en location réelle.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirm}>Confirmer</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={!!deleteTarget}
        onOpenChange={(v) => !v && setDeleteTarget(null)}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Supprimer la réservation {deleteTarget?.id} ?
            </AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?.nom} — {fmtDate(deleteTarget?.date_debut)} →{' '}
              {fmtDate(deleteTarget?.date_fin)}. Cette action est irréversible.
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

interface ReservationSheetProps {
  open: boolean
  onOpenChange: (v: boolean) => void
  editing: Reservation | null
  locations: Location[]
  reservations: Reservation[]
  pending: boolean
  onSubmit: (payload: {
    nom: string
    evenement: string | null
    type: TypeEmprunteur
    adherent: Adherent
    date_debut: string
    date_fin: string
    tables: number
    bancs: number
    tente_marron: number
    tente_blanche: number
    prix: number
    notes: string | null
  }) => Promise<void>
}

function ReservationSheet({
  open,
  onOpenChange,
  editing,
  locations,
  reservations,
  pending,
  onSubmit,
}: ReservationSheetProps) {
  const [form, setForm] = useState<FormState>(() => (editing ? fromReservation(editing) : emptyForm()))

  const adh: Adherent = form.type === 'Association' ? 'N/A' : form.adherent
  const prix = calculerPrix(form.type, adh, form.tables, form.tente_marron, form.tente_blanche)

  const dispo = useMemo(() => {
    if (!form.date_debut || !form.date_fin) return null
    return disponibilitePeriode(
      form.date_debut,
      form.date_fin,
      locations,
      reservations,
      editing ? { kind: 'reservation', id: editing.id } : undefined,
    )
  }, [form.date_debut, form.date_fin, locations, reservations, editing])

  const conflitForm =
    dispo &&
    (form.tables > dispo.tables ||
      form.tente_marron > dispo.tente_marron ||
      form.tente_blanche > dispo.tente_blanche)

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

    try {
      await onSubmit({
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
      })
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur lors de l\'enregistrement.')
    }
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <SheetHeader>
          <SheetTitle>
            {editing ? `Modifier ${editing.id}` : 'Nouvelle réservation'}
          </SheetTitle>
          <SheetDescription>
            Sans blocage de stock — les conflits sont signalés automatiquement.
          </SheetDescription>
        </SheetHeader>

        <form onSubmit={handleSubmit} className="flex flex-1 flex-col overflow-hidden">
          <SheetBody className="space-y-5">
            <div className="grid gap-2">
              <Label htmlFor="res-nom">Emprunteur *</Label>
              <Input
                id="res-nom"
                placeholder="Ex : Le Ferrier de Tannerre"
                value={form.nom}
                onChange={(e) => setField('nom', e.target.value)}
                autoFocus
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="res-event">Évènement</Label>
              <Input
                id="res-event"
                placeholder="Ex : Fête du village"
                value={form.evenement}
                onChange={(e) => setField('evenement', e.target.value)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
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
                <div className="grid gap-2">
                  <Label htmlFor="res-adh">Adhérent</Label>
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="res-debut">Début *</Label>
                <Input
                  id="res-debut"
                  type="date"
                  value={form.date_debut}
                  onChange={(e) => setDebut(e.target.value)}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="res-fin">Fin *</Label>
                <Input
                  id="res-fin"
                  type="date"
                  min={form.date_debut}
                  value={form.date_fin}
                  onChange={(e) => setField('date_fin', e.target.value)}
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <Label>Matériel</Label>
                {dispo && (
                  <span className="text-xs text-muted-foreground">
                    Dispo période : {dispo.tables}T · {dispo.tente_marron}M · {dispo.tente_blanche}B
                  </span>
                )}
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

            <div className="grid gap-2">
              <Label htmlFor="res-notes">Notes</Label>
              <Textarea
                id="res-notes"
                placeholder="Demandes spéciales…"
                value={form.notes}
                onChange={(e) => setField('notes', e.target.value)}
              />
            </div>

            <div
              className={cn(
                'flex items-center justify-between rounded-md border px-4 py-3',
                conflitForm ? 'border-amber-300 bg-amber-50' : 'bg-muted/40',
              )}
            >
              <div className="flex items-center gap-2 text-sm">
                {conflitForm ? (
                  <>
                    <AlertTriangle className="h-4 w-4 text-amber-600" />
                    <span className="text-amber-900">Conflit de stock sur la période</span>
                  </>
                ) : (
                  <span className="text-muted-foreground">Prix estimé</span>
                )}
              </div>
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
              {editing ? 'Enregistrer les modifications' : 'Créer la réservation'}
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
