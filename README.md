# Comité des Fêtes — Tannerre-en-Puisaye

Application de gestion de la location de matériel (tables, bancs, tentes) pour le comité des fêtes.

**Stack** : Vite + React + TypeScript · Tailwind v4 + shadcn/ui · Supabase · Netlify

---

## Démarrage local

### 1. Installer les dépendances

```bash
npm install
```

### 2. Configurer Supabase

1. Créer un projet sur [supabase.com](https://supabase.com).
2. Dans **SQL Editor**, copier-coller le contenu de [`supabase/schema.sql`](supabase/schema.sql) et l'exécuter.
3. Dans **Authentication → Providers**, vérifier que **Email** est activé.
4. Dans **Authentication → Users**, créer manuellement l'utilisateur (le proprio).
5. Récupérer dans **Project Settings → API** :
   - `Project URL` → `VITE_SUPABASE_URL`
   - `anon public` key → `VITE_SUPABASE_ANON_KEY`

### 3. Variables d'environnement

```bash
cp .env.example .env
```

Puis remplir `.env` avec les valeurs Supabase.

### 4. Lancer le dev server

```bash
npm run dev
```

L'app tourne sur http://localhost:5173.

---

## Scripts

| Commande         | Action                                      |
| ---------------- | ------------------------------------------- |
| `npm run dev`    | Dev server (HMR)                            |
| `npm run build`  | Build de prod (`tsc -b && vite build`)      |
| `npm run preview`| Servir le build local                       |
| `npm run lint`   | ESLint                                      |

---

## Déploiement Netlify

1. Connecter le repo à Netlify.
2. Build command : `npm run build`
3. Publish directory : `dist`
4. Ajouter les variables d'env (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`) dans **Site settings → Environment variables**.
5. Le fichier `public/_redirects` gère déjà la redirection SPA.

---

## Structure

```
src/
  components/
    ui/              # composants shadcn (button, card, input, label, sonner)
    AppLayout.tsx    # header + nav + outlet (routes protégées)
    ProtectedRoute.tsx
  hooks/
    useAuth.tsx      # contexte d'auth Supabase
  lib/
    supabase.ts      # client Supabase typé
    utils.ts         # helper cn()
  pages/
    Login.tsx
    Dashboard.tsx
    Placeholder.tsx  # écrans à porter
  types/
    database.ts      # types des tables Supabase
  App.tsx            # routes
  main.tsx           # bootstrap React
supabase/
  schema.sql         # schéma à exécuter dans Supabase
```

---

## État du portage

- [x] Scaffold Vite + Tailwind + shadcn
- [x] Auth email/password Supabase
- [x] Layout + routing
- [ ] Page Réservations
- [ ] Page Locations
- [ ] Page Calendrier
- [ ] Page Inventaire
- [ ] Page Tarification
- [ ] Page Historique
- [ ] Détection de conflits de stock
- [ ] Configuration Netlify (env vars)
# comite-des-fetes
