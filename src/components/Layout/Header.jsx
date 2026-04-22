import { Link, NavLink } from 'react-router-dom';
import { Zap } from 'lucide-react';
import './Header.css';

export default function Header() {
  const tabs = [
    { to: '/', label: 'Events' },
    { to: '/orders', label: 'Orders' },
    { to: '/account', label: 'Account' },
    { to: '/admin', label: 'Admin' },
  ];

  return (
    <header className="header" id="main-header">
      <Link to="/" className="header__logo" id="header-logo">
        <div className="header__logo-icon">
          <Zap size={18} fill="white" />
        </div>
        <span className="header__logo-text">KINETIC</span>
      </Link>

      <div className="header__actions">
        <nav className="header__nav">
          {tabs.map(({ to, label }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `header__nav-link ${isActive ? 'header__nav-link--active' : ''}`
              }
            >
              {label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  );
}
