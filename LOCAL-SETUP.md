# The Record Hub — Local Setup Guide

This is the complete source code for **therecordhub-support-hub.lovable.app**.

## What's inside

```
the-record-hub/
├── public/                  # Static files (favicon.png, robots.txt)
├── src/
│   ├── assets/              # Logo image + CDN pointer file
│   ├── components/          # Navbar, RequestForm, Reviews, WhatsApp button, UI kit
│   ├── hooks/               # Shared hooks
│   ├── integrations/        # Backend (Supabase) client wiring (auto-generated)
│   ├── lib/                 # Services list, server functions, notifications, admin auth
│   ├── routes/              # Pages: home (index), admin dashboard, root layout
│   ├── routeTree.gen.ts     # Generated route tree (regenerates on build)
│   ├── server.ts            # SSR entry with error handling
│   ├── start.ts             # Middleware (auth, CSRF, error pages)
│   └── styles.css           # Design system (dark charcoal + red-neon + gold theme)
├── supabase/
│   ├── config.toml          # Backend configuration
│   └── migrations/          # Database schema (service_requests, reviews, owner_notifications)
├── .env.example             # Environment variable template
├── vite.config.ts           # Build configuration
└── package.json             # Dependencies and scripts
```

## Run locally

Requires **Node.js 20+** (install via [nvm](https://github.com/nvm-sh/nvm#installing--updating) if needed).

```sh
cd the-record-hub
npm install
npm run dev
```

Open http://localhost:8080 in your browser.

- Without `SUPABASE_SERVICE_ROLE_KEY`, `npm run dev` uses a local JSON store at `.local-data/record-hub.json` for service requests, reviews, and notification logs. The directory is git-ignored and stays on this computer.
- Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and `SESSION_SECRET` in `.env` to enable admin login. Development generates a random session secret only when `SESSION_SECRET` is unset, so restarting the server signs the admin out.
- To use Supabase instead, create a project, run both SQL files in `supabase/migrations/`, and set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` in `.env`. The service-role key is server-only: never add a `VITE_` prefix or expose it in client code. Restart the dev server after changing `.env`.
- Local JSON data is not automatically copied into Supabase when switching backends. Export or migrate it separately if those local submissions need to be retained in the new project.
- To email every service request and review to `therecordhub00716@gmail.com`, add your Resend API key as `RESEND_API_KEY` in `.env`. The app sends directly through Resend; no Lovable API key is needed. The default sender is Resend's onboarding address, which can only deliver to the Resend account owner's address. If that is not `therecordhub00716@gmail.com`, verify a sender domain in Resend and set `NOTIFY_FROM_EMAIL` to that sender.
- WhatsApp delivery is optional and requires the provider credentials described in `src/lib/notify.server.ts`. Without them, submissions still save and the notification log records that delivery was skipped.

## Admin credentials

- URL: `/admin`
- Set `ADMIN_USERNAME`, `ADMIN_PASSWORD`, and a strong `SESSION_SECRET` in `.env` for local development, and configure them on the server in production. Never expose these values in client code.

## Notes

- `src/assets/logo.png.asset.json` is a Lovable CDN pointer; the actual image is included as `src/assets/record-hub-logo.png` and the code imports that file directly, so the logo works everywhere.
- Fonts are loaded from Google Fonts via `<link>` tags in `src/routes/__root.tsx` (internet connection required).
- The original Lovable project remains the source of truth; this export is a full snapshot of it.
