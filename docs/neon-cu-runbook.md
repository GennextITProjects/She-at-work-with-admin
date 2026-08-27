# Neon CU runbook

## The thing that was misunderstood

**Neon bills compute by wall-clock time awake, not by query count.**

The compute suspends only after a continuous idle window (default 5 minutes)
with **zero** queries. One query every 4 minutes costs exactly the same as
40,000 queries per minute: 24 hours of billed compute per day.

Every optimisation shipped before this one (ISR, killing the `fetch('/api/content')`
self-fetch, removing `auth()` from the root layout, dropping the pool idle
timeout to 5s) reduced *queries per request*. None of them reduced the *longest
gap between queries* below 5 minutes, which is the only number that moves the
bill. That is why CU utilisation did not change.

## What was keeping the gap under 5 minutes

Confirmed against a production access log (2026-08-27, 07:23:30-07:51:05 UTC =
13:00 IST, peak hours). **42 distinct request events in 27m35s. Largest quiet
gap: 2m39s.** Never close to the 5 minutes required.

Traffic shape in that window:

| Category | Events | Share |
|---|---|---|
| 404s on dead WordPress permalinks | 15 | 36% |
| Joomla/WP vulnerability scanner probes | 5 | 12% |
| `/sheDiaries` + playlist pages | 8 | 19% |
| Real content pages + home | 16 | 38% |
| `/contact` POST (bot-shaped) | 2 | - |

Roughly **half the traffic was junk**, and each piece of it cost more than it
should have:

1. **`revalidate = 1800` on every DB-backed route.** ~1900 published rows. Each
   crawled URL whose ISR entry had expired triggered a background regeneration
   on the next hit - a background DB query roughly every second under
   continuous crawl.
2. **Vercel's ISR cache is regional.** bingbot (US), Sogou (CN) and the others
   land in different edge regions, so the same page regenerates once *per region*.
3. **No `robots.txt`, no `sitemap.xml`.** Crawlers had no URL list and no
   `lastModified`, so they re-walked everything and followed every filter query
   string. Each unique query string is a separate CDN cache key.
4. **`not-found.tsx` client-redirected every 404 to `/`.** Visible in the log at
   +1s to +2s after nearly every legacy slug (07:23:30->07:23:31,
   07:26:10->07:26:11, 07:42:25->07:42:27, 07:47:16->07:47:18). Two requests per
   404, and ~1900 indexed URLs reading as soft-404s pointing at the home page -
   which is why crawlers kept re-checking them.
5. **`startsWith("/admin")` matched `/administrator`.** At 07:35:33 the scanner
   got `307 -> /auth/login?callbackUrl=%2Fadministrator` instead of a flat 404:
   two requests per probe, plus free confirmation that a login page exists.
6. **`/contact` POST had no server-side bot filter.** The captcha in
   `Contact.tsx` is generated and validated entirely in the browser; the body
   just carries `captchaVerified: true`. Both POSTs in the log followed the same
   crawl (`/author/admin` -> `/` -> `/blogs` -> `/contact` GET -> POST). Every
   accepted POST is a DB write - the one anonymous path caching cannot protect.

Not a CU cost, despite the volume: **`/sheDiaries` never touches Neon.**
`src/lib/youtube.ts` uses `fetch(..., { next: { revalidate: 3600 } })`. That
traffic is a Vercel invocation cost only.

## What changed in code

| Change | File | Effect |
|---|---|---|
| `revalidate: 1800 -> false` on all `[slug]` detail pages | `src/app/*/[slug]/page.tsx` | Zero timed regeneration. Updates still instant via `revalidateContent()`. |
| `revalidate: 1800 -> 86400` on listing pages | `src/app/page.tsx`, `src/app/*/page.tsx` | ~10 background queries/day instead of ~480. |
| Added `robots.ts` | `src/app/robots.ts` | Blocks Sogou / Reflectionbot / AI + SEO crawlers, blocks `/api/*`, `/dashboard/*`, `/auth/*` and all query-string URLs, `Crawl-delay` on the rest. |
| Added `sitemap.ts` | `src/app/sitemap.ts` | Dated URL list so crawlers stop blind-walking. One DB query/day. |
| DB fetchers rethrow instead of returning empty | `Fetchcontent.ts`, `fetchDetail.ts`, `db/content.ts`, `lib/db/site-settings.ts` | Required by `revalidate = false`: a swallowed error would be cached as a blank page or a permanent 404. Thrown errors are never cached. |
| Category writes now invalidate | `api/admin/categories/**` + `revalidateCategories()` | Detail pages no longer expire on a timer, so renames need an explicit push. |
| **Legacy WordPress redirects** | `src/lib/legacy-redirect.ts`, `src/app/[legacySlug]/page.tsx`, `src/app/blog/[legacySlug]/page.tsx` | Recovers 36% of traffic from 404s into cached 308s. One DB query per legacy slug, ever. |
| **Static legacy prefix redirects** | `next.config.ts` | `/global-schemes/*`, `/author/*`, `/category/*`, `/tag/*` redirect at the edge - zero function cost. |
| **Real 404 page** | `src/app/not-found.tsx` | Static, proper 404 status, no redirect. Halves requests per 404; ends the soft-404 SEO damage. |
| **Segment-aware prefix matching** | `src/middleware.ts` | `/administrator` gets a flat 404 instead of a login redirect. |
| **`/sheDiaries` + `/press` made public** | `src/routes.ts` | 19% of traffic skips the `getToken()` JWT verify. |
| **Contact-form bot filter** | `Contact.tsx`, `api/contact-submissions/route.ts` | Honeypot + minimum fill time, checked before the DB insert and both SMTP sends. Caught spam costs zero Neon wake. |

### How the legacy slug mapping works

The migration moved articles from `/{slug}` to `/{type}/{slug}` **and** appended
the WordPress post id, so `/women-entrepreneurs-yoga-can-empower-you` became
`/blogs/women-entrepreneurs-yoga-can-empower-you-<wp_id>`.

Two slug regimes exist in `content` and one predicate covers both:

```sql
WHERE status = 'PUBLISHED'
  AND (slug = $1 OR regexp_replace(slug, '-\d+$', '') = $1)
```

- migrated WordPress rows: `<original-slug>-<wp_id>` (5-digit suffix)
- rows created in the admin: `<title-slug>-<Date.now()>` (13-digit suffix)

A shape guard (`^[a-z0-9][a-z0-9-]{2,200}$`) runs **before** the query, so
scanner probes (`/wp-login.php`, `/administrator`, `/.env`) never reach Neon.

Update paths that push on-demand invalidation (verified): `POST/PATCH/DELETE
/api/admin/content`, `POST /api/admin/story-submissions/[id]/publish`, all
`/api/admin/site-settings` writes, and all `/api/admin/categories` writes.

### Build-time behaviour change

Because the DB fetchers now rethrow, **a build will fail outright if Neon is
unreachable** rather than deploying a site with empty listings. This is
deliberate. Neon wakes on connection, so it should only ever trigger during a
real outage.

## What must be changed outside the repo

These are the remaining levers and none of them live in code.

### 1. Neon → Branch → Compute settings (check these first)

- **Autosuspend delay.** Must be at its minimum (5 minutes, or lower if the
  plan allows). If this is set high, or set to "never", nothing in this repo
  can help. Verify in the Neon console under the branch's compute.
- **Autoscaling minimum CU — the single largest lever available, do this first.**
  The log shows a 2m39s peak-hour quiet gap against a 5-minute suspend
  threshold: the compute *will* be awake through the Indian working day. What
  you are billed for that time is the floor. Dropping min from 1 CU to 0.25 CU
  cuts the awake-time bill 4x immediately. Set min to 0.25 and let the max
  absorb spikes.
- **Branch computes.** `/api/neon-backup` keeps two monthly backup branches.
  The API call in that route does not request a compute endpoint, so they
  should be storage-only — confirm in the console that neither backup branch
  has a running endpoint. A branch with its own endpoint is billed separately.

### 2. Vercel Firewall (dashboard → Firewall)

`robots.txt` only binds crawlers that choose to honour it. Two of the observed
agents identify as ordinary Chrome:

```
Mozilla/5.0 (X11; Linux x86_64) ... Chrome/149.0.0.0 Safari/537.36
Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) ... Chrome/142.0.0.0 Safari/537.36
```

These cannot be judged from the string alone. Chrome's User-Agent Reduction
freezes the build number to `0.0.0`, so `142.0.0.0` is exactly what a real
browser sends — the macOS one is plausibly a genuine visitor. The `X11; Linux
x86_64` desktop-Linux variant is the default fingerprint of headless
Chrome/Puppeteer and is rare in real traffic, but that is a hint, not proof.

So filter on **behaviour, not identity**:

- **Rate limit** `/api/*` — something like 20 req/min per IP. A human browsing
  with filters never approaches this; a scraper trips it immediately. Note the
  in-route limiter in `api/content/route.ts` is per-lambda-instance and does
  not hold across concurrent instances — it is not a substitute.
- **Rate limit** the site root — e.g. 60 req/min per IP.
- Enable Vercel's **Bot Filter / Attack Challenge Mode** if crawl volume spikes
  again.

### 3. Google Search Console / Bing Webmaster Tools

Google ignores `Crawl-delay`. Set the crawl rate in Search Console directly.
Bing honours the `Crawl-delay: 10` now in `robots.txt`.

## Verifying the deploy

On a preview deployment:

```bash
# 1. Legacy permalink -> cached 308 at its real location
curl -sI https://<preview>/women-entrepreneurs-yoga-can-empower-you
#    expect: 308, location: /blogs/...-<id>
#    repeat: x-vercel-cache: HIT, no function invocation

# 2. Genuinely missing URL -> real 404, no redirect script in the body
curl -sI https://<preview>/this-slug-does-not-exist-at-all

# 3. Scanner probe -> flat 404, NOT 307 to /auth/login
curl -sI https://<preview>/administrator

# 4. Crawler policy
curl -s https://<preview>/robots.txt      # Sogou/Reflectionbot disallowed, Disallow: /*?*
curl -s https://<preview>/sitemap.xml | grep -c '<url>'
```

Contact form: submit normally, confirm a row lands in `contact_submissions`.
Then POST directly with the honeypot filled - expect `200`, **no** new row and
no email:

```bash
curl -s -X POST https://<preview>/api/contact-submissions \
  -H 'content-type: application/json' \
  -d '{"name":"x","email":"x@y.com","message":"x","_hp":"filled","_ts":0}'
```

## How to tell whether it actually worked

Do not measure query count - measure the idle gap.

1. Neon console -> **Monitoring** -> look for **0 active connections for >5
   consecutive minutes** and a compute status of *Idle*. Expect this overnight
   (IST), not during the working day. If it never goes idle, nothing else matters.
2. Neon -> **Billing -> Compute hours**, day over day. This is the number being
   watched. Expect a step change from the min-CU floor and a gradual improvement
   from the traffic work.
3. Vercel -> **Observability**, filtered by path: legacy root slugs should
   collapse to cached 308s and `/administrator` probes to 404s. Allow 24-48h for
   `robots.txt` to be re-fetched by the crawlers.
4. Google Search Console -> Coverage: soft-404s should convert to redirects over
   the following weeks.

**Honest expectation.** This will not take CU to near-zero. At ~1.5 req/min
during Indian daytime the compute stays awake regardless of what the code does.
The wins are: the min-CU floor (a multiple, immediately), wider off-peak idle
windows, roughly half the Vercel invocations removed, and the recovery of ~1900
old indexed URLs.

## Note on `/api/neon-backup`

The `CRON_SECRET` gate is written as `if (cronSecret && ...)`. If the env var
is unset the route is completely open, and each unauthenticated hit creates a
Neon branch. Confirm `CRON_SECRET` is set in Vercel's production environment.
