import assert from 'node:assert/strict';

const base = process.env.OG_VERIFY_URL || 'http://localhost:3100';
const production = 'https://deewali-wishes.vercel.app';
const imageUrl = `${production}/Radiant%20Diwali%20Glow.png`;
const response = await fetch(base, {
  headers: { 'User-Agent': 'WhatsApp/2.24 OpenGraph-Verification' },
  signal: AbortSignal.timeout(20000),
});
assert.equal(response.status, 200, 'Page is accessible without authentication');
const html = await response.text();
const head = html.match(/<head>([\s\S]*?)<\/head>/)?.[1];
assert.ok(head, 'Server-rendered HTML contains a head element');
const tags = new Map();
for (const match of head.matchAll(/<meta\s+([^>]+)>/g)) {
  const attributes = Object.fromEntries(Array.from(match[1].matchAll(/([\w:-]+)="([^"]*)"/g), item => [item[1], item[2]]));
  const name = attributes.property || attributes.name;
  if (name) tags.set(name, attributes.content);
}
assert.match(head, /<title>Happy Diwali! \| A Little Diwali Magic<\/title>/);
for (const name of ['description', 'og:title', 'og:description', 'og:image:alt', 'twitter:title', 'twitter:description', 'twitter:image:alt']) {
  assert.ok(tags.get(name), `${name} is present in server-rendered HTML`);
}
assert.equal(tags.get('og:url'), production);
assert.equal(tags.get('og:image'), imageUrl);
assert.equal(tags.get('og:image:width'), '1200');
assert.equal(tags.get('og:image:height'), '630');
assert.equal(tags.get('og:image:type'), 'image/png');
assert.equal(tags.get('twitter:card'), 'summary_large_image');
assert.equal(tags.get('twitter:image'), imageUrl);
const image = await fetch(`${base}/Radiant%20Diwali%20Glow.png`, { signal: AbortSignal.timeout(20000) });
assert.equal(image.status, 200, 'Public OG image returns HTTP 200 without credentials');
assert.match(image.headers.get('content-type'), /image\/png/);
const bytes = Buffer.from(await image.arrayBuffer());
assert.equal(bytes.subarray(0, 8).toString('hex'), '89504e470d0a1a0a');
assert.equal(bytes.readUInt32BE(16), 1200);
assert.equal(bytes.readUInt32BE(20), 630);
console.log(`PASS ${base}: title/description and OG/Twitter tags are in server HTML; absolute production URLs; unauthenticated image HTTP 200; PNG dimensions 1200 x 630.`);
console.log(`Final image URL: ${imageUrl}`);
