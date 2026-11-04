import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata: Metadata = { title: 'A Little Diwali Magic — A light, a wish, a little magic', description: 'A little light. A heartfelt wish. An unforgettable Diwali. Open your personalized celebration.' };
export const viewport: Viewport = { width: 'device-width', initialScale: 1, themeColor: '#160b20' };
export default function RootLayout({children}: Readonly<{children:React.ReactNode}>) { return <html lang="en"><body>{children}</body></html>; }
