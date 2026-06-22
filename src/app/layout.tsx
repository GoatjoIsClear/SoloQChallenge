import type { Metadata } from 'next';
import { Inter, Chakra_Petch, JetBrains_Mono } from 'next/font/google';
import './globals.css';
import Navbar from '@/components/Navbar';

const inter = Inter({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-inter',
  display: 'swap',
});

const chakra = Chakra_Petch({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-chakra',
  display: 'swap',
});

const jbMono = JetBrains_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-jb',
  display: 'swap',
});

export const metadata: Metadata = {
  title: 'LoL Tracker — Friends SoloQ Leaderboard',
  description: 'Live ranked leaderboard, live games and match history for your squad.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${chakra.variable} ${jbMono.variable}`}>
      <body className="surface-app min-h-screen font-body text-ink antialiased">
        <Navbar />
        <main className="container-general">{children}</main>
      </body>
    </html>
  );
}
