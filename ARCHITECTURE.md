# Architecture du projet — SFMC Monitoring App

Application de monitoring pour Salesforce Marketing Cloud (SFMC).
Stack : React 18 · TypeScript · Vite · TanStack Query · TanStack Router · Zustand · Tailwind CSS · Axios · Zod

---

## Vue d'ensemble de la structure

```
sezane-monitoring-app/
└── frontend/                   ← tout le code source React
    ├── public/                 ← assets statiques servis tel quel
    ├── src/
    │   ├── app/                ← initialisation de l'application (providers, layout, routing, stores)
    │   ├── entities/           ← modèles de données métier (types TypeScript purs)
    │   ├── features/           ← fonctionnalités de l'app (logique + UI par domaine)
    │   ├── routes/             ← pages/routes déclarées pour TanStack Router
    │   ├── shared/             ← code réutilisable entre toutes les features
    │   ├── mocks/              ← données fictives pour le développement (MSW)
    │   └── tests/              ← configuration et utilitaires de tests
    ├── .env.example            ← template des variables d'environnement à copier en .env
    ├── vite.config.js          ← configuration du bundler Vite
    ├── tsconfig.json           ← configuration TypeScript
    └── package.json            ← dépendances et scripts npm
```

---

## `app/` — Initialisation de l'application

Tout ce qui démarre et encadre l'application. Ne contient pas de logique métier.

```
app/
├── layout/
│   ├── app-shell.tsx       ← Squelette visuel : grille Sidebar + zone principale
│   ├── page-container.tsx  ← Wrapper de padding/max-width pour chaque page
│   ├── sidebar.tsx         ← Menu de navigation latéral (8 sections, badges, statut système)
│   └── topbar.tsx          ← Barre du haut (titre de page, actions globales)
│
├── providers/
│   ├── auth-provider.tsx   ← Vérifie le token au démarrage, charge le profil utilisateur
│   ├── query-provider.tsx  ← Configure TanStack Query (staleTime 30s, retry, gcTime 5min)
│   ├── router-provider.tsx ← Monte le router TanStack Router dans l'arbre React
│   └── theme-provider.tsx  ← Injecte le thème dark (variables CSS Tailwind)
│
├── router/
│   ├── index.tsx           ← Crée l'instance du router avec les options globales
│   ├── routeTree.gen.ts    ← GÉNÉRÉ AUTOMATIQUEMENT par Vite — ne pas modifier à la main
│   └── guards.ts           ← Protections de routes (ex : redirection si non connecté)
│
└── store/
    ├── session-store.ts    ← Store Zustand : user, accessToken, refreshToken, isAuthenticated
    └── ui-store.ts         ← Store Zustand : état de l'interface (sidebar ouverte, modals…)
```

**Pourquoi ce dossier ?**
Sépare le "démarrage" de l'app de sa logique métier. Si on veut changer le router ou le système d'auth, on ne touche qu'à `app/`.

---

## `entities/` — Modèles de données métier

Contient uniquement des **types TypeScript et schemas Zod**. Aucun composant, aucun appel réseau.
Ces types représentent les données telles qu'elles existent dans l'application (pas forcément identiques à la réponse brute de l'API).

```
entities/
├── alert/
│   ├── model.ts        ← Interface Alert { id, title, severity, channel, status… }
│   └── schema.ts       ← Schema Zod pour valider les alertes venant de l'API
│
├── anomaly/
│   ├── model.ts        ← Interface Anomaly { id, type, description, severity, impact… }
│   └── schema.ts       ← Schema Zod anomalie
│
├── automation/
│   ├── model.ts        ← Interface Automation { id, name, frequency, lastRun, status, delay }
│   └── schema.ts       ← Schema Zod automation (modèle interne / backend Django)
│
├── journey/
│   ├── model.ts        ← Interface Journey { id, name, bu, owner, status, entries, sla… }
│   ├── schema.ts       ← Schema Zod journey
│   └── ui.ts           ← Helpers visuels liés aux journeys (couleurs de statut, libellés)
│
└── kpi/
    ├── model.ts        ← Interfaces KpiData, AnalyticsKpi, ApiHealth, ActivityPoint…
    └── schema.ts       ← Schemas Zod pour les KPIs
```

**Pourquoi ce dossier ?**
Centralise les types pour éviter la duplication. Une seule source de vérité pour ce qu'est une "Journey" ou une "Automation" dans l'app.

---

## `features/` — Fonctionnalités par domaine

Chaque feature est **auto-suffisante** : elle a ses propres appels API, ses hooks et ses composants.
Structure systématique : `api/` → `hooks/` → `components/` (→ `types/` si besoin).

```
features/
├── alerting/
│   ├── api/alerting.api.ts         ← Appels HTTP alertes (wrapping de alerting-client)
│   ├── hooks/use-alerting.ts       ← useAlerts(), useAcknowledgeAlert() via TanStack Query
│   └── components/alerting-page.tsx← Page liste des alertes + mutations
│
├── analytics/
│   ├── api/analytics.api.ts        ← Appels KPIs analytics et tendances
│   ├── hooks/use-analytics.ts      ← useAnalyticsKpis(), usePerformanceTrend()
│   └── components/analytics-page.tsx← Dashboard analytics avec graphiques Recharts
│
├── anomalies/
│   ├── api/anomalies.api.ts        ← Appels liste et détail anomalies
│   ├── hooks/use-anomalies.ts      ← useAnomalies(filters), useAnomaly(id)
│   └── components/
│       ├── anomalies-page.tsx      ← Table des anomalies avec filtres
│       └── anomaly-detail-page.tsx ← Détail d'une anomalie
│
├── api-health/
│   ├── api/api-health.api.ts       ← Appel GET /api-health/
│   ├── hooks/use-api-health.ts     ← useApiHealth() avec polling
│   └── components/api-health-page.tsx← Tableau de santé des APIs SFMC
│
├── automations/
│   ├── api/
│   │   ├── automations.api.ts          ← Appels backend Django (/automations/)
│   │   └── sfmc-automations.api.ts     ← Appels directs SFMC REST API (nouveau)
│   ├── hooks/
│   │   ├── use-automations.ts          ← useAutomations(), useAutomation(id) — via backend
│   │   └── use-sfmc-automations.ts     ← useSfmcAutomations(), useSfmcAutomationDetails() — via SFMC direct
│   ├── components/
│   │   ├── automations-page.tsx        ← Liste des automations (données backend)
│   │   ├── automation-detail-page.tsx  ← Détail d'une automation
│   │   └── sfmc-automations-panel.tsx  ← Panel SFMC direct : stats + table filtrable + steps expandables
│   └── types/
│       └── automation.types.ts         ← Types SFMC : SfmcAutomation, SfmcStep, SfmcActivity + mapping statusId
│
├── journeys/
│   ├── api/journeys.api.ts         ← Appels backend Django (/journeys/)
│   ├── hooks/use-journeys.ts       ← useJourneys(filters), useJourney(id)
│   ├── types/journey.types.ts      ← JourneyFilters { bu, status }
│   └── components/
│       ├── journeys-page.tsx        ← Liste avec filtres BU / Status
│       ├── journey-table.tsx        ← Composant tableau réutilisable
│       ├── journey-filters.tsx      ← Barre de filtres (select BU, select Status)
│       └── journey-detail-page.tsx  ← Détail d'un journey
│
├── overview/
│   ├── api/overview.api.ts         ← Appels KPIs globaux et activité
│   ├── hooks/use-overview.ts       ← useKpis(), useActivityChart()
│   ├── types/overview.types.ts     ← Types spécifiques à l'overview
│   ├── utils/overview.mapper.ts    ← Transformations de données pour l'affichage
│   └── components/
│       ├── overview-page.tsx        ← Dashboard principal
│       ├── kpi-card.tsx             ← Carte KPI (Total Journeys, Automations…)
│       ├── health-chart.tsx         ← Graphique d'activité (Recharts)
│       └── incident-summary.tsx     ← Résumé des incidents ouverts
│
└── settings/
    ├── api/settings.api.ts         ← CRUD des règles d'alerting
    ├── hooks/use-settings.ts       ← useSettingsRules(), useUpdateRule()
    └── components/settings-page.tsx← Page de configuration des règles
```

**Pourquoi ce dossier ?**
Isolation totale par domaine. Ajouter une feature = créer un nouveau dossier sans toucher aux autres.

---

## `routes/` — Déclaration des pages

Chaque fichier correspond à une URL. TanStack Router génère automatiquement le `routeTree.gen.ts` à partir de cette arborescence.

```
routes/
├── __root.tsx                  ← Layout racine (monte AppShell, Providers)
├── index.tsx                   ← Route "/" → redirige vers /overview
├── alerting/index.tsx          ← Route "/alerting"
├── analytics/index.tsx         ← Route "/analytics"
├── anomalies/
│   ├── index.tsx               ← Route "/anomalies"
│   └── $anomalyId.tsx          ← Route "/anomalies/:anomalyId" (détail)
├── api-health/index.tsx        ← Route "/api-health"
├── automations/
│   ├── index.tsx               ← Route "/automations"
│   └── $automationId.tsx       ← Route "/automations/:automationId" (détail)
├── journeys/
│   ├── index.tsx               ← Route "/journeys"
│   └── $journeyId.tsx          ← Route "/journeys/:journeyId" (détail)
└── settings/index.tsx          ← Route "/settings"
```

**Convention** : les fichiers `routes/` ne font qu'importer et monter les composants de `features/`. Toute la logique reste dans `features/`.

---

## `shared/` — Code partagé entre toutes les features

Tout ce qui est utilisé par **au moins deux features différentes** va ici.

```
shared/
├── api/
│   ├── http-client.ts          ← Instance Axios centrale (baseURL, intercepteurs Bearer token, refresh auto sur 401)
│   ├── auth-client.ts          ← Endpoints auth : login, refresh token, profil utilisateur
│   ├── alerting-client.ts      ← Endpoints alertes et anomalies (wrapping http-client)
│   ├── analytics-client.ts     ← Endpoints analytics et tendances
│   ├── collector-client.ts     ← Endpoints journeys, automations, KPIs, activité, api-health
│   ├── sfmc-client.ts          ← Client SFMC direct : OAuth2 client_credentials, cache token, pagination (nouveau)
│   └── query-keys.ts           ← Fabrique de clés TanStack Query (toutes les clés centralisées ici)
│
├── components/
│   ├── data-table/index.tsx    ← Tableau générique réutilisable (colonnes, tri)
│   ├── empty-state/index.tsx   ← Écran vide (aucun résultat, loading initial)
│   ├── status-badge/index.tsx  ← Badge coloré avec point clignotant selon le status
│   └── ui/index.ts             ← Barrel export : re-exporte tous les composants partagés
│
├── constants/index.ts          ← STALE_TIMES, POLLING_INTERVALS, BUS (Business Units), STATUSES
│
├── hooks/
│   ├── use-debounce.ts         ← Retarde la mise à jour d'une valeur (ex : champ de recherche)
│   ├── use-filters.ts          ← Gestion générique de filtres (state + setters)
│   └── use-polling.ts          ← Active/désactive le refetch automatique à intervalle
│
├── lib/
│   ├── cn.ts                   ← Fusion de classes Tailwind (clsx + tailwind-merge)
│   ├── env.ts                  ← Lecture des variables d'environnement (VITE_API_URL, VITE_SFMC_*)
│   ├── format-date.ts          ← Formatage de dates (locale, relatif…)
│   └── format-number.ts        ← Formatage de nombres (%, ms, k…)
│
└── types/index.ts              ← Types globaux : Status, AlertStatus, Severity, ApiResponse<T>, PaginatedResponse<T>
```

---

## `mocks/` — Données fictives (développement)

Permet de travailler sans backend via **Mock Service Worker (MSW)**.

```
mocks/
├── browser.ts      ← Configure le service worker MSW dans le navigateur
├── handlers.ts     ← Intercepte les appels HTTP et retourne des données fictives
└── data/index.ts   ← Jeu de données complet : journeys, automations, alertes, anomalies, KPIs…
```

**Pourquoi ?** Développement possible en avion, sans connexion au backend Django ni à SFMC.

---

## `shared/api/query-keys.ts` — Toutes les clés de cache

Centralise les clés TanStack Query pour éviter les doublons et garantir l'invalidation correcte du cache.

```typescript
queryKeys.journeys.list({ bu: 'France' })         // → ['journeys', 'list', { bu: 'France' }]
queryKeys.automations.detail(42)                  // → ['automations', 'detail', 42]
queryKeys.sfmcAutomations.list()                  // → ['sfmc-automations', 'list']
queryKeys.sfmcAutomations.detail('uuid-123')      // → ['sfmc-automations', 'detail', 'uuid-123']
```

---

## `shared/lib/env.ts` — Variables d'environnement

Point d'accès unique aux variables `.env`. Ne jamais lire `import.meta.env` directement dans les composants.

```typescript
env.apiUrl           // URL du backend Django
env.sfmc.clientId    // Client ID SFMC
env.sfmc.authBaseUri // https://XXXXX.auth.marketingcloudapis.com
env.sfmc.restBaseUri // https://XXXXX.rest.marketingcloudapis.com
env.isDev / env.isProd
```

---

## Flux de données — Comment une feature fonctionne

```
[Route /automations]
       │
       ▼
[features/automations/components/automations-page.tsx]
       │  importe
       ▼
[features/automations/hooks/use-automations.ts]          ← TanStack Query
       │  appelle
       ▼
[features/automations/api/automations.api.ts]            ← wrapper feature
       │  appelle
       ▼
[shared/api/collector-client.ts]                         ← client HTTP générique
       │  utilise
       ▼
[shared/api/http-client.ts]                              ← Axios + token + refresh
       │
       ▼
[Backend Django → http://localhost:8000/api/automations/]
```

**Pour SFMC direct (nouveau) :**

```
[features/automations/hooks/use-sfmc-automations.ts]
       │
       ▼
[features/automations/api/sfmc-automations.api.ts]
       │
       ▼
[shared/api/sfmc-client.ts]  ← OAuth2 + cache token + pagination
       │
       ▼
[SFMC REST API → /automation/v1/automations]
```

---

## Conventions de nommage

| Type de fichier   | Convention          | Exemple                        |
|-------------------|---------------------|--------------------------------|
| Composant React   | PascalCase          | `AutomationsPage.tsx`          |
| Hook              | camelCase + `use-`  | `use-automations.ts`           |
| API wrapper       | camelCase + `.api`  | `automations.api.ts`           |
| Client HTTP       | camelCase + `-client` | `collector-client.ts`        |
| Types             | camelCase + `.types`| `automation.types.ts`          |
| Store Zustand     | camelCase + `-store`| `session-store.ts`             |
| Route dynamique   | `$param.tsx`        | `$automationId.tsx`            |

---

## Variables d'environnement (`.env`)

| Variable                    | Rôle                                              |
|-----------------------------|---------------------------------------------------|
| `VITE_API_URL`              | URL du backend Django (ex : `http://localhost:8000/api`) |
| `VITE_APP_ENV`              | Environnement (`development` / `production`)      |
| `VITE_SFMC_CLIENT_ID`       | Client ID du Connected App SFMC                  |
| `VITE_SFMC_CLIENT_SECRET`   | Client Secret SFMC (**ne pas committer**)        |
| `VITE_SFMC_AUTH_BASE_URI`   | URL d'authentification SFMC                      |
| `VITE_SFMC_REST_BASE_URI`   | URL de l'API REST SFMC                           |
| `VITE_SFMC_ACCOUNT_ID`      | MID de la Business Unit (optionnel)              |

> **Important** : Les variables `VITE_*` sont incluses dans le bundle JavaScript et donc visibles par quiconque accède à l'app. Pour la production, les appels SFMC doivent passer par le backend Django.

---

## Scripts disponibles

```bash
cd frontend
npm run dev      # Lance le serveur de développement (Vite) sur http://localhost:5173
npm run build    # Compile pour la production dans dist/
npm run preview  # Prévisualise le build de production
```
