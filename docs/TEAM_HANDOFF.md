<!-- Owner: Malaika Elohim Isingizwe Mukama (Scrum Master) · AI-assisted draft, see AI_USE_LOG.md -->
# How the team takes over the code

Each person gets a zip of **their own files** (`handoff/<Name>.zip`, made by `python tools/make_handoff.py`). The
folder layout inside is the real layout, so unzip it at the root of your clone.

## Steps for everyone

1. Clone `orionkabeza/StrokeCare` and create a branch: `git checkout -b feature/<your-area>`.
2. Unzip your file into the repository root. Read every file. **You must be able to explain your files** for the technical presentation: they are yours.
3. Run the tests (`cd backend && pytest`) before and after any change you make.
4. Make it yours: fix what you disagree with, change what is wrong, add what is missing. Commit in small commits **under your own name**.
5. Open a pull request using the template; link your Trello card; one teammate approves.
6. Add or update your row in `AI_USE_LOG.md` for anything you took from AI.

## Merge order

The files depend on each other, so the first two must land first.

| Order | Who | Why first |
|---|---|---|
| 1 | Orion | project settings, Docker, CI, test setup: nothing runs without these |
| 2 | Kenneth | access control, links, audit log: other apps import them |
| 3 | Axel | users, health records, API wiring (`strokecare/urls.py`) |
| 4 | Erica | content app, fixtures, safety tests, translations |
| 5 | Malaika | README, process files |
| 6 | Happy | `frontend/` (the app). Erica's zip holds the three translation files it needs (`frontend/src/locales/`) |

Migrations are committed with the app that owns them (they are in each person's zip).

## Reviewers (from the team report)

Kenneth ↔ Axel review each other. Axel reviews Happy. Malaika ↔ Erica. Kenneth reviews Orion.

## Per-person starting points

| Person | Start here | Questions you should be able to answer |
|---|---|---|
| Orion | `settings.py`, `Dockerfile`, `.github/workflows/ci.yml` | Why does the app refuse to start without a secret and a PostgreSQL URL? What is untested? |
| Kenneth | `apps/common/access.py`, `apps/care/`, `test_role_matrix.py` | Why 404 for strangers but 403 for a missing scope? How does withdrawing consent cut access? |
| Axel | `apps/accounts/`, `apps/health/models.py`, `services.py` | Why are check-in answers a table, not JSON? How is "one tick per task per day" guaranteed? |
| Erica | `apps/content/`, `docs/SAFETY.md`, `test_safety.py`, `fixtures/` | Where is each safety rule enforced? What are the launch blockers? |
| Happy | `frontend/src/api/client.ts`, `src/router.ts`, `src/views/patient/CheckIn.vue` | How does the offline outbox work? Why is health data never cached by the service worker? |
| Malaika | `README.md`, `OWNERS.json`, this file | Which open questions are decisions, and who owns each? |

## A note on course rules

The course requires any AI use to be disclosed with every prompt, every output and how it was changed, and says
individual marks follow your own coding contributions. These files were drafted with AI assistance. Do not present
them as solely your own work: record them in `AI_USE_LOG.md`, change and understand them, and check with the
teaching team how they want this handled.
