'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Item = { href: string; korean: string; english: string };

const LEFT: Item[] = [
  { href: '/', korean: '순위', english: 'Leaderboard' },
  { href: '/live', korean: '라이브 게임', english: 'Live Games' },
  { href: '/history', korean: '전적', english: 'History' },
];

const RIGHT: Item[] = [
  { href: '/stats', korean: '통계', english: 'Statistics' },
  { href: '/admin', korean: '선수', english: 'Players' },
];

function NavLink({ item, active }: { item: Item; active: boolean }) {
  return (
    <Link
      href={item.href}
      className={`group relative flex flex-col items-center gap-2 px-4 py-2 transition-colors duration-200
        ${active ? 'text-gold' : 'text-muted hover:text-ink'}`}
    >
      <span className="font-display text-lg font-semibold leading-none">{item.korean}</span>
      <span className="text-[11px] font-semibold uppercase tracking-[0.22em] leading-none">
        {item.english}
      </span>
      <span
        className={`pointer-events-none absolute -bottom-0.5 h-px w-full origin-center bg-gradient-to-r from-transparent via-gold to-transparent transition-transform duration-300
          ${active ? 'scale-x-100' : 'scale-x-0 group-hover:scale-x-75'}`}
      />
    </Link>
  );
}

export default function Navbar() {
  const pathname = usePathname();
  const isActive = (href: string) => pathname === href;

  return (
    <header className="sticky top-0 z-50 border-b border-steel/50 bg-void/80 backdrop-blur-xl">
      <nav className="relative flex h-24 w-full items-center justify-between gap-8 px-6 md:px-12 lg:px-20">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-x-0 top-0 mx-auto h-24 w-[460px] bg-[radial-gradient(closest-side,rgba(232,185,112,0.12),transparent)]"
        />

        {/* Left cluster — pushed toward the centered logo */}
        <div className="hidden flex-1 items-center justify-end gap-8 md:flex lg:gap-12">
          {LEFT.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>

        {/* Center logo */}
        <Link href="/" className="relative flex shrink-0 flex-col items-center justify-center leading-none">
          <span className="font-display text-4xl font-bold italic tracking-tight text-gold lg:text-5xl">
            LOL<span className="text-ink">TRACKER</span>
          </span>
          <span className="mt-2 text-[10px] font-semibold uppercase tracking-[0.5em] text-gold-deep">
            Solo Queue
          </span>
        </Link>

        {/* Right cluster */}
        <div className="hidden flex-1 items-center justify-start gap-8 md:flex lg:gap-12">
          {RIGHT.map((item) => (
            <NavLink key={item.href} item={item} active={isActive(item.href)} />
          ))}
        </div>
      </nav>

      {/* Mobile: single scrollable row of all links */}
      <div className="flex items-center justify-center gap-2 overflow-x-auto px-4 pb-4 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        {[...LEFT, ...RIGHT].map((item) => (
          <NavLink key={item.href} item={item} active={isActive(item.href)} />
        ))}
      </div>
    </header>
  );
}
