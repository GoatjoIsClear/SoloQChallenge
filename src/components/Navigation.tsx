'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Navigation() {
  const pathname = usePathname();

  const leftMenuItems = [
    { href: '/', korean: '순위', english: 'Leaderboard' },
    { href: '/live', korean: '라이브 게임', english: 'Live Games' },
    { href: '/history', korean: '전적', english: 'History' },
  ];

  const rightMenuItems = [
    { href: '/stats', korean: '통계', english: 'Statistics' },
  ];

  const isActive = (href: string) => pathname === href;

  return (
    <div className="header">
      <nav>
        <div className="nav">
          <div className="nav-group nav-group-left">
            {leftMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`menu_button-default ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="menu-label-korean">{item.korean}</span>
                <span className="menu-label-english">{item.english}</span>
              </Link>
            ))}
          </div>

          <Link href="/" className="logo">
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
              <div style={{ fontSize: '64px', fontWeight: '900', color: '#e3b46a', fontStyle: 'italic' }}>
                LOL
              </div>
              <div style={{ fontSize: '11px', color: '#e3b46a', textTransform: 'uppercase', letterSpacing: '2px' }}>
                TRACKER
              </div>
            </div>
          </Link>

          <div className="nav-group nav-group-right">
            {rightMenuItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`menu_button-default ${isActive(item.href) ? 'active' : ''}`}
              >
                <span className="menu-label-korean">{item.korean}</span>
                <span className="menu-label-english">{item.english}</span>
              </Link>
            ))}
          </div>
        </div>
      </nav>
    </div>
  );
}
