# 6400KM

A travel app for people who want to meet others going where they go.
This is **Sprint 1**: sign up / log in, and an empty 4-tab shell
(Feed, Itineraries, Trips, Chat).

## What's inside

- **Next.js** (the website framework)
- **Supabase** (accounts, login, database — used for auth here)
- **Vercel** (hosting, gives the app a public web address)

## Run it on your computer

1. Copy `.env.local.example` to `.env.local` and paste your Supabase keys.
2. In a terminal, in this folder:
   ```
   npm install
   npm run dev
   ```
3. Open http://localhost:3000

## Where the important files live

- `app/login`, `app/signup` — the login and sign-up screens
- `app/(app)/` — the logged-in area (the 4 tabs live here)
- `components/BottomTabBar.tsx` — the bottom navigation bar
- `lib/supabase/` — the code that talks to Supabase
- `middleware.ts` — keeps you logged in and protects the tabs

## Environment variables (needed for it to work)

| Name | Where to find it |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API → anon public key |
