# Agent rules

- `vite.config.ts` injects public backend URL/publishable-key fallbacks via `define` — the published build may run without `.env` (it was untracked by an external commit), and a missing URL crashes the whole site.
- The only backend is Lovable Cloud ref `jzqymlazswolzsoffpgi`; never repoint `.env`/`supabase/config.toml` to other project refs (e.g. `qxzfzhuuqbuwvpmuobuo`, `ymsqqetstluhxmrkugvg`) — live users, orders and admin roles live there.
