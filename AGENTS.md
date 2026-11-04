# Agent rules

- `vite.config.ts` injects public backend URL/publishable-key fallbacks via `define` — the published build may run without `.env` (it was untracked by an external commit), and a missing URL crashes the whole site.
- Opening hours, delivery fee and minimum order live in the single-row `store_settings` table (edited in admin "Configurações"); `create_guest_order` enforces them server-side and `src/lib/storeSettings.ts` mirrors the rules for the UI — never hardcode these values in pages.
- The only backend is Lovable Cloud ref `jzqymlazswolzsoffpgi`; never repoint `.env`/`supabase/config.toml` to other project refs (e.g. `qxzfzhuuqbuwvpmuobuo`, `ymsqqetstluhxmrkugvg`) — live users, orders and admin roles live there.
