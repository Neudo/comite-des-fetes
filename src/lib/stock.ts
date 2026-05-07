import type { Location, Reservation } from '@/types/database'
import { STOCK } from './pricing'

type StockKey = 'tables' | 'tente_marron' | 'tente_blanche'

export interface Availability {
  tables: number
  tente_marron: number
  tente_blanche: number
}

export function chevauchement(d1: string, f1: string, d2: string, f2: string): boolean {
  return d1 <= f2 && d2 <= f1
}

/** Stock encore disponible sur la période [debut, fin], hors un éventuel item exclu. */
export function disponibilitePeriode(
  debut: string,
  fin: string,
  locations: Location[],
  reservations: Reservation[],
  exclude?: { kind: 'location' | 'reservation'; id: string },
): Availability {
  let tables = 0
  let marron = 0
  let blanche = 0

  for (const l of locations) {
    if (l.date_retour) continue
    if (exclude?.kind === 'location' && exclude.id === l.id) continue
    const f = l.date_prev_retour ?? l.date_retrait
    if (chevauchement(l.date_retrait, f, debut, fin)) {
      tables += l.tables
      marron += l.tente_marron
      blanche += l.tente_blanche
    }
  }

  for (const r of reservations) {
    if (exclude?.kind === 'reservation' && exclude.id === r.id) continue
    if (chevauchement(r.date_debut, r.date_fin, debut, fin)) {
      tables += r.tables
      marron += r.tente_marron
      blanche += r.tente_blanche
    }
  }

  return {
    tables: STOCK.tables - tables,
    tente_marron: STOCK.tente_marron - marron,
    tente_blanche: STOCK.tente_blanche - blanche,
  }
}

/** Stock actuellement engagé (locations en cours non retournées). */
export function stockEngageActuel(locations: Location[]): Availability {
  let tables = 0
  let marron = 0
  let blanche = 0
  for (const l of locations) {
    if (l.date_retour) continue
    tables += l.tables
    marron += l.tente_marron
    blanche += l.tente_blanche
  }
  return {
    tables: STOCK.tables - tables,
    tente_marron: STOCK.tente_marron - marron,
    tente_blanche: STOCK.tente_blanche - blanche,
  }
}

export const STOCK_LABELS: Record<StockKey, string> = {
  tables: 'table(s)',
  tente_marron: 'tente(s) marron',
  tente_blanche: 'tente(s) blanche',
}
