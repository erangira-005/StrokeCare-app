<!-- Owner: Malaika Elohim Isingizwe Mukama (Scrum Master) · AI-assisted draft, see AI_USE_LOG.md -->
# StrokeCare

Stroke prevention and recovery at home, for Rwanda, in English, Kinyarwanda and French.
For stroke survivors, prevention users, caregivers, clinicians and community health workers.
**It records and summarises what people enter. It never diagnoses, prescribes, scores risk, or delays emergency care.**

Team 3 · Foundations Project · ALU. Version 2: the first prototype lived in `EricaSheja/stroke_care_development`.

## What it does

| For | Features |
|---|---|
| Survivors and prevention users | Today screen, daily check-in (urgent answers show emergency guidance at once), blood pressure with a chart, medicine ticks, talk board for aphasia, questions and voice notes for the next visit, care-team messages, care calendar, accessibility settings, data download and deletion |
| Caregivers | Alerts (urgent answer, doses not marked, no check-in), act on the person's behalf, family care calendar with handover notes, messages |
| Clinicians | Caseload with "needs a look" filters (facts only), seven-day summary, write the recovery plan and medicine list, plan templates, listen to voice notes, messages |
| Community health workers | People who invited them, home visits recorded offline and sent later, readings during visits |
| Everyone, signed in or not | Emergency help, talk board, education |

## Stack

| Layer | Choice |
|---|---|
| Backend | Django 5.2 + Django REST Framework, Python 3.13 |
| Database | PostgreSQL 16 (no SQLite anywhere; voice notes are stored in PostgreSQL too) |
| Auth | bcrypt password hashes, 15-minute JWT access tokens, rotating refresh tokens revoked on the server |
| Frontend | Vue 3 + Vite + TypeScript, Pinia, Vue Router, vue-i18n, Phosphor icons, uPlot; installable PWA that works offline |
| Jobs | `run_scheduler` worker, or a guarded HTTP endpoint called by GitHub Actions every 15 minutes |
| Tests | pytest (backend), Vitest (frontend), plus a browser run of every role's main flows in the build session |
| Delivery | GitHub Actions (backend + frontend checks), one Docker image serving the API and the app |

## Run it locally

```bash
docker compose up --build        # PostgreSQL + app + scheduler worker on http://localhost:8000 (not yet run: see docs/DEPLOYMENT.md)
```

Quickest way without Docker (one server, app and API together). You need Python 3.13, Node 22, and a PostgreSQL 16 you can reach. Create the database once:

```bash
psql -U postgres -c "CREATE USER strokecare PASSWORD 'strokecare' CREATEDB" -c "CREATE DATABASE strokecare OWNER strokecare"
```

```bash
cd frontend && npm ci && npm run build          # builds the app into frontend/dist
cd ../backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export DJANGO_DEBUG=1 ALLOW_DEMO_DATA=1 DATABASE_URL=postgres://strokecare:strokecare@localhost:5432/strokecare
python manage.py migrate
python manage.py seed_demo --password 'choose-a-demo-password'
python manage.py runserver                      # open http://localhost:8000
```

`seed_demo` lists the fictional accounts (demo-survivor, demo-caregiver, demo-clinician, demo-chw, demo-prevention, demo-admin, all at example.org). Use the password you chose. The data is fictional and must never be used with real people.

For development with hot reload (API and app on separate ports), with your own PostgreSQL:

```bash
cd backend
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
export DJANGO_DEBUG=1 DATABASE_URL=postgres://strokecare:strokecare@localhost:5432/strokecare
python manage.py migrate
python manage.py seed_demo        # fictional demo accounts for every role; prints their password
python manage.py runserver        # API on :8000, API docs at /api/v1/docs/
```

```bash
cd frontend
npm ci
npm run dev                       # app on http://localhost:5173, talking to the API on :8000
```

```bash
cd backend && pytest              # 304 tests; needs DATABASE_URL
cd frontend && npm test && npm run build
```

## Where things are

| | |
|---|---|
| `backend/apps/accounts` | users, consent, accessibility preferences, sign-in |
| `backend/apps/care` | sharing links, caregiver alerts, the scheduler |
| `backend/apps/health` | blood pressure, plan, check-in, medicines, visit questions, voice notes, summary, reminders |
| `backend/apps/messaging`, `family`, `community` | care-team messages; care calendar and handover notes; CHW home visits |
| `backend/apps/content` | education, emergency guidance and verified contacts, talk board |
| `backend/apps/common`, `audit` | the single access-control module, error format, audit log |
| `frontend/src` | the Vue app; `locales/` holds the three languages |
| `docs/` | architecture, roles matrix, safety rules, data model, deployment, **open questions and launch blockers** |
| `OWNERS.json` | who owns which file (`python tools/make_handoff.py --check`) |

**Before this goes near real people, read `docs/OPEN_QUESTIONS.md`.** Several launch blockers are not code.
