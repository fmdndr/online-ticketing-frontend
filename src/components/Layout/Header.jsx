import { useState, useEffect } from 'react';
import { Link, NavLink, useLocation } from 'react-router-dom';
import { User, Bell, ShoppingBag, Menu, X } from 'lucide-react';
import { getUserRole } from '../../services/api';

export default function Header() {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const location = useLocation();
  const isAuthenticated = !!localStorage.getItem('auth_token');
  const role = getUserRole();
  const isAdmin = role === 'Admin';

  // Close mobile menu when route changes
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location]);

  // Prevent body scroll when mobile menu is open
  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
  }, [isMobileMenuOpen]);

  const tabs = [
    { to: '/', label: 'Events' },
    ...(isAuthenticated ? [
      { to: '/orders', label: 'Orders' },
      { to: '/account', label: 'Account' },
    ] : []),
    ...(isAdmin ? [
      { to: '/admin', label: 'Admin' },
    ] : []),
  ];

  return (
    <header className="fixed top-0 w-full z-[100] bg-surface/80 backdrop-blur-glass border-b border-outline-variant/15 transition-all">
      <div className="max-w-7xl mx-auto px-4 md:px-6 h-[72px] flex items-center justify-between">
        
        <div className="flex items-center gap-4">
          {/* Hamburger Menu - Only Mobile */}
          <button 
            className="md:hidden p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>

          <Link to="/" className="flex items-center gap-3 group">
            <img src="/socratic-event-icon.png" alt="Socratic Event" className="w-8 h-8 object-contain" />
            <span className="text-xl font-extrabold tracking-tightest text-on-surface">
              SOCRATIC
            </span>
          </Link>
        </div>

        {/* Desktop Navigation */}
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
        <div className="flex items-center gap-1 md:gap-3">
          <div className="hidden lg:flex font-mono text-[10px] text-on-surface-variant bg-surface-container-low px-2 py-1 rounded mr-1 border border-outline-variant/15">
            SYS_ONLINE
          </div>
          {isAuthenticated && (
            <button className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
              <ShoppingBag size={20} />
            </button>
          )}
          {isAuthenticated && (
            <button className="hidden sm:block p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
              <Bell size={20} />
            </button>
          )}
          <Link to={isAuthenticated ? "/account" : "/login"} className="p-2 text-on-surface-variant hover:text-on-surface hover:bg-surface-container-low rounded transition-colors">
            <User size={20} />
          </Link>
        </div>
      </div>

      {/* Mobile Navigation Overlay */}
      <div 
        className={`fixed inset-0 top-[73px] bg-surface z-[90] transition-transform duration-300 md:hidden ${
          isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <nav className="flex flex-col p-6 gap-2">
          {tabs.map(({ to, label }) => (
            <NavLink
              key={label}
              to={to}
              className={({ isActive }) =>
                `text-2xl font-extrabold tracking-tightest uppercase p-4 rounded-xl transition-all ${
                  isActive ? 'bg-primary text-on-primary shadow-primary' : 'text-on-surface hover:bg-surface-container-low'
                }`
              }
            >
              {label}
            </NavLink>
          ))}
          
          <div className="mt-8 pt-8 border-t border-outline-variant/15 space-y-4">
             <div className="flex items-center justify-between px-4">
                <span className="text-xs font-bold text-on-surface-variant tracking-widest uppercase">System Status</span>
                <span className="text-[10px] font-mono text-primary bg-primary/10 px-2 py-1 rounded">SECURE_SYNC_OK</span>
             </div>
             {!isAuthenticated && (
               <Link 
                 to="/login" 
                 className="block w-full text-center bg-surface-container-high text-on-surface font-extrabold py-4 rounded-xl"
               >
                 SIGN IN
               </Link>
             )}
          </div>
        </nav>
      </div>
    </header>
  );
}
