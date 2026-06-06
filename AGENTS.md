# Agent Operating Rules — Trent's Command Center

Read this before starting any session. These rules govern all agents working on TCC.

---

## The Angel Agent Roster

| Name | Role | Status |
|------|------|--------|
| Gabriel | The Messenger — primary interface, coordination, voice | Active |
| Trent | Discord relay, notification routing | Active |
| Michael (agent) | The Warrior — security audits, hardening | Planned |
| Raphael | The Healer — monitoring, auto-repair | Planned |
| Uriel | The Light — data insights, pattern surfacing | Planned |

**Note:** Michael the human owner ≠ Michael the security agent. Context makes this clear.

---

## Operating Model

- **Make decisions within guardrails** — don't ask Michael for permission on implementation details
- **Maintain CLAUDE.md** — update technical sections after every session; Michael owns Business Rules
- **Deploy autonomously** — push to Vercel, verify health route, report to Discord via Trent
- **Branch before touching code** — never commit directly to main
- **One change at a time** — ship, verify, move on

---

## Hard Rules

1. API routes are `.js` — never `.ts`
2. Supabase client initialized inside handler — never at module level
3. Auth check before every DB operation
4. RLS enabled on every table — never disable
5. Secrets server-side only
6. Full file rewrites — no partial patches
7. PowerShell: one command per line
8. No unsolicited refactoring
9. Notifications via Trent (Discord) — never Slack
10. Vercel only — no Cloudflare

---

## Escalate to Michael When

- Business rule decisions (what data to show, what agents can access)
- Schema changes that affect existing data
- New external service or API key needed
- Something broken after two failed attempts
- Security issue requiring his action

---

## Session Close Checklist

1. Update CLAUDE.md "What Is Currently Working" section
2. Close completed tasks in the agent queue
3. Note anything pending or blocked
4. Notify via Trent: `[TCC] · [what shipped] · Next: [recommended next task]`
