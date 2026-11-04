# A Little Diwali Magic

A mobile-first, three-step Diwali experience built with Next.js App Router, TypeScript, Tailwind CSS, React Three Fiber, Drei, Three.js, GSAP, Framer Motion, Lucide and Supabase. The desktop layout keeps the greeting centered and intimate.

## Run locally

Requires Node.js 20.9 or newer. On Windows use `npm.cmd` if PowerShell blocks `npm.ps1`.

```sh
npm install
cp .env.example .env.local
npm run dev
```

Open http://localhost:3000. `npm run typecheck` checks TypeScript; `npm run build` creates the production build; `npm start` serves it.

With the local server running and Google Chrome installed, `node scripts/verify.mjs` runs the browser verification suite and saves screenshots to `artifacts/`. It tests the five target viewports, name validation, initial unlit state, lighting gate, one-write behavior, both sharing paths, unavailable-counter state, API validation, reduced motion and WebGL fallback.

## Connect the global counter

1. Create a Supabase project.
2. Run `supabase/migrations/001_diya_counter.sql` in the project's SQL editor.
3. Set `SUPABASE_URL` and `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`. The key is server-only: never prefix it with `NEXT_PUBLIC_` or commit it.
4. Restart the server. Set these same secrets in your production hosting environment before deployment.

No credentials are included. Without configuration the greeting still works and the counter honestly reports that it is unavailable. It never displays a fabricated total. Visitors poll the server every 15 seconds while the final screen is visible; background tabs do not poll.

Run `node scripts/check-counter.mjs` to verify the connection, counter row and increment function without adding a diya. API credentials cannot create the database schema; applying the migration requires the Supabase SQL Editor, a connected Supabase integration with migration access, or database/management credentials.

With the local server running, `node scripts/verify-counter.mjs` checks lost responses, automatic/manual retries, reuse of event IDs, and stale refresh protection. Browser tests intercept counter requests and never add test lights to the live database.

Failed lighting submissions retry automatically up to three attempts and again when the network reconnects. Every attempt uses the original event UUID. Reading the global total cannot hide an unconfirmed submission. The final screen keeps a manual retry available, and older refresh responses cannot replace a newer, higher count.

Each actual lighting generates a UUID once. The API accepts this UUID and a server-only RPC atomically inserts the event and increments the total. The primary key prevents retries or repeated taps from incrementing twice. Failed requests can be retried using the same event ID from the final screen. Sharing never writes to the counter. RLS denies anonymous/authenticated clients direct table access, and only the server service role can invoke the RPC. This provides event idempotency, not bot prevention; add hosting rate limits or a challenge before a large public campaign.

## Experience and accessibility

- Name validation accepts international names, trims whitespace, and requires 2–40 characters with at least one letter. The name remains only in memory.
- The lighting screen always starts unlit. No flame or local flame light exists until the diya is activated. Continue is disabled until lighting. Going back preserves an already completed light and cannot record a second event in that experience.
- The lamp uses custom lathed bowl geometry, brass material, a detailed rim, oil surface, wick, pedestal and layered flame meshes. Warm studio reflections keep the unlit metallic lamp visible.
- The welcome shows a lit preview, while the lighting step begins dark. On the final greeting, LIGHT UP THE FIREWORKS starts a 5.4-second Three.js sequence behind the content, with staggered launches, warm explosions, gravity and fading trails. It never autoplays, keeps the diya lit, and can be replayed after completion. Enabled audio plays the original chime. Reduced motion uses a brief static sparkle display; unavailable WebGL gets the same lightweight fallback.
- The fireworks CTA sits above a secondary outlined share button and the single global counter. Neither fireworks nor sharing records another lighting event.
- Sound is off by default. The toggle enables original synthesized ambient tones and event chimes; no third-party music assets are used.
- Native sharing includes the entered name and URL. Unsupported browsers use clipboard sharing, with an explanatory error if unavailable.
- Lazy-loaded WebGL scene; DPR capped at 1.5, modest particles, low-resolution local light environment without external models/HDRs. Hidden tabs suspend animation/audio. Reduced motion renders a static scene and removes UI movement.
- A CSS-rendered metallic lamp and flame provide a lightweight WebGL failure fallback. All interactions remain HTML buttons with labels and keyboard access.
- Google-hosted fonts have local serif/sans-serif fallbacks if the font request fails.
- Layout uses `100dvh` and flexible illustration space to fit the actual browser height, including address-bar/orientation changes. Spacing contracts on shorter screens while buttons keep their touch targets. Normal layouts are checked down to 360×640. Below that height, or when enlarged text needs more room, scrolling remains available instead of clipping content. Run `node scripts/verify-layout.mjs` to check all three screens, validation feedback and viewport resizing.

## Counter verification against a configured database

With the local server running, `node scripts/verify-fireworks.mjs` checks on-demand fireworks, completion and replay, sharing during a burst, mobile layout at 390/360/375/412px, reduced motion, WebGL fallback and unchanged lighting request count. It intercepts counter calls so tests do not alter the real total, and captures updated 390px screenshots in `artifacts/`.

Record the initial GET `/api/diyas` total. POST `{ "eventId": "<a random v4 UUID>" }` twice; both should return the initial total plus one. A new UUID should increase it once more. A malformed UUID should return 400. Anonymous Supabase clients should be unable to mutate either table or execute the RPC. Open two visitors and check that both final screens converge within 15 seconds. These checks need a real Supabase project and cannot be completed without credentials.

## Deployment

Deploy to a Next.js-compatible Node host (such as Vercel), configure both server environment variables and use `npm run build`. The server API means a static-only export is not suitable. Never put the service-role key in client code.
