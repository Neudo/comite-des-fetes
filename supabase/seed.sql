-- =============================================================
-- Seed des données existantes (idempotent)
-- À exécuter dans l'éditeur SQL Supabase après schema.sql
-- =============================================================

insert into public.locations (
  id, nom, evenement, type, adherent,
  date_retrait, date_prev_retour, date_retour,
  tables, bancs, tente_marron, tente_blanche,
  prix, etat_retour, notes
) values
  (
    'L011', 'Bruno Le coup de Frein', null, 'Association', 'N/A',
    '2026-04-11', '2026-04-13', '2026-04-13',
    5, 10, 0, 0,
    0, 'Bon', null
  ),
  (
    'L012', 'Tetrel', null, 'Particulier', 'Oui',
    '2026-04-28', '2026-05-01', null,
    4, 8, 0, 0,
    8, null, null
  )
on conflict (id) do update set
  nom              = excluded.nom,
  evenement        = excluded.evenement,
  type             = excluded.type,
  adherent         = excluded.adherent,
  date_retrait     = excluded.date_retrait,
  date_prev_retour = excluded.date_prev_retour,
  date_retour      = excluded.date_retour,
  tables           = excluded.tables,
  bancs            = excluded.bancs,
  tente_marron     = excluded.tente_marron,
  tente_blanche    = excluded.tente_blanche,
  prix             = excluded.prix,
  etat_retour      = excluded.etat_retour,
  notes            = excluded.notes;

-- =============================================================
-- Réservations prévisionnelles
-- =============================================================

insert into public.reservations (
  id, nom, evenement, type, adherent,
  date_debut, date_fin,
  tables, bancs, tente_marron, tente_blanche,
  prix, notes, statut
) values
  ('R001', 'Le Ferrier de Tannerre', 'Concert de la Zouave',     'Association', 'N/A', '2026-05-16', '2026-05-21',  5, 20, 1, 0,  0, null,                    'Prévisionnelle'),
  ('R002', 'Le Ferrier de Tannerre', 'Fête du Ferrier',          'Association', 'N/A', '2026-06-06', '2026-06-12', 10, 20, 3, 1,  0, null,                    'Prévisionnelle'),
  ('R003', 'Le Ferrier de Tannerre', 'Balade nocturne du Ferrier','Association','N/A', '2026-07-25', '2026-07-30', 10, 20, 1, 0,  0, null,                    'Prévisionnelle'),
  ('R004', 'Comité des fêtes',       'Cochon grillé',            'Association', 'N/A', '2026-05-30', '2026-06-03', 10, 20, 3, 1,  0, null,                    'Prévisionnelle'),
  ('R005', 'Comité des fêtes',       'Fête du 14 juillet',       'Association', 'N/A', '2026-07-05', '2026-07-11', 10, 20, 3, 1,  0, 'Vaisselle sur place ?', 'Prévisionnelle'),
  ('R006', 'Comité des fêtes',       'Brocante du 15 août',      'Association', 'N/A', '2026-08-07', '2026-08-13', 10, 20, 3, 1,  0, 'Vaisselle sur place ?', 'Prévisionnelle'),
  ('R008', 'Marcel',                 'Fête familiale',           'Particulier', 'Oui', '2026-04-14', '2026-04-15',  3,  4, 1, 0, 16, null,                    'Prévisionnelle'),
  ('R010', 'Archambaut Eric',        'Fête familiale',           'Particulier', 'Oui', '2026-05-11', '2026-05-13',  6, 12, 1, 0, 22, null,                    'Prévisionnelle')
on conflict (id) do update set
  nom           = excluded.nom,
  evenement     = excluded.evenement,
  type          = excluded.type,
  adherent      = excluded.adherent,
  date_debut    = excluded.date_debut,
  date_fin      = excluded.date_fin,
  tables        = excluded.tables,
  bancs         = excluded.bancs,
  tente_marron  = excluded.tente_marron,
  tente_blanche = excluded.tente_blanche,
  prix          = excluded.prix,
  notes         = excluded.notes,
  statut        = excluded.statut;
