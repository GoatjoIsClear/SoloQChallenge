'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV = [
  { href: '/', label: 'Leaderboard', subtitle: 'Ranking' },
  { href: '/live', label: 'Live Games', subtitle: 'Live Games' },
  { href: '/history', label: 'History', subtitle: 'Match History' },
  { href: '/stats', label: 'Statistics', subtitle: 'Statistics' },
  { href: '/admin', label: 'Players', subtitle: 'Players' },
];

export default function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="sidebar-brand">
          <div className="sidebar-brand-mark">F</div>
          <div>
            <h1>FRIENDS</h1>
            <p>Tracker</p>
          </div>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div>
          {NAV.map(({ href, label }) => (
            <Link key={href} href={href} className={`nav-item ${pathname === href ? 'active' : ''}`}>
              <span className="nav-icon">●</span>
              <span>{label}</span>
            </Link>
          ))}
        </div>
      </nav>

      <div className="sidebar-footer">
        <div className="sidebar-footer-chip">Private • Friends Only</div>
      </div>
    </aside>
  );
}
