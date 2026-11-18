// src/components/layout/Footer.jsx
// Clean, elegant footer in Skanvi style

import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        {/* Main footer grid */}
        <div className="footer__grid">
          {/* Brand column */}
          <div className="footer__brand">
            <Link to="/" className="footer__logo">
              <span className="footer__logo-text">ODOP</span>
              <span className="footer__logo-dot">•</span>
              <span className="footer__logo-nexus">Nexus</span>
            </Link>
            <p className="footer__tagline">
              Discover authentic One District One Product items from across India.
              Support local artisans and craftspeople.
            </p>
            <div className="footer__social">
              <a href="#" aria-label="Instagram" className="footer__social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="2" y="2" width="20" height="20" rx="5" ry="5"/>
                  <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/>
                  <line x1="17.5" y1="6.5" x2="17.51" y2="6.5"/>
                </svg>
              </a>
              <a href="#" aria-label="Facebook" className="footer__social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/>
                </svg>
              </a>
              <a href="#" aria-label="Twitter / X" className="footer__social-btn">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M22 4s-.7 2.1-2 3.4c1.6 10-9.4 17.3-18 11.6 2.2.1 4.4-.6 6-2C3 15.5.5 9.6 3 5c2.2 2.7 5.5 4.3 9 4-.9-4.2 4-6.6 7-3.8 1.1 0 3-1.2 3-1.2z"/>
                </svg>
              </a>
            </div>
          </div>

          {/* Shopping column */}
          <div className="footer__col">
            <h3 className="footer__col-title">Shop</h3>
            <ul className="footer__links">
              <li><Link to="/products">All Products</Link></li>
              <li><Link to="/products?sort=created_at:desc">New Arrivals</Link></li>
              <li><Link to="/products?type=districts">By District</Link></li>
              <li><Link to="/products?featured=true">Featured</Link></li>
            </ul>
          </div>

          {/* Seller column */}
          <div className="footer__col">
            <h3 className="footer__col-title">Sell</h3>
            <ul className="footer__links">
              <li><Link to="/register?role=seller">Start Selling</Link></li>
              <li><Link to="/seller/dashboard">Seller Dashboard</Link></li>
            </ul>
          </div>

          {/* Help column */}
          <div className="footer__col">
            <h3 className="footer__col-title">Help</h3>
            <ul className="footer__links">
              <li><Link to="/orders">Track Order</Link></li>
              <li><a href="mailto:support@odopnexus.in">Contact Us</a></li>
            </ul>
          </div>
        </div>

        <hr className="footer__divider" />

        {/* Bottom bar */}
        <div className="footer__bottom">
          <p className="footer__copy">
            © {new Date().getFullYear()} ODOP Nexus. Made with ♥ in India.
          </p>
          <div className="footer__bottom-links">
            <a href="#">Privacy Policy</a>
            <a href="#">Terms of Service</a>
            <a href="#">Shipping Policy</a>
          </div>
        </div>
      </div>

      <style>{`
        .footer {
          background-color: var(--color-bg-dark);
          color: var(--color-text-inverse);
          padding-top: var(--space-20);
          padding-bottom: var(--space-10);
          margin-top: auto;
        }

        .footer__grid {
          display: grid;
          grid-template-columns: 2fr 1fr 1fr 1fr;
          gap: var(--space-12);
          margin-bottom: var(--space-12);
        }

        .footer__logo {
          display: inline-flex;
          align-items: center;
          gap: 2px;
          text-decoration: none;
          margin-bottom: var(--space-4);
        }
        .footer__logo-text {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: var(--weight-bold);
          color: white;
          letter-spacing: -0.04em;
        }
        .footer__logo-dot {
          font-size: 1.1rem;
          color: var(--color-accent-light);
          margin-inline: 2px;
        }
        .footer__logo-nexus {
          font-family: var(--font-display);
          font-size: 1.4rem;
          font-weight: var(--weight-light);
          color: var(--color-accent-light);
          letter-spacing: -0.02em;
        }

        .footer__tagline {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.5);
          line-height: 1.7;
          margin-bottom: var(--space-6);
        }

        .footer__social {
          display: flex;
          gap: var(--space-3);
        }
        .footer__social-btn {
          width: 38px;
          height: 38px;
          border-radius: 50%;
          border: 1px solid rgba(255,255,255,0.15);
          display: flex;
          align-items: center;
          justify-content: center;
          color: rgba(255,255,255,0.5);
          text-decoration: none;
          transition: all var(--transition-fast);
        }
        .footer__social-btn:hover {
          border-color: rgba(255,255,255,0.4);
          color: white;
          background: rgba(255,255,255,0.08);
        }

        .footer__col-title {
          font-family: var(--font-body);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          text-transform: uppercase;
          letter-spacing: 0.12em;
          color: rgba(255,255,255,0.4);
          margin-bottom: var(--space-5);
        }

        .footer__links {
          display: flex;
          flex-direction: column;
          gap: var(--space-3);
        }
        .footer__links a {
          font-size: var(--text-sm);
          color: rgba(255,255,255,0.6);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .footer__links a:hover { color: white; }

        .footer__divider {
          border: none;
          border-top: 1px solid rgba(255,255,255,0.08);
          margin-bottom: var(--space-8);
        }

        .footer__bottom {
          display: flex;
          align-items: center;
          justify-content: space-between;
          flex-wrap: wrap;
          gap: var(--space-4);
        }
        .footer__copy {
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.35);
        }
        .footer__bottom-links {
          display: flex;
          gap: var(--space-6);
        }
        .footer__bottom-links a {
          font-size: var(--text-xs);
          color: rgba(255,255,255,0.35);
          text-decoration: none;
          transition: color var(--transition-fast);
        }
        .footer__bottom-links a:hover { color: rgba(255,255,255,0.7); }

        @media (max-width: 900px) {
          .footer__grid {
            grid-template-columns: 1fr 1fr;
            gap: var(--space-8);
          }
          .footer__brand { grid-column: 1 / -1; }
        }
        @media (max-width: 600px) {
          .footer__grid { grid-template-columns: 1fr; }
          .footer__bottom { flex-direction: column; align-items: flex-start; }
        }
      `}</style>
    </footer>
  );
}
