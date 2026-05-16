export type TypeEmprunteur = 'Association' | 'Particulier'
export type Adherent = 'Oui' | 'Non' | 'N/A'
export type EtatRetour = 'Bon' | 'Endommagé' | 'Manquant' | ''
export type ReservationRequestStatus = 'pending' | 'accepted' | 'rejected'

export interface Location {
  id: string
  nom: string
  evenement: string | null
  type: TypeEmprunteur
  adherent: Adherent
  date_retrait: string
  date_prev_retour: string | null
  date_retour: string | null
  tables: number
  bancs: number
  tente_marron: number
  tente_blanche: number
  prix: number
  is_payed: boolean
  etat_retour: EtatRetour | null
  notes: string | null
  created_at: string
}

export interface Reservation {
  id: string
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
  statut: 'Prévisionnelle' | 'Confirmée'
  created_at: string
}

export interface ReservationRequest {
  id: string
  nom: string
  email: string
  telephone: string
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
  status: ReservationRequestStatus
  created_at: string
}

export type LocationInsert = Omit<Location, 'id' | 'created_at'> & {
  id?: string
}
export type LocationUpdate = Partial<Omit<Location, 'id' | 'created_at'>>
export type ReservationInsert = Omit<Reservation, 'id' | 'created_at'> & {
  id?: string
}
export type ReservationUpdate = Partial<Omit<Reservation, 'id' | 'created_at'>>
export type ReservationRequestInsert = Omit<
  ReservationRequest,
  'id' | 'created_at' | 'status'
> & {
  id?: string
  status?: ReservationRequestStatus
}
export type ReservationRequestUpdate = Partial<Omit<ReservationRequest, 'id' | 'created_at'>>
