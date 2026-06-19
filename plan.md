# Almanack — Project Plan

> A modern media identity platform for people whose taste spans many different formats.

---

## 1. Product Summary

Almanack is a social media-tracking app that lets users rate, review, log, organize, and share everything they consume across **9 core categories**: Movies, TV Shows, Books, Games, Manga, Comics, Anime, Animation, and Music.

The app is not a checklist or a database. It is a **living media identity platform** — a place where users build a profile of their taste, opinions, memories, and media history.

**Core principles:**
- Simple by default, deeper only when the user wants it.
- Rating is quick and lightweight; logging is deeper and more personal.
- Social features are thoughtful and intentional, not noisy.
- Lists are a first-class feature and a form of identity.

---

## 2. Tech Stack Overview

| Layer | Technology | Rationale |
|---|---|---|
| **Framework** | Next.js 15+ (App Router) | Server-first architecture, RSC, streaming, Partial Prerendering (PPR), and edge-ready deployment. |
| **Styling** | Tailwind CSS v4 | Utility-first, responsive by default, design token support, fast iteration. |
| **Language** | TypeScript (strict mode) | End-to-end type safety from DB to UI. |
| **ORM** | Drizzle ORM | SQL-first, minimal bundle (~7 KB), fast cold starts, serverless/edge-optimized, transparent query generation. |
| **Database** | PostgreSQL 16+ | Battle-tested relational DB with JSONB support for flexible category-specific metadata, advanced indexing, declarative partitioning. |
| **Auth** | Auth.js (Better Auth) | Open-source, zero vendor lock-in, runtime-agnostic, full control over sessions and data storage. Aligns with self-hosted philosophy. |
| **Cache** | Redis (Upstash or self-hosted) | Hot data layer for feeds, sessions, rate limiting, and frequently accessed metadata. |
| **Search** | Meilisearch | Disk-based (LMDB), horizontally scalable via sharding, multilingual support, handles datasets exceeding RAM capacity. |
| **File Storage** | S3-compatible (AWS S3 / Cloudflare R2) | User avatars, list cover images, review media attachments. R2 eliminates egress fees. |
| **CDN** | Cloudflare | Edge caching, image optimization (WebP/AVIF), DDoS protection, WAF. |
| **Deployment** | Docker + Kubernetes (initially Docker Compose → K8s) | Portable, reproducible, horizontally scalable. |
| **Hosting** | Railway / Fly.io (early) → AWS ECS/EKS or self-managed K8s (scale) | Start managed to move fast, migrate to self-hosted infrastructure as traffic justifies the ops overhead. |
| **Monitoring** | Sentry (errors) + Grafana/Prometheus (metrics) + PostHog (product analytics) | Full observability stack from day one. |
| **CI/CD** | GitHub Actions | Automated type-checking, linting, testing, preview deployments, and production releases. |

### 2.1 Stack Decision Notes

#### Why Drizzle over Prisma
- **Serverless performance**: ~7 KB bundle vs Prisma's significantly larger footprint, even post-v7.
- **Cold start advantage**: Critical for edge/serverless functions (auth checks, API routes, feed generation).
- **SQL transparency**: Complex queries for aggregated ratings, activity feeds, and cross-category statistics benefit from direct SQL control.
- **Trade-off**: Prisma has better migration tooling and team onboarding DX. Mitigate with `drizzle-kit` for migrations and strong schema documentation.

#### Why Auth.js / Better Auth over Clerk
- **Zero vendor lock-in**: Full ownership of user data and auth logic.
- **Cost predictability**: No per-user pricing that becomes unpredictable at scale. Infrastructure cost only.
- **Customization**: Media identity profiles require deep customization of the auth flow (username-first signup, profile creation onboarding, social graph integration).
- **Trade-off**: More upfront implementation work. Mitigate by using Better Auth's pre-built adapters for OAuth (Google, GitHub, Discord) and session management.

#### Why Meilisearch over Typesense
- **Scalability model**: Disk-based storage means the dataset isn't capped by RAM. As the media catalog grows (potentially millions of entries across 10 categories), horizontal sharding is available.
- **Multilingual**: Automatic language detection for 100+ languages — important for manga/anime titles (Japanese, Korean), international films, etc.
- **Trade-off**: Typesense is faster for in-memory queries. Meilisearch Cloud handles operational complexity if self-hosting becomes burdensome.

---

## 3. External API Integrations

### 3.1 API-to-Category Mapping

| Category | Primary API | Backup / Supplement | Auth Method |
|---|---|---|---|
| **Movies** | TMDB | — | API Key (v4 Bearer Token) |
| **TV Shows** | TMDB | — | API Key (v4 Bearer Token) |
| **Anime** | AniList (GraphQL) | Jikan (MyAnimeList) | Public (OAuth2 for user data) |
| **Animation** | TMDB (filtered) | — | API Key |
| **Manga** | AniList (GraphQL) | MangaDex | Public (OAuth2 for user data) |
| **Comics** | Comic Vine (GameSpot) | — | API Key |
| **Books** | Open Library | Google Books API | None (public) / API Key |
| **Games** | IGDB | RAWG | Twitch OAuth2 (Client Credentials) |
| **Music** | MusicBrainz + Cover Art Archive | Spotify API (metadata only) | User-Agent header / OAuth2 |

### 3.2 Integration Architecture

The app **must not** depend directly on external APIs at the application layer. Instead, implement the **Adapter Pattern** with a unified service interface:

```
┌─────────────────────────────────────────────────────┐
│                   Application Layer                  │
│         (Next.js Server Actions / API Routes)        │
└──────────────────────┬──────────────────────────────┘
                       │
        ┌──────────────▼──────────────┐
        │     Media Provider Interface │
        │   search(query): MediaItem[] │
        │   getDetails(id): MediaItem  │
        │   getTrending(): MediaItem[] │
        └──────────────┬──────────────┘
                       │
     ┌─────────────────┼─────────────────┐
     ▼                 ▼                 ▼
┌─────────┐    ┌──────────────┐    ┌───────────┐
│  TMDB   │    │   AniList    │    │   IGDB    │
│ Adapter │    │   Adapter    │    │  Adapter  │
└─────────┘    └──────────────┘    └───────────┘
     ...           ...               ...
```

**Key principles:**
- **Internal Domain Model**: All external data is normalized into Almanack's own `MediaItem` schema before storage.
- **External ID mapping**: Store `tmdb_id`, `anilist_id`, `igdb_id`, `musicbrainz_id`, etc. alongside internal IDs for refresh/sync jobs.
- **No frontend API keys**: All external API calls are proxied through the backend. Keys live in environment variables only.
- **Rate limit middleware**: Per-provider queue with exponential backoff and `Retry-After` header respect.
- **Local metadata cache**: Cache titles, posters, release dates, and descriptions in PostgreSQL so the app remains functional even if an external API is temporarily down.

### 3.3 API-Specific Considerations

**TMDB (Movies, TV, Animation)**
- REST-based, highly reliable, generous rate limits.
- Use as the primary template for media data modeling.
- Cache poster/backdrop URLs — images are served from TMDB's CDN.

**AniList (Anime, Manga)**
- GraphQL endpoint at `https://graphql.anilist.co`.
- Request only the fields you need — GraphQL's strength.
- Public data requires no auth. User list sync requires OAuth2.
- Consider the `@api-wrappers/anilist-wrapper` package for TypeScript.

**IGDB (Games)**
- Requires Twitch OAuth2 (Client Credentials flow) for authentication.
- Token has a TTL — implement automatic token refresh.
- Rich metadata: platforms, genres, game modes, screenshots, videos.

**MusicBrainz (Music)**
- **Critical**: Requires a custom `User-Agent` header (`AppName/Version (contact@email.com)`). Failure to comply results in IP blocks.
- Rate limit: 1 request per second for unauthenticated requests.
- Use Cover Art Archive (`coverartarchive.org`) for album artwork.
- Consider batch queries and aggressive local caching.

**Open Library (Books)**
- Fully public, no auth required.
- Search via `https://openlibrary.org/search.json?q=...`.
- Include `User-Agent` header to get 3x default rate limit.
- ISBN-based lookups for precise matching.

---

## 4. Database Architecture

### 4.1 Core Schema Design

The database follows a **normalized relational design** with selective JSONB columns for category-specific metadata that varies widely across media types.

```
┌───────────────────────────────────────────────────────────────┐
│                        CORE ENTITIES                          │
├───────────────────────────────────────────────────────────────┤
│                                                               │
│  users ◄────── follows (follower_id, followed_id)             │
│    │                                                          │
│    ├──► ratings (user_id, media_item_id, score, is_favorite)  │
│    │                                                          │
│    ├──► logs (user_id, media_item_id, status, started_at,     │
│    │         finished_at, progress, category_metadata JSONB)  │
│    │                                                          │
│    ├──► reviews (user_id, media_item_id, body, has_spoilers,  │
│    │            visibility, created_at)                       │
│    │      │                                                   │
│    │      ├──► review_likes (user_id, review_id)              │
│    │      └──► review_comments (user_id, review_id, body)     │
│    │                                                          │
│    ├──► lists (user_id, title, description, is_ranked,        │
│    │          is_public, type)                                 │
│    │      │                                                   │
│    │      └──► list_items (list_id, media_item_id, position,  │
│    │                       note)                              │
│    │                                                          │
│    ├──► planned_watchlists (user_id, title, goal_description, │
│    │         deadline, reminder_schedule)                      │
│    │      │                                                   │
│    │      └──► watchlist_items (watchlist_id, media_item_id,   │
│    │                           is_completed, completed_at)    │
│    │                                                          │
│    └──► activity_events (user_id, event_type, entity_id,      │
│              entity_type, created_at)                          │
│                                                               │
│  media_items (id, title, type, release_date, poster_url,      │
│               description, avg_rating, rating_count,          │
│               external_ids JSONB, metadata JSONB)             │
│                                                               │
└───────────────────────────────────────────────────────────────┘
```

### 4.2 Category-Specific Metadata (JSONB)

The `logs.category_metadata` and `media_items.metadata` columns use JSONB to store category-specific information without schema explosion:

**Movies log metadata:**
```json
{ "watched_date": "2025-01-15", "is_rewatch": false }
```

**TV Shows log metadata:**
```json
{
  "season_ratings": { "1": 4.5, "2": 3.0 },
  "standout_episodes": ["S01E05", "S02E09"],
  "current_season": 2,
  "current_episode": 5
}
```

**Games log metadata:**
```json
{
  "platform": "PS5",
  "hours_played": 87,
  "completion_status": "main_story",
  "story_rating": 5,
  "gameplay_rating": 4,
  "soundtrack_rating": 5,
  "favorite_moments": ["The ending of Chapter 3", "Boss fight in Area 7"]
}
```

**Music log metadata:**
```json
{
  "media_subtype": "album",
  "favorite_tracks": [3, 7, 11],
  "least_favorite_tracks": [5],
  "track_ratings": { "1": 3, "2": 4, "3": 5, "7": 5 },
  "first_listen_date": "2024-11-20",
  "relisten_count": 4,
  "favorite_lyrics": null,
  "artist_notes": null
}
```

**Manga log metadata:**
```json
{
  "current_chapter": 145,
  "current_volume": 15,
  "volume_ratings": { "1": 4, "2": 5 },
  "arc_ratings": { "Soul Society": 5, "Arrancar": 4 },
  "standout_chapters": [139, 140]
}
```

### 4.3 Indexing Strategy

| Table | Index | Type | Purpose |
|---|---|---|---|
| `media_items` | `(type, avg_rating DESC)` | B-Tree | Category browsing sorted by rating |
| `media_items` | `(title)` | GIN (trigram) | Fuzzy text search fallback |
| `media_items` | `(external_ids)` | GIN | JSONB lookup by external provider ID |
| `ratings` | `(user_id, media_item_id)` | B-Tree (unique) | One rating per user per item |
| `ratings` | `(media_item_id, score)` | B-Tree | Aggregate rating calculations |
| `logs` | `(user_id, status)` | B-Tree | "Currently watching/reading" queries |
| `logs` | `(user_id, media_item_id)` | B-Tree (unique) | One active log per user per item |
| `reviews` | `(media_item_id, created_at DESC)` | B-Tree | Item page review listing |
| `reviews` | `(user_id, created_at DESC)` | B-Tree | Profile page review listing |
| `activity_events` | `(user_id, created_at DESC)` | B-Tree | Activity feed generation |
| `activity_events` | `(created_at)` | BRIN | Time-range queries on massive event tables |
| `follows` | `(follower_id)`, `(followed_id)` | B-Tree | Social graph queries |
| `list_items` | `(list_id, position)` | B-Tree | Ordered list retrieval |

### 4.4 Materialized Views (Computed Data)

For expensive aggregations that don't need real-time accuracy:

- **`user_stats`**: Total ratings, total reviews, total logs per category, average score given, media breakdown percentages. Refreshed every 15 minutes or on-demand.
- **`media_item_stats`**: Rating distribution histogram (1-5), review count, list appearances. Refreshed on rating/review write.
- **`trending_media`**: Weighted score based on recent ratings, reviews, and log activity. Refreshed hourly.

---

## 5. Application Architecture

### 5.1 Directory Structure (Feature-Based)

```
src/
├── app/                          # Next.js App Router
│   ├── (auth)/                   # Auth route group
│   │   ├── login/
│   │   ├── register/
│   │   └── layout.tsx
│   ├── (main)/                   # Authenticated route group
│   │   ├── home/
│   │   ├── search/
│   │   ├── profile/[username]/
│   │   ├── media/[type]/[id]/
│   │   ├── lists/
│   │   ├── watchlists/
│   │   └── layout.tsx
│   ├── api/                      # API routes
│   │   ├── media/
│   │   ├── ratings/
│   │   ├── reviews/
│   │   ├── lists/
│   │   └── feed/
│   ├── layout.tsx
│   └── globals.css
├── features/                     # Feature modules
│   ├── auth/
│   ├── media/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── actions/              # Server actions
│   │   └── types.ts
│   ├── ratings/
│   ├── reviews/
│   ├── logging/
│   ├── lists/
│   ├── watchlists/
│   ├── social/
│   ├── feed/
│   └── profile/
├── lib/                          # Shared infrastructure
│   ├── db/
│   │   ├── schema.ts             # Drizzle schema
│   │   ├── migrations/
│   │   └── client.ts
│   ├── providers/                # External API adapters
│   │   ├── interface.ts          # IMediaProvider
│   │   ├── tmdb.ts
│   │   ├── anilist.ts
│   │   ├── igdb.ts
│   │   ├── musicbrainz.ts
│   │   ├── openlibrary.ts
│   │   └── comicvine.ts
│   ├── cache/                    # Redis client + cache helpers
│   ├── search/                   # Meilisearch client
│   └── utils/
├── components/                   # Shared UI components
│   ├── ui/                       # Design system primitives
│   ├── layout/
│   └── media/                    # Shared media display components
└── config/
    └── constants.ts
```

### 5.2 Server-First Architecture

- **Default to Server Components**. Only use `"use client"` for interactive elements (rating stars, review editor, search autocomplete, modal triggers).
- **Server Actions** for all mutations (rate, log, review, follow, like, comment).
- **Streaming** for feed pages and search results via React Suspense boundaries.
- **Partial Prerendering (PPR)** for media item pages: static shell (poster, title, metadata) + streamed dynamic content (user's rating, reviews, community score).

---

## 6. Caching Strategy

### 6.1 Multi-Layer Cache Architecture

```
User Request
    │
    ▼
┌─────────────┐     ┌────────────────┐     ┌──────────────┐
│  Cloudflare  │────►│  Redis (Hot)   │────►│  PostgreSQL   │
│  Edge Cache  │     │  TTL: 5-60min  │     │  (Source of   │
│  (Static)    │     │                │     │   Truth)      │
└─────────────┘     └────────────────┘     └──────────────┘
```

### 6.2 Cache Policies by Data Type

| Data Type | Cache Layer | TTL | Invalidation Strategy |
|---|---|---|---|
| Media item metadata | Redis + CDN | 24 hours | Manual refresh job / on external API sync |
| User profile (public) | Redis | 15 minutes | Invalidate on profile update |
| Activity feed | Redis (Sorted Sets) | 5 minutes | Append on new activity, trim to last 200 events |
| Aggregate ratings | Redis | 10 minutes | Invalidate on new rating |
| Trending media | Redis | 1 hour | Materialized view refresh |
| Search results | Meilisearch (internal) | N/A | Index updates on media item changes |
| Media posters/images | CDN (Cloudflare) | 30 days | Cache-bust on URL change |
| User sessions | Redis | Session TTL | Auth.js managed |

### 6.3 Feed Generation Strategy

Activity feeds use a **fanout-on-read** approach for the MVP:

1. When a user opens their feed, query `activity_events` for all users they follow.
2. Results are cached in Redis Sorted Sets keyed by `feed:{user_id}` with timestamp as score.
3. Cache is invalidated/appended when followed users create new activity.

**Future migration path** (at scale): Switch to **fanout-on-write** where each user's feed is pre-computed and stored in Redis when a followed user creates activity. This trades write amplification for read speed.

---

## 7. Search Architecture

### 7.1 Meilisearch Index Design

| Index | Documents | Searchable Attributes | Filterable Attributes |
|---|---|---|---|
| `media_items` | All media | `title`, `description`, `creator_name`, `genre_names` | `type`, `release_year`, `avg_rating`, `genre_ids` |
| `users` | All public users | `username`, `display_name`, `bio` | — |
| `lists` | Public lists | `title`, `description`, `item_titles` | `creator_id`, `is_ranked`, `item_count` |
| `reviews` | Public reviews | `body`, `media_title` | `media_type`, `user_id`, `score` |

### 7.2 Index Sync Strategy

- **Media items**: Background job syncs PostgreSQL → Meilisearch every 10 minutes (incremental, using `updated_at` cursor).
- **User-generated content** (reviews, lists): Sync on write via an async event queue.
- **Full reindex**: Scheduled weekly as a safety net.

---

## 8. Scalability Strategy

### 8.1 Scaling Phases

#### Phase 1: Launch (0 → 10K users)

| Component | Setup | Monthly Cost Estimate |
|---|---|---|
| Next.js | Railway (1 service, 1 GB RAM) | $5–10 |
| PostgreSQL | Railway managed or Neon (free tier) | $0–25 |
| Redis | Upstash (free tier → pay-as-you-go) | $0–10 |
| Meilisearch | Meilisearch Cloud (free tier) | $0 |
| S3/R2 | Cloudflare R2 (free tier) | $0 |
| Domain + CDN | Cloudflare (free tier) | $0 |
| Monitoring | Sentry (free tier) + PostHog (free tier) | $0 |
| **Total** | | **$5–45/month** |

- Single-instance deployment via Docker Compose.
- PostgreSQL on a single node with connection pooling (PgBouncer or Neon's built-in pooler).
- Focus entirely on product-market fit. Don't over-engineer.

#### Phase 2: Growth (10K → 100K users)

| Component | Upgrade |
|---|---|
| Next.js | Horizontal scaling: 2–3 replicas behind a load balancer |
| PostgreSQL | Upgrade to 4–8 GB RAM instance, add 1 read replica |
| Redis | Upstash Pro or self-hosted Redis with persistence |
| Meilisearch | Meilisearch Cloud paid tier with replication |
| CDN | Cloudflare Pro (image optimization, advanced WAF) |
| Monitoring | Sentry paid + Grafana Cloud |

**Key actions:**
- Introduce read replicas for PostgreSQL. Route all feed/browse/search queries to replicas.
- Implement connection pooling with PgBouncer if not already.
- Add Redis Cluster mode for session + cache separation.
- Tune `postgresql.conf`: `shared_buffers` (25% RAM), `work_mem`, `effective_cache_size`.
- Implement materialized view refresh schedules.
- Move from fanout-on-read to hybrid feed generation.

#### Phase 3: Scale (100K → 1M+ users)

| Component | Upgrade |
|---|---|
| Infrastructure | Migrate to Kubernetes (EKS/GKE) or Fly.io Machines |
| PostgreSQL | Multi-replica setup, declarative partitioning on `activity_events` (by month), consider Citus for sharding |
| Redis | Redis Cluster (3+ nodes) |
| Meilisearch | Self-hosted cluster with sharding (Enterprise) or Meilisearch Cloud Enterprise |
| CDN | Cloudflare Enterprise |
| Search | Evaluate adding Elasticsearch for advanced analytics queries |

**Key actions:**
- Partition `activity_events` table by date range (monthly). Enables efficient pruning and archival.
- Partition `ratings` table by `media_type` if query patterns justify it.
- Implement a proper event/message queue (e.g., Redis Streams, BullMQ, or NATS) for async processing: feed fanout, search indexing, notification delivery, email sending.
- Evaluate moving to microservices for independently scalable components: feed service, search service, notification service.
- Implement database connection management via PgBouncer in transaction mode.
- Add WAL tuning for high-write throughput.

### 8.2 Database Scaling Hierarchy

Follow this progression — move to the next level only when the current one is exhausted:

1. **Query optimization** → Use `EXPLAIN (ANALYZE, BUFFERS)` on every slow query.
2. **Indexing** → Add partial indexes, covering indexes, GIN indexes for JSONB.
3. **Vertical scaling** → Upgrade CPU/RAM/NVMe.
4. **Connection pooling** → PgBouncer in transaction mode.
5. **Read replicas** → Offload read-heavy traffic.
6. **Partitioning** → Declarative partitioning on time-series tables.
7. **Sharding** → Citus or application-level sharding (last resort).

### 8.3 Performance Targets

| Metric | Target (P95) |
|---|---|
| Page load (TTFB) | < 200ms |
| Search autocomplete | < 50ms |
| Rating submission | < 100ms |
| Feed load | < 300ms |
| Media item page | < 250ms |
| Lighthouse score | > 90 |
| Core Web Vitals (LCP) | < 2.5s |
| Core Web Vitals (INP) | < 200ms |

---

## 9. Deployment Pipeline

### 9.1 Environment Strategy

| Environment | Purpose | Database | URL |
|---|---|---|---|
| `local` | Development | Local PostgreSQL (Docker) | `localhost:3000` |
| `preview` | PR review & testing | Shared staging DB (isolated schema) | `pr-{number}.almanack.dev` |
| `staging` | Pre-production validation | Staging DB (production clone) | `staging.almanack.dev` |
| `production` | Live users | Production DB | `almanack.app` |

### 9.2 CI/CD Pipeline (GitHub Actions)

```
Push to Branch / Open PR
    │
    ▼
┌─────────────────────────────────────┐
│  1. Lint + Type Check               │
│     - ESLint (strict config)        │
│     - tsc --noEmit                  │
│     - Prettier check                │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  2. Unit + Integration Tests        │
│     - Vitest                        │
│     - Drizzle test DB (in-memory)   │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  3. Build                           │
│     - next build                    │
│     - Bundle size check (fail if    │
│       > threshold)                  │
└──────────────┬──────────────────────┘
               │
               ▼
┌─────────────────────────────────────┐
│  4. Preview Deployment (PR only)    │
│     - Deploy to preview env         │
│     - Run Playwright E2E tests      │
│     - Lighthouse CI audit           │
└──────────────┬──────────────────────┘
               │
               ▼ (on merge to main)
┌─────────────────────────────────────┐
│  5. Staging Deployment              │
│     - Run DB migrations             │
│     - Deploy to staging             │
│     - Smoke tests                   │
└──────────────┬──────────────────────┘
               │
               ▼ (manual approval gate)
┌─────────────────────────────────────┐
│  6. Production Deployment           │
│     - Run DB migrations             │
│     - Blue-green or rolling deploy  │
│     - Health check verification     │
│     - Sentry release tagging        │
└─────────────────────────────────────┘
```

### 9.3 Docker Configuration

```dockerfile
# Multi-stage build for minimal production image
FROM node:22-alpine AS base

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml ./
RUN corepack enable && pnpm install --frozen-lockfile

FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN pnpm build

FROM base AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/public ./public

EXPOSE 3000
CMD ["node", "server.js"]
```

**`next.config.ts` requirement:**
```typescript
const nextConfig = {
  output: "standalone",  // Required for Docker deployment
};
```

### 9.4 Database Migration Strategy

- **Tool**: `drizzle-kit` for schema migrations.
- **Workflow**: Migrations are version-controlled in `src/lib/db/migrations/`.
- **Deployment**: Migrations run automatically before app deployment in CI/CD.
- **Safety**: All migrations are tested against a staging DB clone before production. Destructive migrations (column drops, type changes) require manual approval.
- **Rollback**: Every migration has a corresponding down migration. Critical migrations are deployed behind feature flags.

---

## 10. Security

### 10.1 Authentication & Authorization

- **Session-based auth** via Better Auth with HTTP-only, Secure, SameSite=Strict cookies.
- **OAuth providers**: Google, GitHub, Discord (target audience overlap).
- **Rate limiting**: Per-IP and per-user rate limiting on auth endpoints via Redis.
- **CSRF protection**: Built into Better Auth's session management.

### 10.2 Data Security

- **Environment variables**: All secrets (API keys, DB credentials, OAuth secrets) stored in `.env` files locally, and in the hosting platform's secret manager for deployments. Never committed to version control.
- **Input sanitization**: All user-generated content (reviews, comments, list descriptions) sanitized before storage and rendering. Use DOMPurify for HTML content.
- **SQL injection**: Prevented by Drizzle's parameterized queries.
- **XSS**: Prevented by React's default escaping + CSP headers.
- **Spoiler content**: Spoiler-tagged content is hidden by default and requires explicit user action to reveal. Spoiler flags are stored server-side and enforced in the API response.

### 10.3 Security Headers

```
Content-Security-Policy: default-src 'self'; img-src 'self' image.tmdb.org coverartarchive.org ...
Strict-Transport-Security: max-age=31536000; includeSubDomains
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
Referrer-Policy: strict-origin-when-cross-origin
Permissions-Policy: camera=(), microphone=(), geolocation=()
```

---

## 11. Monitoring & Observability

### 11.1 Error Tracking (Sentry)

- Capture all unhandled exceptions in both server and client.
- Source map upload in CI for readable stack traces.
- Release tagging to correlate errors with deployments.
- Alert on error rate spikes (Slack/Discord integration).

### 11.2 Application Metrics (Grafana + Prometheus)

| Metric | Purpose |
|---|---|
| Request latency (P50, P95, P99) | Performance regression detection |
| Error rate by route | Identify broken features |
| DB query duration | Slow query detection |
| Redis hit/miss ratio | Cache effectiveness |
| External API latency + error rate | Provider health monitoring |
| Active users (DAU/MAU) | Growth tracking |

### 11.3 Product Analytics (PostHog)

- Feature usage tracking (which categories are most active, list creation rate, review completion rate).
- Funnel analysis (search → view → rate → log → review).
- Retention cohort analysis.
- A/B testing framework for UI experiments.

---

## 12. MVP Development Phases

### Phase 1: Foundation (Weeks 1–3)
- [ ] Project setup (Next.js, Tailwind, Drizzle, PostgreSQL, Docker Compose)
- [ ] Database schema design and initial migrations
- [ ] Auth system (Better Auth: email/password + Google OAuth)
- [ ] External API adapter layer (start with TMDB + AniList)
- [ ] Basic media search and item detail pages
- [ ] Design system: typography, colors, spacing, core UI components

### Phase 2: Core Features (Weeks 4–7)
- [ ] Rating system (1–5 stars + favorite/heart)
- [ ] Logging flow (quick rate vs. detailed log)
- [ ] Category-specific logging metadata
- [ ] Review system (write, edit, spoiler controls, visibility)
- [ ] User profiles (public/private, favorites, recent activity)
- [ ] Meilisearch integration for universal search

### Phase 3: Social & Lists (Weeks 8–10)
- [ ] Follow system
- [ ] Activity feed (fanout-on-read)
- [ ] Review likes and comments
- [ ] Lists (create, edit, rank, mixed-media)
- [ ] Basic watchlists (add/remove)
- [ ] Planned watchlists (goals, deadlines, progress tracking)

### Phase 4: Polish & Launch (Weeks 11–13)
- [ ] GitHub-style activity heatmap on profiles
- [ ] Responsive design audit (mobile-first)
- [ ] Performance optimization (Lighthouse > 90)
- [ ] Remaining API integrations (IGDB, MusicBrainz, Open Library, Comic Vine)
- [ ] E2E tests (Playwright)
- [ ] CI/CD pipeline finalization
- [ ] Staging deployment + internal testing
- [ ] Production deployment
- [ ] Public launch

### Phase 5: Post-Launch Iteration (Weeks 14+)
- [ ] Notification system (in-app + email)
- [ ] Basic reminders for planned watchlists
- [ ] User onboarding flow (pick favorite media, follow suggested users)
- [ ] Advanced search filters (genre, year, rating range, media type)
- [ ] Profile customization (banner, bio, pinned reviews/lists)
- [ ] Import from Letterboxd / MAL / Goodreads (CSV or API)
- [ ] Yearly media recap feature

---

## 13. Future Considerations (Post-MVP)

### 13.1 Mobile
- **React Native** or **Expo** for cross-platform mobile app sharing the same API backend.
- Consider a **PWA** as an intermediate step before native apps.

### 13.2 AI (Post-MVP Only)
- Review cleanup / grammar suggestions.
- Personalized recommendations based on rating history.
- Smart list suggestions ("You might like…" based on taste overlap with similar users).
- Yearly recap generation (automated summary of media consumed).

### 13.3 Monetization
- **Freemium model**: Free core experience, paid "Pro" tier for advanced features.
- Pro features: advanced stats, custom profile themes, unlimited private lists, priority support.
- **No ads on reviews or profiles**. The social experience must remain clean.

### 13.4 Community Features
- Discussion threads on media items (separate from reviews).
- User groups / clubs (e.g., "Sci-Fi Book Club").
- Community challenges (e.g., "Watch 31 horror movies in October").

---

## 14. Key Risks & Mitigations

| Risk | Impact | Mitigation |
|---|---|---|
| External API rate limits or downtime | Users can't search/add media | Local metadata cache in PostgreSQL; graceful degradation UI |
| External API deprecation or terms change | Loss of media data source | Multi-provider adapters per category; internal data store as fallback |
| Database performance degradation at scale | Slow feeds, searches, profiles | Materialized views, read replicas, partitioning strategy pre-planned |
| Auth.js/Better Auth ecosystem instability | Auth breakage | Abstract auth behind internal interface; migration path to Clerk documented |
| Scope creep beyond media tracking | Diluted product identity | Strict adherence to "media identity platform" principle. No productivity features. |
| Cold start latency on serverless | Slow initial page loads | Drizzle's tiny bundle mitigates; keep minimum warm instances; use PPR for static shells |
| User-generated content moderation | Toxic reviews/comments | Community guidelines, report system, rate limiting on content creation, future: AI moderation |

---

## 15. Success Metrics

| Metric | Target (3 months post-launch) |
|---|---|
| Registered users | 5,000 |
| Monthly active users (MAU) | 2,000 |
| Media items rated | 50,000+ |
| Reviews written | 5,000+ |
| Lists created | 2,000+ |
| Average session duration | > 5 minutes |
| Day-7 retention | > 30% |
| Day-30 retention | > 15% |
| Lighthouse performance score | > 90 |
| Uptime | 99.9% |
