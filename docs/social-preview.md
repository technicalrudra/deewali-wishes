# Social sharing preview

Production domain: `https://deewali-wishes.vercel.app`

Public image: `https://deewali-wishes.vercel.app/Radiant%20Diwali%20Glow.png`

The static metadata export in `src/app/layout.tsx` remains in a Server Component. It provides the page title/description, metadata base, Open Graph website URL/site name/title/description/image/alt/type/dimensions, and Twitter large-image card/title/description/image/alt. All generated URL fields use the production origin, including when the app is served from a development or preview origin. The PNG is served directly from `public/`, with no authentication or database dependencies.

The final asset is `public/Radiant Diwali Glow.png`, normalized to exactly 1200 × 630 pixels. It was created with the built-in image-generation tool, using the existing Diwali image as a style reference. The original is preserved locally in ignored `artifacts/Radiant Diwali Glow-original.png`.

Generation prompt: create a premium 1200 × 630 Open Graph Diwali image, midnight purple #160B20 background, one detailed golden 3D brass diya with warm flame, golden/champagne fireworks and glowing particles, restrained Indian ornament and elegant premium serif type. Exact text: “HAPPY DIWALI!”, “Let your happiness shine.” and “A Little Diwali Magic”. Preserve strong contrast, safe margins and readability at small WhatsApp preview sizes; no extra copy or UI controls.

## Verification

```sh
npm run build
npm run start -- --port 3100
node scripts/verify-metadata.mjs
```

This inspects the raw HTML returned to a WhatsApp user agent without executing JavaScript. It checks the metadata in `<head>`, absolute production URLs, public unauthenticated image HTTP 200, PNG content type/signature and actual 1200 × 630 image dimensions.

To verify production, set `OG_VERIFY_URL=https://deewali-wishes.vercel.app` before running the same script. Deploy the commit before running this check against production. Social apps may cache earlier link previews even after the new HTML and image are live.
