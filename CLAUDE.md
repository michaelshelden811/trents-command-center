## Project Overview

**Trent's Command Center** — The central operations hub for Michael Shelden's agent ecosystem. Monitors all five projects (PeerBill, GrantWatch, Pocket Peer Support, BSP Board, Trent), manages the agent task queue, surfaces recommendations from Gabriel and other angel agents, and provides voice input via Whisper. Used by both Michael and his agents — both read and write.

**Owner:** Michael Shelden (michaelshelden811@gmail.com)
**Domain:** trentscommandcenter.app
**Status:** In development
**Primary agent:** Gabriel (the Messenger)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js App Router (JavaScript — NOT TypeScript in API routes) |
| Database | Supabase (Postgres) |
| Auth | Supabase Auth — magic link |
| AI | OpenAI GPT-4o (Gabriel responses) + Whisper (voice transcription) |
| Hosting | Vercel |
| Notifications | Discord via Trent bot |
| Voice | OpenAI Whisper — browser mic → server transcription |

---

## Project File Structure

```
trents-command-center/
├── app/
│   ├── page.tsx                        ← Main dashboard (cyberpunk neon UI)
│   ├── login/page.tsx
│   └── api/
│       ├── health/route.js             ← TCC health endpoint
│       ├── ping/route.js               ← Pings all project health routes
│       ├── tasks/route.js              ← Task queue CRUD
│       ├── voice/route.js              ← Whisper transcription endpoint
│       └── gabriel/route.js            ← Gabriel AI response endpoint
├── lib/
│   ├── supabase.js                     ← Supabase client factory
│   ├── sanitize.js                     ← Input sanitizer
│   └── logger.js                       ← PII-safe structured logger
├── database/
│   └── schema.sql                      ← Run in Supabase SQL editor (once)
├── components/
├── .env.local                          ← Never commit
├── next.config.js                      ← Security headers, source maps off
├── vercel.json
├── CLAUDE.md                           ← This file
├── SECURITY.md
└── AGENTS.md
```

---

## The Five Projects Monitored

| Project | Health URL | Status |
|---------|-----------|--------|
| PeerBill | https://peer-bill.vercel.app/api/health | LIVE |
| GrantWatch | TBD | In dev |
| Pocket Peer Support (PPS) | TBD | In dev |
| BSP Board | TBD | In dev |
| Trent | Manual ping (VPS) | ONLINE |

---

## Agent Roster

| Agent | Role | Status |
|-------|------|--------|
| Gabriel | The Messenger — primary interface, coordination | Active |
| Trent | Discord relay, notifications | Active |
| Michael | The Warrior — security agent | Planned |
| Raphael | The Healer — monitoring/repair agent | Planned |
| Uriel | The Light — data/insights agent | Planned |

---

## What Is Currently Working

*(Agents: update this section as features ship)*

- [x] Project scaffolded
- [ ] Supabase schema deployed
- [ ] Auth working
- [ ] Health route live at trentscommandcenter.app/api/health
- [ ] Project health ping API
- [ ] Task queue wired to DB
- [ ] Voice input (Whisper)
- [ ] Gabriel AI response endpoint
- [ ] Dashboard UI deployed

---

## ⚠️ Hard Rules — Agents Must Follow These

1. **API routes are `.js`** — never `.ts`; no TypeScript syntax in `.js` files
2. **Supabase client inside handler** — never initialized at module level
3. **Auth check before every DB operation** — no exceptions
4. **RLS enabled on every table** — never disable it
5. **`SUPABASE_SERVICE_ROLE_KEY` and `OPENAI_API_KEY` = server-side only** — never in frontend code
6. **Full file rewrites** — never partial patches
7. **PowerShell: separate lines** — never `&&` chain
8. **One change at a time** — no unsolicited refactoring
9. **Notifications via Trent (Discord)** — never Slack
10. **Vercel only** — no Cloudflare

---

## Design Language — CYBERPUNK NEON (different from other projects)

This project uses a unique design system — do not use the standard Michael dark theme here.

```
Background:       #020408
Panel bg:         #060d12 / #0a1520
Neon cyan:        #00f5ff  (primary accent)
Neon green:       #39ff14  (success / online)
Neon pink:        #ff2d78  (alerts / mic button)
Neon yellow:      #d4f576  (in-progress / voice input)
Neon purple:      #b060ff  (VPS / Trent)
Warning orange:   #ffaa00  (alerts)
Text bright:      #a0d8e8
Text mid:         #5a8a9a
Text dim:         #2a4a5a
Borders:          rgba(0,245,255,0.18)
Font:             'Share Tech Mono', monospace (data) + 'Orbitron', monospace (headings)
Styling:          ALL INLINE STYLES — no Tailwind, no CSS modules
Aesthetic:        Cyberpunk neon + Splunk-style data density
```

---

## Business Rules

*(Michael owns this section — agents do not modify it)*

---

*Last updated: 2026-06-06*
