-- ============================================================
-- Schéma Supabase — Gestion Église
-- À exécuter dans : Supabase Dashboard > SQL Editor > New query
-- ============================================================

-- Extension pour générer des UUID
create extension if not exists "pgcrypto";

-- ---------------------------------------------------------
-- Table : caisse (journal de caisse — entrées / sorties)
-- ---------------------------------------------------------
create table if not exists caisse (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('entree', 'sortie')),
  montant numeric(12,2) not null check (montant >= 0),
  categorie text not null,
  description text default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table : banque (dépôts / retraits bancaires)
-- ---------------------------------------------------------
create table if not exists banque (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('depot', 'retrait')),
  montant numeric(12,2) not null check (montant >= 0),
  description text default '',
  date date not null default current_date,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table : predications (registre des cultes / prédications)
-- ---------------------------------------------------------
create table if not exists predications (
  id uuid primary key default gen_random_uuid(),
  date date not null default current_date,
  predicateur text not null,
  theme text not null,
  textes text default '',
  hommes integer not null default 0 check (hommes >= 0),
  femmes integer not null default 0 check (femmes >= 0),
  enfants integer not null default 0 check (enfants >= 0),
  jeunes integer not null default 0 check (jeunes >= 0),
  total integer generated always as (hommes + femmes + enfants + jeunes) stored,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Table : membres (registre des effectifs / membres)
-- ---------------------------------------------------------
create table if not exists membres (
  id uuid primary key default gen_random_uuid(),
  nom text not null,
  prenom text not null,
  sexe text not null check (sexe in ('Homme', 'Femme')),
  categorie text not null check (categorie in ('Enfant', 'Jeune', 'Adulte')),
  telephone text default '',
  fonction text default '',
  date_adhesion date not null default current_date,
  actif boolean not null default true,
  created_at timestamptz not null default now()
);

-- ---------------------------------------------------------
-- Index utiles pour les tris par date (historiques, bilans)
-- ---------------------------------------------------------
create index if not exists idx_caisse_date on caisse (date desc);
create index if not exists idx_banque_date on banque (date desc);
create index if not exists idx_predications_date on predications (date desc);
create index if not exists idx_membres_nom on membres (nom, prenom);

-- ---------------------------------------------------------
-- Row Level Security
-- L'application utilise la clé "anon" côté client. Pour une
-- gestion interne simple (accès protégé par ailleurs), on
-- autorise la lecture/écriture publique sur ces tables.
-- ⚠️ Si vous voulez restreindre l'accès à des utilisateurs
-- authentifiés, activez Supabase Auth puis remplacez les
-- politiques "true" par des règles basées sur auth.uid().
-- ---------------------------------------------------------
alter table caisse enable row level security;
alter table banque enable row level security;
alter table predications enable row level security;
alter table membres enable row level security;

create policy "Accès public caisse" on caisse for all using (true) with check (true);
create policy "Accès public banque" on banque for all using (true) with check (true);
create policy "Accès public predications" on predications for all using (true) with check (true);
create policy "Accès public membres" on membres for all using (true) with check (true);
