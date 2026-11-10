<!-- Owner: Emmanuel Happy Rangira (Frontend developer) · AI-assisted draft, see AI_USE_LOG.md -->
# Frontend

Vue 3 + Vite + TypeScript. Design: https://claude.ai/artifact/4Vokfg2stQ1X6iAQnUSvdE (private until shared).

```bash
npm ci
npm run dev        # http://localhost:5173, proxies /api to the backend on :8000
npm test           # Vitest: translations complete, API client, offline queue
npm run build      # type check + production build into dist/ (Django serves it)
```

## Layout

| Path | What |
|---|---|
| `src/api/client.ts` | every API call: token, one refresh on expiry, plain error messages, offline queueing |
| `src/api/offline.ts` | entries made without signal wait here and are sent in order when back online |
| `src/stores/` | signed-in person (`auth`), display preferences (`prefs`, saved to the account) |
| `src/i18n.ts`, `src/locales/` | English, Kinyarwanda, French. English is the fallback |
| `src/styles/tokens.css` | the design tokens from the canvas (light, dark, high contrast, easy-read font, motion) |
| `src/composables/useSpeech.ts` | read-aloud with the phone's own voice (no recordings) |
| `src/views/patient`, `care`, `clinician`, `chw`, `shared`, `auth` | screens by audience |

## Rules the UI follows (from docs/SAFETY.md)

- Blood pressure is plain numbers. No colour, badge, arrow or "normal range".
- The Emergency button is on every screen, and red is used for nothing else.
- An answer in a question's `urgent_values` shows emergency guidance at once, before anything is sent.
- Draft content says it is a draft. Messages and alerts say they are not an emergency service.
- No streaks, scores or confetti.
- Personal health data is never cached by the service worker. Only public content (education, talk board,
  emergency, CHW checklist) is cached for offline use.

## Known limits

- Tokens are kept in `localStorage` so people stay signed in on their own phone. The strict Content Security
  Policy (scripts from this site only) is the main protection against them being read by injected code.
- Read-aloud depends on the phone having a voice for the language. Kinyarwanda voices are rare; the app then
  shows the words large instead.
- Some browsers cannot format dates in Kinyarwanda and show English dates instead.
