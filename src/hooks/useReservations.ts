import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { Reservation, ReservationInsert, ReservationUpdate } from '@/types/database'

const KEY = ['reservations'] as const

export function useReservations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Reservation[]> => {
      const { data, error } = await supabase
        .from('reservations')
        .select('*')
        .order('date_debut', { ascending: true })
      if (error) throw error
      return (data ?? []) as Reservation[]
    },
  })
}

async function nextReservationId(): Promise<string> {
  const { data, error } = await supabase
    .from('reservations')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
  if (error) throw error
  const last = (data?.[0] as { id?: string } | undefined)?.id
  const n = last ? parseInt(last.replace(/\D/g, ''), 10) || 0 : 0
  return 'R' + String(n + 1).padStart(3, '0')
}

export type CreateReservationInput = Omit<ReservationInsert, 'id' | 'statut'>

export function useCreateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReservationInput) => {
      const id = await nextReservationId()
      const payload = { id, ...input, statut: 'Prévisionnelle' as const }
      const { error } = await supabase.from('reservations').insert(payload)
      if (error) throw error
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: ReservationUpdate }) => {
      const { error } = await supabase.from('reservations').update(patch).eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('reservations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

/** Convertit une réservation en location réelle (atomique côté client). */
export function useConfirmReservation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (r: Reservation) => {
      // 1. Calculer le prochain id de location
      const { data: locs, error: e1 } = await supabase
        .from('locations')
        .select('id')
        .order('id', { ascending: false })
        .limit(1)
      if (e1) throw e1
      const last = (locs?.[0] as { id?: string } | undefined)?.id
      const n = last ? parseInt(last.replace(/\D/g, ''), 10) || 0 : 0
      const newId = 'L' + String(n + 1).padStart(3, '0')

      // 2. Créer la location
      const { error: e2 } = await supabase.from('locations').insert({
        id: newId,
        nom: r.nom,
        evenement: r.evenement,
        type: r.type,
        adherent: r.adherent,
        date_retrait: r.date_debut,
        date_prev_retour: r.date_fin,
        date_retour: null,
        tables: r.tables,
        bancs: r.bancs,
        tente_marron: r.tente_marron,
        tente_blanche: r.tente_blanche,
        prix: r.prix,
        etat_retour: null,
        notes: r.notes,
      })
      if (e2) throw e2

      // 3. Supprimer la réservation
      const { error: e3 } = await supabase.from('reservations').delete().eq('id', r.id)
      if (e3) throw e3
      return newId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['locations'] })
    },
  })
}
