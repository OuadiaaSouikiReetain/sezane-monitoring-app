# SFMC Monitor — Control Center

Dashboard de monitoring enterprise pour **Salesforce Marketing Cloud (SFMC)**.  
Affiche en temps réel les automations, journeys, KPIs de fiabilité, historique d'exécution et contenu des activités SQL/Script.

---

## Architecture

```
sezane-monitoring-app/
├── backend/     Django REST API — proxy sécurisé vers SFMC (REST + SOAP)
└── frontend/    React 18 + Vite + Tailwind CSS
```

| Couche | Stack |
|--------|-------|
| Frontend | React 18, Vite, Tailwind CSS, TanStack Query, Recharts |
| Backend | Django 4, Django REST Framework, Celery, Redis |
| SFMC | REST API v1 + SOAP API (QueryDefinition, Script) + Data Views |

---

## Prérequis

- **Python** 3.11+
- **Node.js** 18+ et npm 9+
- **Redis** (pour Celery)
- Un compte SFMC avec une **API Installed Package** (client_id + client_secret)

---

## Configuration

### 1. Variables d'environnement backend

Créer `backend/.env` :

```env
SFMC_CLIENT_ID=your_client_id
SFMC_CLIENT_SECRET=your_client_secret
SFMC_AUTH_BASE_URI=https://xxxxxxxxxxxx.auth.marketingcloudapis.com
SFMC_REST_BASE_URI=https://xxxxxxxxxxxx.rest.marketingcloudapis.com
SFMC_ACCOUNT_ID=your_mid          # optionnel

SECRET_KEY=django-secret-key
DEBUG=True
ALLOWED_HOSTS=localhost,127.0.0.1
```

> L'URL SOAP est dérivée automatiquement depuis `SFMC_REST_BASE_URI` (`.rest.` → `.soap.`).

---

## Lancer l'application

### Backend (Django)

```bash
cd backend

# 1. Créer et activer le virtualenv
python -m venv venv
venv\Scripts\activate        # Windows
# source venv/bin/activate   # Mac/Linux

# 2. Installer les dépendances
pip install -r requirements.txt

# 3. Appliquer les migrations
python manage.py migrate

# 4. Démarrer le serveur
python manage.py runserver
```

API disponible sur **http://localhost:8000**

#### (Optionnel) Celery — tâches de sync planifiées

```bash
# Dans un terminal séparé
celery -A config worker -l info

# Dans un autre terminal
celery -A config beat -l info
```

---

### Frontend (React)

```bash
cd frontend

# 1. Installer les dépendances
npm install

# 2. Démarrer le serveur de développement
npm run dev
```

App disponible sur **http://localhost:5173**

---

## Scripts disponibles

### Backend

| Commande | Description |
|----------|-------------|
| `python manage.py runserver` | Serveur de développement |
| `python manage.py migrate` | Appliquer les migrations DB |
| `python manage.py shell` | Shell Django interactif |
| `celery -A config worker -l info` | Worker Celery |
| `celery -A config beat -l info` | Scheduler Celery Beat |

### Frontend

| Commande | Description |
|----------|-------------|
| `npm run dev` | Dev server avec hot reload |
| `npm run build` | Build production (`dist/`) |
| `npm run preview` | Preview du build production |

---

## Endpoints API backend

| Méthode | Endpoint | Description |
|---------|----------|-------------|
| GET | `/api/automations/` | Liste toutes les automations |
| GET | `/api/automations/{id}/` | Détail d'une automation |
| GET | `/api/automations/{id}/activities/` | Steps + activités enrichies (SQL, Script, etc.) |
| GET | `/api/automations/{id}/executions/` | Historique d'exécution depuis ExecutionLog DE |
| GET | `/api/automations/{id}/kpis/` | KPIs fiabilité, performance, santé |
| GET | `/api/journeys/` | Liste tous les journeys |
| GET | `/api/journeys/{id}/executions/` | Runs du journey |

---

## Modules

| Module | Description |
|--------|-------------|
| **Overview** | KPIs globaux, santé système |
| **Journey Control** | Liste des journeys avec statut, KPIs, historique de runs |
| **Automation Ops** | Automations avec steps, activités SQL/Script/Email/FileTransfer, KPIs fiabilité |
| **API Health Hub** | Latence des APIs SFMC |
| **Anomaly Center** | Feed d'anomalies centralisé |
| **Alerting** | Règles d'alertes et escalation |
| **Analytics Studio** | Tendances de performance |
| **Settings / Rules** | Configuration du monitoring |

---

## SFMC — Data Extensions requises

L'app lit depuis deux DEs dans SFMC :

### `ExecutionLog`
Stocke les runs d'automations et journeys. Remplie par des Query Activities SFMC.

| Champ | Type | Remarque |
|-------|------|----------|
| `id_log` | Text(36) | **Primary Key** — ID stable (`AutomationInstanceID`) |
| `sfmc_instance_id` | Text(100) | Clé de groupement |
| `component_type` | Text(50) | `automation` ou `journey` |
| `component_id` | Text(100) | SFMC ID du composant |
| `status` | Text(20) | `success`, `error`, `running` |
| `start_time` | Date | |
| `duration_seconds` | Number | |
| `error_message` | Text(500) | |

> ⚠️ `id_log` doit être configuré comme **Primary Key** et la DE en mode **Append** pour un comportement upsert.

### `KPI_Value`
Stocke les KPIs pré-calculés. Même principe — Primary Key sur `id_value`.

---

## Licence

MIT
