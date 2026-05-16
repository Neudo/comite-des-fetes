import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type {
  ReservationRequest,
  ReservationRequestInsert,
  ReservationRequestStatus,
} from '@/types/database'

const KEY = ['reservation-requests'] as const

export type CreateReservationRequestInput = ReservationRequestInsert

export function useReservationRequests() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<ReservationRequest[]> => {
      const { data, error } = await supabase
        .from('reservation_requests')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      return (data ?? []) as ReservationRequest[]
    },
  })
}

export function useCreateReservationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateReservationRequestInput) => {
      const { error } = await supabase
        .from('reservation_requests')
        .insert({ ...input, status: 'pending' as const })
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
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

export function useAcceptReservationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (request: ReservationRequest) => {
      const reservationId = await nextReservationId()
      const { error: insertError } = await supabase.from('reservations').insert({
        id: reservationId,
        nom: request.nom,
        evenement: request.evenement,
        type: request.type,
        adherent: request.adherent,
        date_debut: request.date_debut,
        date_fin: request.date_fin,
        tables: request.tables,
        bancs: request.bancs,
        tente_marron: request.tente_marron,
        tente_blanche: request.tente_blanche,
        prix: request.prix,
        notes: request.notes,
        statut: 'Prévisionnelle' as const,
      })
      if (insertError) throw insertError

      const { error: updateError } = await supabase
        .from('reservation_requests')
        .update({ status: 'accepted' satisfies ReservationRequestStatus })
        .eq('id', request.id)
      if (updateError) throw updateError

      return reservationId
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: KEY })
      qc.invalidateQueries({ queryKey: ['reservations'] })
    },
  })
}

export function useRejectReservationRequest() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase
        .from('reservation_requests')
        .update({ status: 'rejected' satisfies ReservationRequestStatus })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
