import type { Adherent, TypeEmprunteur } from '@/types/database'

export const STOCK = {
  tables: 10,
  bancs: 20,
  tente_marron: 3,
  tente_blanche: 1,
} as const

export const TARIFS = {
  adherent: { table: 2, tente_marron: 10, tente_blanche: 70 },
  non_adherent: { table: 3, tente_marron: 15, tente_blanche: 80 },
} as const

export function calculerPrix(
  type: TypeEmprunteur,
  adherent: Adherent,
  tables: number,
  tenteMarron: number,
  tenteBlanche: number,
): number {
  if (type === 'Association') return 0
  const grille = adherent === 'Oui' ? TARIFS.adherent : TARIFS.non_adherent
  return tables * grille.table + tenteMarron * grille.tente_marron + tenteBlanche * grille.tente_blanche
}
