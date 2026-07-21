# ⛪ Gestion Église

Application web de gestion pour église : caisse, compte bancaire, bilan financier,
registre des prédications et effectifs des membres.

Construite avec **Next.js** (pages router) et **Supabase** (base de données Postgres),
déployable en un clic sur **Vercel**.

---

## 1. Configurer Supabase (base de données)

1. Créez un compte gratuit sur [supabase.com](https://supabase.com) et créez un nouveau projet.
2. Une fois le projet créé, allez dans **SQL Editor** (menu de gauche) → **New query**.
3. Copiez-collez tout le contenu du fichier [`supabase/schema.sql`](./supabase/schema.sql)
   de ce dépôt, puis cliquez sur **Run**. Cela crée les 4 tables nécessaires
   (`caisse`, `banque`, `predications`, `membres`) avec leurs règles de sécurité.
4. Allez dans **Project Settings → API**. Notez deux valeurs :
   - **Project URL**
   - **anon public key**

> ℹ️ Par défaut, les tables sont accessibles en lecture/écriture par toute personne
> disposant du lien de l'application (pas d'authentification). C'est adapté à un usage
> interne restreint. Si vous voulez ajouter une connexion par mot de passe, activez
> **Supabase Auth** et adaptez les politiques RLS dans `schema.sql`.

---

## 2. Configurer le projet en local

```bash
# Installer les dépendances
npm install

# Copier le fichier d'environnement et y renseigner vos clés Supabase
cp .env.local.example .env.local
```

Éditez `.env.local` :

```
NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxxxxxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=votre-cle-anon-publique
```

Lancez le serveur de développement :

```bash
npm run dev
```

L'application est disponible sur [http://localhost:3000](http://localhost:3000).

---

## 3. Déployer sur Vercel via Git

1. Poussez ce dossier vers un dépôt GitHub (ou GitLab/Bitbucket) :

   ```bash
   git init
   git add .
   git commit -m "Initial commit — application de gestion église"
   git branch -M main
   git remote add origin <URL_DE_VOTRE_DEPOT>
   git push -u origin main
   ```

2. Allez sur [vercel.com](https://vercel.com) → **Add New → Project** → importez votre dépôt Git.
3. Vercel détecte automatiquement Next.js. Avant de déployer, ouvrez la section
   **Environment Variables** et ajoutez :

   | Nom | Valeur |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (celle de votre projet Supabase) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (celle de votre projet Supabase) |

4. Cliquez sur **Deploy**. Votre application sera en ligne en quelques minutes.

Chaque nouveau `git push` sur la branche principale redéploiera automatiquement le site.

---

## 4. Structure du projet

```
eglise-gestion/
├── components/
│   ├── Layout.js        → navigation, en-tête, pied de page
│   └── ui.js             → composants d'interface partagés (cartes, boutons...)
├── lib/
│   ├── supabaseClient.js → connexion à Supabase
│   └── format.js         → formatage des montants et dates
├── pages/
│   ├── _app.js
│   ├── index.js           → tableau de bord
│   ├── caisse.js          → journal de caisse
│   ├── banque.js          → compte bancaire
│   ├── bilan.js            → bilan financier consolidé
│   ├── predications.js    → registre des prédications
│   └── effectifs.js       → registre des membres
├── styles/
│   └── globals.css        → variables de design (couleurs, typographie)
├── supabase/
│   └── schema.sql         → schéma de base de données à exécuter sur Supabase
├── .env.local.example
├── .gitignore
├── next.config.js
└── package.json
```

## 5. Fonctionnalités

- **Caisse** — journal des entrées/sorties par catégorie, avec solde en temps réel.
- **Banque** — suivi des dépôts et retraits bancaires.
- **Bilan** — vue consolidée caisse + banque, graphique mensuel, répartition par catégorie.
- **Prédications** — registre des cultes avec effectif par catégorie (hommes/femmes/enfants/jeunes).
- **Effectifs** — registre des membres avec recherche, filtres et statut actif/inactif.

Toutes les données sont stockées dans Supabase (Postgres) : elles sont partagées entre
tous les utilisateurs de l'application et persistent entre les déploiements.
