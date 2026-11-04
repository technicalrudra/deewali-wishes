import type { Metadata, Viewport } from 'next';
import './globals.css';
const productionUrl = 'https://deewali-wishes.vercel.app';
const previewImageUrl = `${productionUrl}/Radiant%20Diwali%20Glow.png`;
const title = 'Happy Diwali! | A Little Diwali Magic';
const description = 'Let your happiness shine. Light a diya, make a wish, and share a little Diwali magic with the people you love.';
export const metadata: Metadata = {
  metadataBase: new URL(productionUrl),
  title,
  description,
  openGraph: {
    type: 'website',
    url: productionUrl,
    siteName: 'A Little Diwali Magic',
    title,
    description,
    locale: 'en_IN',
    images: [{
      url: previewImageUrl,
      width: 1200,
      height: 630,
      type: 'image/png',
      alt: 'Happy Diwali! Let your happiness shine. A golden brass diya, fireworks and glowing particles against a midnight purple sky. A Little Diwali Magic.',
    }],
  },
  twitter: {
    card: 'summary_large_image',
    title,
    description,
    images: [{ url: previewImageUrl, alt: 'Happy Diwali! Let your happiness shine. A Little Diwali Magic.' }],
  },
};
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#160b20' };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
