import { Link, NavLink } from 'react-router-dom';
import { User, Bell, ShoppingBag } from 'lucide-react';

export default function Header() {
  const isAuthenticated = !!localStorage.getItem('auth_token');

  const tabs = [
    { to: '/', label: 'Events' },
    ...(isAuthenticated ? [
      { to: '/orders', label: 'Orders' },
      { to: '/account', label: 'Account' },
    ] : []),
  ];

  return (
    <header className="fixed top-0 w-full z-[100] bg-surface/80 backdrop-blur-glass border-b border-outline-variant/15 transition-all">
      <div className="max-w-7xl mx-auto px-6 h-[72px] flex items-center justify-between">
        
        {/* Logo */}
        <Link to="/" className="flex items-center gap-3 group">
          <img src="/socratic-event-icon.png" alt="Socratic Event" className="w-8 h-8 object-contain" />
          <span className="text-xl font-extrabold tracking-tightest text-on-surface">
            SOCRATIC
          </span>
        </Link>

        {/* Navigation */}
        <nav className="hidden md:flex items-center gap-8 absolute left-1/2 -translate-x-1/2">
          {tabs.map(({ to, label }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `text-sm font-bold tracking-wider uppercase transition-colors ${
                  isActive ? 'text-primary' : 'text-on-surface-variant hover:text-on-surface'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>

        {/* Actions */}
        <div className="flex items-center gap-3">
          <div className="hidden md:flex font-mono text-xs text-on-surface-variant bg-surface-container-low px-2 py-1 rounded mr-2 border border-outline-variant/15">
            SYS_ONLINE
          </div>
          {isAuthenticated && (
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
              <ShoppingBag size={20} />
            </button>
          )}
          {isAuthenticated && (
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
              <Bell size={20} />
            </button>
          )}
          <Link to={isAuthenticated ? "/account" : "/login"} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
            <User size={20} />
          </Link>
        </div>
      </div>
    </header>
  );
}
