# Cinematic Stories

A production-ready, single-admin storytelling platform with a genre-reactive
"atmosphere engine," chapter-level background audio, a cinematic entry screen,
and an AI reading-companion chatbot grounded in your own story content (RAG).

Built with Next.js 14 (App Router), Supabase (Postgres + Auth + Storage +
pgvector), TailwindCSS, Framer Motion, Howler.js, TipTap, and the Anthropic API.

---

## 1. What's included

- **Story CMS** — create/edit/delete stories and chapters, drafts, scheduled publishing, genres/tags/series
- **Rich text editor** (TipTap) with inline image upload, scene breaks, quotes, headings
- **Atmosphere engine** — 9 genre presets (horror, romance, fantasy, thriller, war, adventure, drama, mystery, default) that drive color tokens, fonts, and canvas particle effects (fog, petals, sparkles, embers, rain)
- **Cinematic entry screen** — "Enter Story World" / "Read Without Sound" choice, saved as a reader preference, before any audio plays (so it never violates browser autoplay rules)
- **Audio system** — Howler.js BGM per chapter with fade in/out, volume control, track switching, mood tags
- **AI chatbot (RAG)** — chunks published chapter content into `pgvector` embeddings; the chatbot retrieves relevant passages before answering, so it stays grounded in your actual story and doesn't spoil unpublished chapters
- **Reader features** — bookmarks, reading-progress tracking (works for both anonymous and signed-in readers), adjustable font size, prev/next chapter nav
- **Admin-only writes** — enforced at three layers: Supabase Row-Level Security, Next.js middleware, and a per-route session check
- **Media library** — drag-and-drop upload for images / audio (MP3, WAV, OGG) / PDF / DOCX, reused across stories
- **Scheduled publishing** — a Vercel Cron job flips `scheduled` → `published` automatically
- **Chatbot rate limiting** — IP-hashed, configurable per-hour cap stored in Postgres

---

## 2. Prerequisites

- Node.js 18.18+ (Next.js 14 requirement)
- A free [Supabase](https://supabase.com) project
- An [Anthropic API key](https://console.anthropic.com)
- A [Vercel](https://vercel.com) account for deployment (or any Node host)

---

## 3. Local setup

### 3.1 Install dependencies

```bash
npm install --legacy-peer-deps
```

The `--legacy-peer-deps` flag is needed because `@supabase/auth-helpers-nextjs`
(a stable, widely-used package) hasn't updated its peer-dependency range for
the newest React 18 patch releases yet — this is a metadata mismatch, not a
real incompatibility.

### 3.2 Create your Supabase project

1. Go to [supabase.com](https://supabase.com) → New Project.
2. Once provisioned, open **SQL Editor** and run, in order:
   - `supabase/migrations/001_schema.sql`
   - `supabase/migrations/002_chapter_scheduling.sql`
3. Open **Authentication → Providers** and enable **Anonymous Sign-Ins**
   (this lets readers bookmark/track progress without creating an account).
4. Open **Authentication → Users** → **Add User** and create your own admin
   account (this is the *only* account that should ever sign in at `/admin`).
5. Copy your project URL and keys from **Settings → API**.

### 3.3 Create storage buckets

```bash
# Set these temporarily in your shell, or use a .env loader
export NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
export SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

node scripts/setup-storage.mjs
```

This creates three public buckets: `story-media`, `audio-tracks`, `documents`.

### 3.4 Configure environment variables

```bash
cp .env.example .env.local
```

Fill in every value in `.env.local`:

| Variable | Where to find it |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Settings → API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase → Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Settings → API (⚠️ never expose client-side) |
| `ADMIN_EMAIL` | The email of the user you created in step 3.2.4 |
| `NEXTAUTH_SECRET` | `openssl rand -base64 32` |
| `ANTHROPIC_API_KEY` | console.anthropic.com → API Keys |
| `CRON_SECRET` | `openssl rand -base64 32` (only needed in production) |

### 3.5 Run it

```bash
npm run dev
```

Visit `http://localhost:3000` for the reader site and
`http://localhost:3000/admin/login` to sign in as the admin.

---

## 4. Using the admin panel

1. **Sign in** at `/admin/login` with the account from step 3.2.4.
2. **Create a story** — set its title, synopsis, genre label, and **mood**
   (this is what drives the atmosphere engine — color palette, font, and
   particle effect are all derived from this one field).
3. **Add chapters** — each chapter has its own TipTap editor. Use the
   toolbar's "✦ Scene Break" button for cinematic dividers, and the image
   button to upload inline illustrations.
4. **Attach audio** — in a chapter, scroll to "Background Audio" → "Attach
   Audio Track" → pick from your media library or upload a new MP3/WAV/OGG.
   Mark one track "Autoplay on entry" per chapter; that's the one that fades
   in if the reader chooses "Enter Story World" with sound.
5. **Publish** — set status to `published` (or `scheduled` with a date/time).
   Only published stories/chapters are visible to readers or indexed for the
   AI chatbot.
6. **Reindex for AI** — happens automatically whenever you save a published
   chapter, but you can force it manually from the chapter editor if needed.

---

## 5. How the atmosphere engine works

Every mood (`horror`, `romance`, `fantasy`, etc.) maps to a preset in
`src/lib/atmosphere.ts` — background/surface/accent/text colors, two font
stacks, and a particle type. When a reader opens a story, that preset is:

1. Converted to CSS custom properties (`--atmo-bg`, `--atmo-accent`, etc.)
   and applied to the page.
2. Rendered as a `<canvas>` particle layer (`ParticleLayer.tsx`) — fog drifts
   upward for horror, petals fall for romance, sparkles pulse for fantasy,
   rain streaks down for thriller.
3. Used by the cinematic intro screen and every reader-facing component, so
   the whole UI (not just the text) shifts per story.

To add a new mood, add one entry to `ATMOSPHERE_PRESETS` in
`src/lib/atmosphere.ts` and one `case` in `ParticleLayer.tsx`'s `getColor()` —
no other code changes needed.

---

## 6. How the AI chatbot (RAG) works

- `src/lib/ai/embeddings.ts` chunks each published chapter's TipTap content
  into ~500-word segments and stores vector embeddings in the
  `story_embeddings` table (pgvector).
- `src/lib/ai/chatbot.ts` embeds the reader's question, retrieves the
  most similar chunks via the `search_story_embeddings` Postgres function,
  and passes them to Claude as grounding context.
- This means the chatbot only "knows" what's actually published — it can't
  spoil chapters you haven't released yet, and it won't invent lore that
  isn't in your text.

**Production note:** the included embedding function (`pseudoEmbed` in
`embeddings.ts`) is a deterministic placeholder so the whole pipeline runs
without a second API dependency. For higher-quality semantic retrieval,
swap it for a real embedding model (e.g. OpenAI's `text-embedding-3-small`)
— the rest of the RAG pipeline (chunking, storage, retrieval, prompting)
needs no changes.

---

## 7. Deployment (Vercel)

1. Push this project to a GitHub repository.
2. In Vercel: **New Project** → import the repo.
3. Add every variable from `.env.local` under **Settings → Environment
   Variables** (use your real production values, not the local ones).
4. Update `NEXTAUTH_URL` and `NEXT_PUBLIC_APP_URL` to your production domain.
5. Deploy. The `vercel.json` cron (`/api/cron/publish-scheduled`, every 15
   minutes) is picked up automatically — no extra setup needed on Vercel's
   side, but `CRON_SECRET` **must** be set or the endpoint stays locked.
6. In Supabase → **Authentication → URL Configuration**, add your production
   domain to the allowed redirect URLs.

---

## 8. Security model

- **Row-Level Security**: every table only allows public `SELECT` on
  `status = 'published'` rows; all writes require the `service_role` key.
- **Middleware** (`src/middleware.ts`): blocks `/admin/*` and `/api/admin/*`
  for any session whose email isn't `ADMIN_EMAIL`.
- **Per-route guard** (`src/lib/admin-session.ts`): a second, explicit check
  inside each `/api/admin/*` route — defense in depth if middleware is ever
  bypassed or misconfigured.
- **Chatbot rate limiting**: IP addresses are SHA-256 hashed (never stored in
  plaintext) and capped at `CHATBOT_RATE_LIMIT` requests/hour.
- **Service-role key** never reaches the browser — it's only referenced in
  server-only files (`src/lib/supabase/server.ts`, API routes).

---

## 9. Project structure

```
src/
├── app/
│   ├── admin/
│   │   ├── login/                  # Public admin login (outside the dashboard route group)
│   │   └── (dashboard)/            # Everything below requires ADMIN_EMAIL session
│   │       ├── page.tsx            # Dashboard / stats
│   │       ├── stories/            # List, create, edit stories + chapters
│   │       └── media/              # Media library
│   ├── api/
│   │   ├── admin/                  # Admin-only CRUD (blocked by middleware for non-admins)
│   │   ├── chatbot/                # Public — rate-limited RAG endpoint
│   │   ├── progress/ bookmarks/    # Public — reader state, session-scoped
│   │   └── cron/                   # CRON_SECRET-protected scheduled publishing
│   ├── story/[slug]/               # Cinematic intro + chapter list
│   ├── read/[slug]/[chapter]/      # The actual reading experience
│   └── library/                    # Reader's bookmarked stories
├── components/
│   ├── admin/                      # Forms, editors, media picker
│   ├── reader/                     # Intro screen, chapter reader, chatbot widget
│   ├── atmosphere/                 # Particle canvas layer
│   └── audio/                      # Howler-based BGM player
├── lib/
│   ├── atmosphere.ts               # The mood → CSS/particle preset engine
│   ├── ai/                         # Embeddings + chatbot logic
│   └── supabase/                   # Browser/server/admin clients
└── types/                          # Shared TypeScript types

supabase/migrations/                # Run these in order in the SQL Editor
scripts/setup-storage.mjs           # One-time storage bucket creation
```

---

## 10. Known trade-offs (by design, for a solo-admin project)

- **No multi-author support** — by design, per the original spec. Adding it
  would mean replacing the single `ADMIN_EMAIL` check with a `roles` table.
- **Anonymous-auth reader sessions** — simplest way to support bookmarks/
  progress without forcing readers to sign up. If you'd rather require real
  accounts, swap `signInAnonymously()` in `useReaderSession.ts` for a normal
  email/magic-link flow.
- **Placeholder embeddings** — see section 6. Functionally complete, but a
  real embedding model will noticeably improve chatbot answer relevance.
