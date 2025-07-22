import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Beach Match | 98.5 The Beach WSBH - Space Coast Greatest Hits',
  description: 'Play Beach Match with 98.5 The Beach (WSBH) - Your Space Coast Greatest Hits station! Match beach-themed pieces, listen to classic hits, and earn bonuses from local Melbourne & Brevard County businesses.',
  keywords: '98.5, the beach, wsbh, beach radio, match-3, space coast, florida, music, prizes, game, 985, melbourne, brevard county, satellite beach, classic hits',
  authors: [{ name: '98.5 The Beach WSBH - Space Coast Greatest Hits' }],
  icons: {
    icon: '/favicon.ico',
  }
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className={`${inter.className} bg-gradient-to-br from-beach-50 via-white to-starfish-50 min-h-screen`}>
        <div className="min-h-screen">
          {children}
        </div>
      </body>
    </html>
  );
} 