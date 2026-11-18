// src/components/layout/Navbar.jsx
// Skanvi-inspired clean navbar with search, auth icons, and cart

import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';

export default function Navbar() {
  const { user, isAuthenticated, isSeller, isAdmin, logout } = useAuth();
  const { cartCount } = useCart();
  const navigate = useNavigate();
  const location = useLocation();
  const [search, setSearch] = useState('');
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const userMenuRef = useRef(null);

  // Scroll shadow effect
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Close user menu on outside click
  useEffect(() => {
    const handler = (e) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) {
        setUserMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (search.trim()) {
      navigate(`/products?search=${encodeURIComponent(search.trim())}`);
      setSearch('');
    }
  };

  const handleLogout = () => {
    logout();
    setUserMenuOpen(false);
    navigate('/');
  };

  const isHomePage = location.pathname === '/';

  return (
    <header className={`navbar${scrolled ? ' navbar--scrolled' : ''}${isHomePage ? ' navbar--transparent' : ''}`}>
      {/* Top row: logo + search + icons */}
      <div className="navbar__top">
        <div className="container navbar__top-inner">
          {/* Logo */}
          <Link to="/" className="navbar__logo">
            <span className="navbar__logo-text">ODOP</span>
            <span className="navbar__logo-dot">•</span>
            <span className="navbar__logo-nexus">Nexus</span>
          </Link>

          {/* Search */}
          <form className="navbar__search" onSubmit={handleSearch} role="search">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
            <input
              type="search"
              id="navbar-search"
              placeholder="Search products, districts, artisans…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              aria-label="Search products"
            />
          </form>

          {/* Icon Actions */}
          <div className="navbar__actions">
            {/* User Menu */}
            <div className="navbar__icon-wrap" ref={userMenuRef}>
              <button
                id="navbar-user-btn"
                className="navbar__icon-btn"
                onClick={() => {
                  if (!isAuthenticated) { navigate('/login'); }
                  else setUserMenuOpen(v => !v);
                }}
                aria-label={isAuthenticated ? 'Account menu' : 'Login'}
                aria-haspopup={isAuthenticated ? 'menu' : undefined}
              >
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
              </button>

              {isAuthenticated && userMenuOpen && (
                <div className="navbar__user-menu" role="menu">
                  <div className="navbar__user-menu-header">
                    <div className="navbar__user-menu-avatar">
                      {user?.name?.[0]?.toUpperCase() || '?'}
                    </div>
                    <div>
                      <p className="navbar__user-menu-name">{user?.name}</p>
                      <p className="navbar__user-menu-role">{user?.role}</p>
                    </div>
                  </div>
                  <div className="navbar__user-menu-divider" />
                  {isSeller ? (
                    <>
                      <Link to="/seller/dashboard" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                        Seller Dashboard
                      </Link>
                      <Link to="/seller/products" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                        My Products
                      </Link>
                      <Link to="/seller/orders" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                        My Orders
                      </Link>
                    </>
                  ) : isAdmin ? (
                    <Link to="/admin" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                      Admin Panel
                    </Link>
                  ) : (
                    <>
                      <Link to="/orders" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                        My Orders
                      </Link>
                      <Link to="/wishlist" className="navbar__user-menu-item" onClick={() => setUserMenuOpen(false)}>
                        Wishlist
                      </Link>
                    </>
                  )}
                  <div className="navbar__user-menu-divider" />
                  <button className="navbar__user-menu-item navbar__user-menu-item--danger" onClick={handleLogout}>
                    Sign out
                  </button>
                </div>
              )}
            </div>

            {/* Cart */}
            {(!isAuthenticated || (!isSeller && !isAdmin)) && (
              <Link to="/cart" className="navbar__icon-btn navbar__cart-btn" id="navbar-cart-btn" aria-label="Cart">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                  <line x1="3" y1="6" x2="21" y2="6"/>
                  <path d="M16 10a4 4 0 0 1-8 0"/>
                </svg>
                {cartCount > 0 && (
                  <span className="navbar__cart-badge">{cartCount > 99 ? '99+' : cartCount}</span>
                )}
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Bottom row: navigation links + free delivery strip */}
      <div className="navbar__bottom">
        <div className="container navbar__bottom-inner">
          <nav className="navbar__nav" aria-label="Main navigation">
            <Link to="/products" className={`navbar__nav-link${location.pathname.startsWith('/products') ? ' active' : ''}`}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="2" y="3" width="7" height="7"/><rect x="15" y="3" width="7" height="7"/>
                <rect x="15" y="15" width="7" height="7"/><rect x="2" y="15" width="7" height="7"/>
              </svg>
              Products
            </Link>
            <Link to="/products?type=districts" className="navbar__nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                <polyline points="9 22 9 12 15 12 15 22"/>
              </svg>
              Districts
            </Link>
            <Link to="/products?sort=created_at:desc" className="navbar__nav-link">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              New Arrivals
            </Link>
            {!isAuthenticated && (
              <Link to="/register?role=seller" className="navbar__nav-link navbar__nav-link--seller">
                Become a Seller
              </Link>
            )}
          </nav>

          <div className="navbar__strip">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
              <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
            </svg>
            Free delivery on orders above ₹499
          </div>
        </div>
      </div>

      <style>{`
        .navbar {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          z-index: var(--z-sticky);
          background: var(--color-surface);
          transition: box-shadow var(--transition-base), background var(--transition-base);
        }
        .navbar--scrolled {
          box-shadow: var(--shadow-md);
        }

        .navbar__top {
          border-bottom: 1px solid var(--color-border);
        }
        .navbar__top-inner {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          height: 64px;
        }

        .navbar__logo {
          display: flex;
          align-items: center;
          gap: 2px;
          flex-shrink: 0;
          text-decoration: none;
        }
        .navbar__logo-text {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: var(--weight-bold);
          color: var(--color-text-primary);
          letter-spacing: -0.04em;
        }
        .navbar__logo-dot {
          font-size: 1.2rem;
          color: var(--color-accent);
          margin-inline: 2px;
        }
        .navbar__logo-nexus {
          font-family: var(--font-display);
          font-size: 1.5rem;
          font-weight: var(--weight-light);
          color: var(--color-accent);
          letter-spacing: -0.02em;
        }

        .navbar__search {
          flex: 1;
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: var(--color-bg-alt);
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          padding: var(--space-2) var(--space-5);
          transition: border-color var(--transition-fast), box-shadow var(--transition-fast);
        }
        .navbar__search:focus-within {
          border-color: var(--color-accent);
          background: var(--color-surface);
          box-shadow: 0 0 0 3px rgba(61,90,78,0.1);
        }
        .navbar__search svg { color: var(--color-text-muted); flex-shrink: 0; }
        .navbar__search input {
          border: none;
          background: none;
          outline: none;
          font-size: var(--text-sm);
          color: var(--color-text-primary);
          width: 100%;
        }
        .navbar__search input::placeholder { color: var(--color-text-muted); }

        .navbar__actions {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          flex-shrink: 0;
        }

        .navbar__icon-wrap { position: relative; }

        .navbar__icon-btn {
          width: 40px;
          height: 40px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-text-secondary);
          transition: all var(--transition-fast);
          position: relative;
          text-decoration: none;
        }
        .navbar__icon-btn:hover {
          background: var(--color-bg-alt);
          color: var(--color-text-primary);
        }

        .navbar__cart-btn { position: relative; }
        .navbar__cart-badge {
          position: absolute;
          top: -2px;
          right: -2px;
          background: var(--color-accent);
          color: white;
          font-size: 10px;
          font-weight: 700;
          width: 18px;
          height: 18px;
          border-radius: 50%;
          display: flex;
          align-items: center;
          justify-content: center;
          border: 2px solid var(--color-surface);
        }

        .navbar__user-menu {
          position: absolute;
          top: calc(100% + 8px);
          right: 0;
          background: var(--color-surface);
          border: 1px solid var(--color-border);
          border-radius: var(--radius-xl);
          box-shadow: var(--shadow-xl);
          min-width: 220px;
          z-index: var(--z-dropdown);
          animation: scaleIn 0.15s ease;
          transform-origin: top right;
          overflow: hidden;
        }
        .navbar__user-menu-header {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-5) var(--space-5) var(--space-4);
        }
        .navbar__user-menu-avatar {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          background: var(--color-accent-pale);
          color: var(--color-accent);
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: var(--weight-semibold);
          font-size: var(--text-base);
          flex-shrink: 0;
        }
        .navbar__user-menu-name {
          font-weight: var(--weight-semibold);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }
        .navbar__user-menu-role {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
          text-transform: capitalize;
        }
        .navbar__user-menu-divider {
          height: 1px;
          background: var(--color-border);
        }
        .navbar__user-menu-item {
          display: block;
          padding: var(--space-3) var(--space-5);
          font-size: var(--text-sm);
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: all var(--transition-fast);
          width: 100%;
          text-align: left;
          background: none;
          border: none;
          font-family: inherit;
          cursor: pointer;
        }
        .navbar__user-menu-item:hover {
          background: var(--color-bg-alt);
          color: var(--color-text-primary);
        }
        .navbar__user-menu-item--danger {
          color: var(--color-error);
        }
        .navbar__user-menu-item--danger:hover {
          background: #fde8e8;
        }

        .navbar__bottom {
          background: var(--color-bg-alt);
        }
        .navbar__bottom-inner {
          display: flex;
          align-items: center;
          justify-content: space-between;
          height: 46px;
        }
        .navbar__nav {
          display: flex;
          align-items: center;
          gap: var(--space-6);
        }
        .navbar__nav-link {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          font-weight: var(--weight-medium);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: var(--color-text-secondary);
          text-decoration: none;
          transition: color var(--transition-fast);
          padding-block: var(--space-1);
          border-bottom: 2px solid transparent;
        }
        .navbar__nav-link:hover,
        .navbar__nav-link.active {
          color: var(--color-text-primary);
        }
        .navbar__nav-link.active {
          border-bottom-color: var(--color-text-primary);
        }
        .navbar__nav-link--seller {
          background: var(--color-accent);
          color: white;
          padding: var(--space-1) var(--space-4);
          border-radius: var(--radius-full);
          border-bottom: none;
        }
        .navbar__nav-link--seller:hover {
          background: var(--color-accent-light);
          color: white;
        }

        .navbar__strip {
          display: flex;
          align-items: center;
          gap: var(--space-2);
          font-size: var(--text-xs);
          color: var(--color-text-secondary);
          background: var(--color-accent);
          color: white;
          padding: var(--space-1) var(--space-4);
          border-radius: var(--radius-full);
          font-weight: var(--weight-medium);
        }

        @media (max-width: 768px) {
          .navbar__search { display: none; }
          .navbar__nav { gap: var(--space-4); }
          .navbar__strip { display: none; }
          .navbar__logo-nexus { display: none; }
        }
      `}</style>
    </header>
  );
}
