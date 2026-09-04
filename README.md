# Dux Bowling — website

Next.js 14 (App Router) + TypeScript. No CSS framework: the design system in
`app/globals.css` is lifted straight from the pitch deck, using the same two
Dux Stripe fonts and the same navy / cream / orange palette.

## Pages

| Route      | What it is |
|------------|------------|
| `/`        | Minimal homepage: hero, the market gap in three numbers, what we're building, interactive timeline, founding-partner CTA. |
| `/learn`   | Depth, tabbed for **Alleys / Bowlers / Investors**. Gameplay GIFs, and the two interactive positioning exhibits. |
| `/alleys`  | The operator questionnaire. Emails Andrew and stores to Supabase. |
| `/bowlers` | Bowler interest signup plus the public board of who has signed up. |

## Theming

Light is the default; the site switches to dark automatically when the visitor's
operating system asks for it (`prefers-color-scheme`). Both palettes live as CSS
variables at the top of `app/globals.css` — change them in one place.

`Dux Stripe Solid` is used for every heading. The display face `Dux Stripe` is
reserved for the BOWLING wordmark on the homepage.

## Environment variables

Set these in **Vercel → Settings → Environment Variables** (and in `.env.local`
for local dev). Copy `.env.example` as your starting point.

| Variable | Required | Notes |
|---|---|---|
| `SUPABASE_URL` | yes | `https://qqsilzezvuxsdtzaxbzn.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | yes | Supabase → Project Settings → API → **service_role**. Server-only; it is never sent to the browser. |
| `RESEND_API_KEY` | recommended | Free account at resend.com. Without it, submissions still save to Supabase but no email is sent. |
| `NOTIFY_EMAIL` | no | Defaults to `andrew@duxbowling.com`. |
| `MAIL_FROM` | no | Use `onboarding@resend.dev` until duxbowling.com is verified in Resend. |

The site degrades gracefully: with no Supabase key the bowler board renders
empty rather than erroring, and the alley form only fails if *both* Supabase
and email are unconfigured (it tells the visitor to email directly).

## How a submission travels

1. Visitor submits a form. The row is written to Supabase with `status = 'pending'`
   and a random `confirm_token`.
2. **They** get an email containing every answer they gave, plus a confirm button
   pointing at `/confirm?k=<kind>&t=<token>`.
3. They tap it. The row flips to `confirmed`, and only then does
   `andrew@duxbowling.com` get the submission -- with `reply_to` set to the
   submitter, so replying goes straight back to them.
4. The public bowler board only ever renders `status = 'confirmed'` rows.

Nothing reaches Andrew until the address has proven it belongs to a real person,
so nobody can put words in someone else's mouth. Replaying a confirm link is a
no-op because the update is scoped to `status = 'pending'`.

Supabase stores the data, the pending/confirmed state and the token, but it is not
a general email service -- its built-in mail only covers its own auth flows. The
sending runs through Resend from the Next.js API routes, which is why
`RESEND_API_KEY` is required for the flow to work end to end.

## Database

Both tables already exist in the `duxbowling` Supabase project. `supabase-migration.sql`
is kept for reference.

- `alley_interest` — one row per questionnaire submission.
- `bowler_signups` — one row per bowler; `email` is unique so a double submit is a no-op.

RLS is on with **no anon policies at all**, so the tables are unreadable from the
browser. Only the server routes touch them, using the service-role key. The public
board shows first name + last initial only, and only for bowlers who ticked the box.

## Running it

```bash
npm install
npm run dev        # http://localhost:3000
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

## Deploying

This is a standalone project. Two sane options:

1. **New Vercel project** (recommended): push this to its own repo, import to
   Vercel, add the env vars, then move the `duxbowling.com` domain over. The
   existing app keeps running untouched until you flip the domain.
2. **Replace the current repo's front end**: note the existing repo has a
   `middleware.ts` that puts HTTP Basic auth in front of everything — a public
   marketing site needs that removed or scoped. The existing repo also has its
   own `/alleys` and `/bowlers` routes that would collide with these.

## Editing content

Nearly all copy lives in plain arrays and JSX:

- Timeline stages → `app/components/Timeline.tsx`
- Positioning exhibits (points, coordinates, blurbs) → `app/components/Positioning.tsx`
- Alley questions → `app/alleys/AlleyForm.tsx` (`TEXT_QUESTIONS`) and the API's
  `LABELS` array in `app/api/alley-interest/route.ts`, which controls the email layout
- Gameplay GIFs → `GAMES` in `app/learn/LearnTabs.tsx`, files in `public/gifs/`
