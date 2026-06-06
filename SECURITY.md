# Security Standing Orders — Trent's Command Center

Read this at the start of every session. This is the security source of truth for all agents working on TCC.

---

## Threat Model

TCC is Michael's operations hub — it has visibility into all five of his projects and holds API keys for health pings, Whisper, and Gabriel. A breach here is a breach across everything. Treat it accordingly.

---

## Non-Negotiable Rules

### Secrets
- All API keys live in `.env.local` and Vercel Environment Variables only
- `OPENAI_API_KEY`, `SUPABASE_SERVICE_ROLE_KEY`, project health URLs with embedded tokens — server-side only
- Never log secrets. Never expose them in client-side code.
- If a secret leaks to git: rotate immediately, treat as compromised

### API Route Auth
Every route that reads or writes data must verify the session first:

```js
const { data: { user }, error } = await supabase.auth.getUser()
if (!user || error) return new Response('Unauthorized', { status: 401 })
```

### Supabase RLS
- RLS enabled on every table — always
- Tasks table: users only see their own tasks
- Activity feed: scoped to authenticated users only

### Voice Input (Whisper)
- Audio is sent to OpenAI Whisper server-side — never from the browser directly
- The browser sends the audio blob to `/api/voice` — the server calls Whisper
- `OPENAI_API_KEY` never touches the browser

### Input Validation
- All user text through `sanitizeUserInput()` before DB writes or AI calls
- Voice transcriptions sanitized before being passed to Gabriel

---

## Security Checklist — Before Any Deploy

- [ ] No secrets in git history
- [ ] All API routes have auth check before first DB call
- [ ] RLS enabled on every new table
- [ ] Voice route sends audio server-side only
- [ ] Health route returns 200: `curl https://trentscommandcenter.app/api/health`
- [ ] Security headers live: X-Frame-Options, HSTS, X-Content-Type-Options

---

## Current Security Status

| Item | Status |
|------|--------|
| .env.local in git | ✅ Covered by .gitignore |
| RLS on all tables | ⚠️ Verify after schema deploy |
| Auth on all routes | ⚠️ Verify each route.js |
| Source maps off | ✅ next.config.js |
| Security headers | ✅ next.config.js |
| Whisper server-side | ⚠️ Verify voice route |
