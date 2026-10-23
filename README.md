# NETFIX AI — HTML / CSS / JavaScript Edition

A complete conversion of the **NETFIX AI** legal & tax AI platform (MARG GROUP) from
**React + TypeScript** to **plain HTML, CSS and JavaScript** — with the backend
converted from **TypeScript to plain JavaScript**.

> Same product, same UI, same functionality — no TypeScript, no React, no build step
> for the frontend.

---

## What was converted

| Part | Before | After |
|------|--------|-------|
| **Frontend** (user app) | React 19 + TypeScript + Vite + Tailwind | **Vanilla HTML + CSS + JavaScript** (single `index.html`, no build step) |
| **Admin portal** | React 19 + TypeScript | *Pending — Phase 4 (see plan below)* |
| **Backend** (API + AI engine) | Express + TypeScript (`tsx`) | **Plain JavaScript** (Express, `node src/index.js`) |

### Backend (done)
- All **43** TypeScript source files transpiled to plain `.js` (ES modules, types stripped).
- Same directory structure: `src/{index.js, routes/, controllers/, services/, middleware/, types/}`.
- No `tsx`/`tsc` needed — runs directly with Node.
- **Verified:** server boots, `/api/v1/health` returns OK, demo-login and login endpoints return correct JSON.

### Frontend (done — core)
- **Landing page** — video background, sticky navbar, hero, About, Roles, How It Works, FAQ accordion, Contact, Footer (with privacy/terms modals).
- **Auth flow** — Role Selection → Login → OTP verify, Register → OTP verify, Demo Login modal, Quick Guide modal.
- **Role routing** — all 7 role dashboards route correctly (placeholder shells for now, see Phase 3).
- **Wired to the real backend** via `fetch` (`/auth/login`, `/auth/demo-login`, `/auth/register`, `/auth/verify-otp`, `/auth/resend-otp`, `/auth/me`, `/auth/logout`).
- Styling preserved exactly: **Tailwind via Play CDN** (same class names as the original) + the project's custom CSS (`netfix-card` 3D tilt, gradient buttons, glass effects) in `css/styles.css`.
- Icons via **Lucide** (replaces `lucide-react`).

---

## Project structure

```
netfix-ai-js/
├── backend/                  # Plain-JavaScript Express API
│   ├── src/
│   │   ├── index.js          # App entry (node src/index.js)
│   │   ├── routes/           # 16 route files
│   │   ├── controllers/      # 14 controller files
│   │   ├── services/         # 11 services (Ultron orchestrator, RBAC, Gemini, Supabase, …)
│   │   ├── middleware/       # auth middleware
│   │   └── types/            # (now empty — types were stripped)
│   ├── migrations/           # 6 SQL migrations (unchanged)
│   ├── package.json          # No TypeScript / tsx
│   └── .env.example
└── frontend/                 # Vanilla HTML/CSS/JS (no build step)
    ├── index.html            # Single entry — loads Tailwind CDN + Lucide + our JS
    ├── css/styles.css        # Custom styles (converted from index.css)
    ├── js/
    │   ├── landingData.js    # Data (roles, FAQ, nav, …)
    │   ├── authService.js    # API client (fetch)
    │   ├── components.js     # Landing sections + 3D-tilt card + helpers
    │   ├── auth.js           # Auth components (login/register/OTP/role)
    │   └── app.js            # Router + all event wiring
    ├── backend.mp4           # Landing video background
    ├── ai_robot_transparent.png
    ├── favicon.svg
    └── …
```

---

## How to run

### 1. Backend (port 5000)
```bash
cd backend
npm install
cp .env.example .env        # then fill in your keys (optional for a first run)
npm start                   # → node src/index.js
```
- Health check: `http://localhost:5000/api/v1/health`
- Works with **no env vars** for a first run (falls back to in-memory mock data +
  rule-based AI). Set `GEMINI_API_KEY`, `SUPABASE_*`, `BREVO_API_KEY`, etc. for full functionality.

### 2. Frontend (port 3000)
No build step — serve the folder statically:
```bash
cd frontend
python3 -m http.server 3000
# or: npx serve .
```
- Open `http://localhost:3000`
- The frontend calls the backend at `http://localhost:5000/api/v1` (CORS is enabled on the backend for `localhost:3000`).

> **Demo login:** pick a role → *Login* → **Demo Login** → use the shown credentials
> (e.g. `demo.client@netfixai.test` / `Demo123`) → you're signed in.

---

## Phase plan (remaining work)

The core (landing + auth + role routing + backend) is complete and verified. The rest
is the **7 role dashboards** and the **admin portal**, which are large (100+ React
components). They will be converted in this order:

- **Phase 3a — Client dashboard** (most-requested role): My Matters, Documents,
  Requests, Messages, Reports, Ask-AI modal.
- **Phase 3b — Advocate dashboard**: Assigned Matters, Deadlines, Documents,
  Legal Research, Evidence, Ask-AI.
- **Phase 3c — Employee dashboard**: Case workspace (Overview, Facts, Research,
  Citations, Deadlines, Drafts, Evidence, Contradictions, Chronology, Risk tabs), Reports.
- **Phase 3d — Management dashboard**: Business Overview, Portfolio, Approvals,
  Risk, Performance, Reports.
- **Phase 3e — Tenant + Regulator/Auditor dashboards**.
- **Phase 4 — Admin portal** (`admin/`): 3-step auth (password → TOTP → Turnstile),
  User Management, AI Agents, Audit Trail, Access Requests, Reports, Settings.
  (This becomes a second static site, e.g. `frontend-admin/`, served on port 3001.)

Each phase follows the same pattern already established:
1. Convert the React components to plain JS template functions.
2. Wire the real backend endpoints with `fetch`.
3. Add to the router in `app.js`.
4. Verify with a DOM smoke test.

---

## Notes & known considerations

- **Tailwind via Play CDN** keeps the UI pixel-identical with zero build tooling. For a
  production deployment you may want to compile Tailwind to a static CSS file (the
  class names are already all present in the markup).
- The **backend still contains the original demo backdoors** from the source project
  (hardcoded demo credentials, OTP `123456` fallback, unvalidated password-reset token,
  etc.). These were carried over as-is to preserve behavior — **remove them before any
  real deployment.**
- The **AI "Ultron" engine, RBAC, audit logging, and Supabase integration** are all
  intact in the plain-JS backend and behave exactly as in the TypeScript original.
- `types/index.js` is now empty (it only held TypeScript type definitions).