import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { supabase } from '@/lib/supabase'
import type { EtatRetour, Location } from '@/types/database'

const KEY = ['locations'] as const

export function useLocations() {
  return useQuery({
    queryKey: KEY,
    queryFn: async (): Promise<Location[]> => {
      const { data, error } = await supabase
        .from('locations')
        .select('*')
        .order('date_retrait', { ascending: false })
      if (error) throw error
      return data ?? []
    },
  })
}

async function nextLocationId(): Promise<string> {
  const { data, error } = await supabase
    .from('locations')
    .select('id')
    .order('id', { ascending: false })
    .limit(1)
  if (error) throw error
  const last = data?.[0]?.id
  const n = last ? parseInt(last.replace(/\D/g, ''), 10) || 0 : 0
  return 'L' + String(n + 1).padStart(3, '0')
}

export interface CreateLocationInput {
  nom: string
  evenement: string | null
  type: Location['type']
  adherent: Location['adherent']
  date_retrait: string
  date_prev_retour: string | null
  tables: number
  bancs: number
  tente_marron: number
  tente_blanche: number
  prix: number
}

export function useCreateLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (input: CreateLocationInput) => {
      const id = await nextLocationId()
      const { error } = await supabase.from('locations').insert({
        id,
        ...input,
        date_retour: null,
        is_payed: false,
        etat_retour: null,
        notes: null,
      })
      if (error) throw error
      return id
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export interface RegisterReturnInput {
  id: string
  date_retour: string
  etat_retour: EtatRetour
  is_payed: boolean
  notes: string | null
}

export function useRegisterReturn() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({ id, date_retour, etat_retour, is_payed, notes }: RegisterReturnInput) => {
      const { error } = await supabase
        .from('locations')
        .update({ date_retour, etat_retour: etat_retour || null, is_payed, notes })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useUpdateLocationReturnPayment() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async ({
      id,
      date_retour,
      is_payed,
    }: {
      id: string
      date_retour: string
      is_payed: boolean
    }) => {
      const { error } = await supabase
        .from('locations')
        .update({ date_retour, is_payed })
        .eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}

export function useDeleteLocation() {
  const qc = useQueryClient()
  return useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('locations').delete().eq('id', id)
      if (error) throw error
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: KEY }),
  })
}
