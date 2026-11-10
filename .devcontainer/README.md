<!-- Owner: Orion Kabeza (DevOps) · AI-assisted draft, see AI_USE_LOG.md -->
# Run StrokeCare in GitHub Codespaces

Nothing to install on your computer. You need a GitHub account and a browser.

1. On the repository page, choose **Code → Codespaces → Create codespace on main**
   (or use the "Open in GitHub Codespaces" button in the main README).
2. Wait for the first build. It installs the packages, builds the web app, creates the database and loads
   fictional demo data. This takes a few minutes the first time.
3. When it is ready, the app opens in a preview tab. If it does not, open the **Ports** tab and open port **8000**
   in the browser.
4. Sign in with one of the demo accounts. The password for all of them is in `.demo-credentials.txt` in the root
   folder (it is created for your codespace only and is never committed). It is also printed at the end of the
   creation log.

| Role | Email |
|---|---|
| Stroke survivor | `demo-survivor@example.org` |
| Prevention user | `demo-prevention@example.org` |
| Caregiver | `demo-caregiver@example.org` |
| Clinician | `demo-clinician@example.org` |
| Community health worker | `demo-chw@example.org` |
| Admin | `demo-admin@example.org` |

The data is fictional. Do not enter real health information in a codespace.

## What starts, and where

| | |
|---|---|
| App and API together | port 8000 (the web app is built once, and Django serves it) |
| API documentation | `/api/v1/docs/` on the same address |
| Alert worker | runs in the background every 15 minutes |
| Database | PostgreSQL 16 in a second container, data kept between stops and starts |
| Logs | `/tmp/strokecare-web.log` and `/tmp/strokecare-worker.log` |

Ports are **private** by default: only you, signed in to GitHub, can open the address. Keep it that way.

## Everyday commands

```bash
cd backend && .venv/bin/python -m pytest            # backend tests
cd frontend && npm test                             # frontend tests
bash .devcontainer/start.sh                         # restart the server and worker
```

After changing frontend code, run `cd frontend && npm run build`, then reload the page. For hot reload instead,
run `npm run dev` in `frontend/` and open port 5173 (the API stays on 8000).

## If something goes wrong

- **The page says the host is not allowed or the sign-in fails with a network error:** the address does not end in
  `.app.github.dev`. Use the address from the Ports tab.
- **Nothing on port 8000:** run `bash .devcontainer/start.sh`, then read `/tmp/strokecare-web.log`.
- **Start again from scratch:** delete the codespace and create a new one. This removes the demo data and database.
- **Cost:** a codespace uses your GitHub plan's free monthly allowance (check GitHub's current limits). Stop it when
  you are done: it stops by itself after a period of inactivity.

## Status

The setup scripts were run and checked in a normal Linux environment against PostgreSQL 16. The dev container
itself (the two containers, port forwarding) has not been built by the person who wrote it, because no Docker was
available there. If the first Codespace fails to build, send the creation log to Orion.
