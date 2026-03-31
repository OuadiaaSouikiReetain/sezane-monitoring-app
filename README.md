# SFMC Monitoring — Control Center

A modern enterprise monitoring dashboard for **Salesforce Marketing Cloud (SFMC)**.
Built with React 18, Vite, Tailwind CSS, and Recharts.

---

## Preview

> Dark mode · Real-time clock · 8 monitoring modules · Interactive charts · Color-coded alerts

---

## Tech Stack

| Tool | Version | Purpose |
|---|---|---|
| React | 18 | UI framework |
| Vite | 5 | Build tool & dev server |
| Tailwind CSS | 3 | Utility-first styling |
| Recharts | 2 | Charts & visualizations |
| Lucide React | latest | Icons |

---

## Prerequisites

Make sure you have installed:

- [Node.js](https://nodejs.org/) **v18 or higher**
- npm **v9 or higher**

Verify your versions:

```bash
node -v
npm -v
```

---

## Getting Started

### 1. Clone the repository

```bash
git clone https://github.com/your-username/your-repo-name.git
cd your-repo-name/sfmc-app
```

### 2. Install dependencies

```bash
npm install
```

### 3. Start the development server

```bash
npm run dev
```

The app will be available at **http://localhost:5173**

---

## Available Scripts

| Command | Description |
|---|---|
| `npm run dev` | Start dev server with hot reload |
| `npm run build` | Build for production (outputs to `dist/`) |
| `npm run preview` | Preview the production build locally |

---

## Project Structure

```
sfmc-app/
├── public/
├── src/
│   ├── components/
│   │   ├── Header.jsx        # Top bar with search, clock, alerts
│   │   ├── KPICard.jsx       # Metric cards with trend indicators
│   │   ├── Sidebar.jsx       # Navigation sidebar
│   │   └── StatusBadge.jsx   # Colored status pills
│   ├── data/
│   │   └── mockData.js       # All mock data (journeys, APIs, alerts...)
│   ├── pages/
│   │   ├── Overview.jsx      # Global dashboard
│   │   ├── JourneyControl.jsx
│   │   ├── AutomationOps.jsx
│   │   ├── APIHealthHub.jsx
│   │   ├── AnomalyCenter.jsx
│   │   ├── Alerting.jsx
│   │   ├── Analytics.jsx
│   │   └── Settings.jsx
│   ├── App.jsx               # Root component & routing
│   ├── main.jsx              # Entry point
│   └── index.css             # Global styles & Tailwind
├── index.html
├── tailwind.config.js
├── vite.config.js
└── package.json
```

---

## Modules

| Module | Description |
|---|---|
| **Overview** | Global KPIs, activity chart (24h), system health donut, recent anomalies |
| **Journey Control** | Journey list with BU/status filters, SLA progress bars |
| **Automation Ops** | Automation jobs status, delay detection |
| **API Health Hub** | Per-API latency cards, bar chart comparison, summary table |
| **Anomaly Center** | Centralized anomaly feed with severity and business impact |
| **Alerting** | Alert list with escalation tracking, channels, and status |
| **Analytics Studio** | Performance trend chart, KPI evolution, Business Unit breakdown |
| **Settings / Rules** | Toggle monitoring rules, SLA config, escalation policy |

---

## Design System

| Token | Value |
|---|---|
| Background | `#0B0F19` |
| Surface | `#0F172A` |
| Card | `#111827` |
| Primary | `#6366F1` (Indigo) |
| Success | `#22C55E` |
| Warning | `#F59E0B` |
| Danger | `#EF4444` |
| Info | `#38BDF8` |

---

## Build for Production

```bash
npm run build
```

Output is in the `dist/` folder — ready to deploy on Vercel, Netlify, or any static host.

### Deploy to Vercel (one command)

```bash
npx vercel --cwd .
```

### Deploy to Netlify

```bash
npx netlify deploy --dir=dist --prod
```

---

## License

MIT
