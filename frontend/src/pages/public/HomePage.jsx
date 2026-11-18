// src/pages/public/HomePage.jsx
// Skanvi-inspired hero + product showcase homepage

import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/common/ProductCard';
import { ProductGridSkeleton } from '../../components/common/LoadingSpinner';

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState([]);
  const [newArrivals, setNewArrivals] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    Promise.all([
      productService.getProducts({ limit: 8, sort: 'created_at:desc' }),
      productService.getProducts({ limit: 8, sort: 'created_at:asc' }),
      productService.getDistricts().catch(() => ({ data: [] })),
      productService.getCategories().catch(() => ({ data: [] })),
    ]).then(([featured, newArr, dist, cats]) => {
      setFeaturedProducts(featured?.data?.products || featured?.data || []);
      setNewArrivals(newArr?.data?.products || newArr?.data || []);
      setDistricts((dist?.data || []).slice(0, 8));
      setCategories((cats?.data || []).slice(0, 6));
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <div className="home">
      {/* ── Hero Section ── */}
      <section className="hero">
        <div className="hero__bg">
          {/* Gradient overlay instead of image for now */}
          <div className="hero__gradient" />
        </div>
        <div className="container hero__content">
          <div className="hero__text">
            <p className="hero__eyebrow">ODOP NEXUS</p>
            <h1 className="hero__title">
              Crafts that tell<br />India's story.
            </h1>
            <p className="hero__subtitle">
              Discover authentic One District One Product items — unique handcrafted
              goods from artisans across India, delivered to your door.
            </p>

            {/* Hero search */}
            <form className="hero__search" onSubmit={handleSearch} role="search">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
              <input
                id="hero-search"
                type="search"
                placeholder="Search products, districts, artisans…"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <button type="submit" className="hero__search-btn">Search</button>
            </form>

            {/* CTA buttons */}
            <div className="hero__ctas">
              <Link to="/products" className="btn btn-primary btn-lg">
                Explore Products
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link to="/products?type=districts" className="btn btn-outline btn-lg">
                Browse Districts
              </Link>
            </div>
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="hero__scroll">
          <div className="hero__scroll-dot" />
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="stats-bar">
        <div className="container">
          <div className="stats-bar__grid">
            {[
              { label: 'Districts', value: '300+' },
              { label: 'Products', value: '5,000+' },
              { label: 'Artisans', value: '2,000+' },
              { label: 'Orders Delivered', value: '50,000+' },
            ].map(stat => (
              <div key={stat.label} className="stats-bar__item">
                <p className="stats-bar__value">{stat.value}</p>
                <p className="stats-bar__label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Featured Products ── */}
      <section className="section">
        <div className="container">
          <div className="section-header">
            <div className="section-header__left">
              <p className="section-header__eyebrow">Handpicked</p>
              <h2 className="section-header__title">Our Favourites</h2>
              <p className="section-header__desc">Curated products from India's finest artisans</p>
            </div>
            <Link to="/products" className="section-header__action">View all →</Link>
          </div>

          {loading ? (
            <ProductGridSkeleton count={8} />
          ) : featuredProducts.length > 0 ? (
            <div className="product-grid">
              {featuredProducts.map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <div className="empty-state__icon">🏺</div>
              <p className="empty-state__title">No products yet</p>
              <p className="empty-state__desc">Products from artisans across India will appear here.</p>
            </div>
          )}
        </div>
      </section>

      {/* ── Category Tiles ── */}
      {categories.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-alt)', paddingBlock: 'var(--space-16)' }}>
          <div className="container">
            <div className="section-header">
              <div className="section-header__left">
                <p className="section-header__eyebrow">Browse By</p>
                <h2 className="section-header__title">Categories</h2>
              </div>
            </div>
            <div className="category-grid">
              {categories.map(cat => (
                <Link
                  key={cat.id}
                  to={`/products?category=${cat.id}`}
                  className="category-tile"
                  id={`category-${cat.id}`}
                >
                  <div className="category-tile__icon">
                    {getCategoryIcon(cat.name)}
                  </div>
                  <p className="category-tile__name">{cat.name}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── District Showcase ── */}
      {districts.length > 0 && (
        <section className="section">
          <div className="container">
            <div className="section-header">
              <div className="section-header__left">
                <p className="section-header__eyebrow">By Region</p>
                <h2 className="section-header__title">Explore Districts</h2>
                <p className="section-header__desc">Every district has its signature craft</p>
              </div>
              <Link to="/products?type=districts" className="section-header__action">All districts →</Link>
            </div>
            <div className="district-grid">
              {districts.map(district => (
                <Link
                  key={district.id}
                  to={`/products?district=${district.id}`}
                  className="district-card"
                  id={`district-${district.id}`}
                >
                  <div className="district-card__map">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                  </div>
                  <div>
                    <p className="district-card__name">{district.name}</p>
                    <p className="district-card__state">{district.state}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── New Arrivals ── */}
      {newArrivals.length > 0 && (
        <section className="section" style={{ background: 'var(--color-bg-sage)', paddingBlock: 'var(--space-16)' }}>
          <div className="container">
            <div className="section-header" style={{ '--section-title-color': 'white' }}>
              <div className="section-header__left">
                <p className="section-header__eyebrow" style={{ color: 'rgba(255,255,255,0.6)' }}>Just Added</p>
                <h2 className="section-header__title" style={{ color: 'white' }}>New Arrivals</h2>
              </div>
              <Link to="/products?sort=created_at:desc" className="section-header__action" style={{ color: 'rgba(255,255,255,0.7)' }}>
                See all new →
              </Link>
            </div>
            <div className="product-grid">
              {newArrivals.slice(0, 4).map(product => (
                <ProductCard key={product.id} product={product} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── Seller CTA Banner ── */}
      <section className="seller-banner">
        <div className="container">
          <div className="seller-banner__content">
            <div>
              <p className="label">For Artisans & Sellers</p>
              <h2 className="seller-banner__title">Share your craft<br />with the world</h2>
              <p className="seller-banner__desc">
                Join thousands of artisans selling their authentic ODOP products on our platform.
                Zero listing fee. Simple setup.
              </p>
            </div>
            <div className="seller-banner__actions">
              <Link to="/register?role=seller" className="btn btn-primary btn-lg">
                Start Selling
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
              <Link to="/login" className="btn btn-outline btn-lg">Sign in</Link>
            </div>
          </div>
        </div>
      </section>

      <style>{`
        /* ── Navbar height offset ── */
        .home { overflow-x: hidden; }

        /* ── Hero ── */
        .hero {
          position: relative;
          min-height: calc(100vh - var(--navbar-height));
          display: flex;
          align-items: center;
          overflow: hidden;
          background-color: var(--color-bg-dark);
        }
        .hero__bg {
          position: absolute;
          inset: 0;
        }
        .hero__gradient {
          position: absolute;
          inset: 0;
          background: 
            radial-gradient(ellipse at 70% 50%, rgba(61, 90, 78, 0.4) 0%, transparent 60%),
            radial-gradient(ellipse at 20% 80%, rgba(139, 108, 82, 0.3) 0%, transparent 50%),
            linear-gradient(135deg, #1c1c1a 0%, #2a2a26 50%, #1c1c1a 100%);
        }

        .hero__content {
          position: relative;
          z-index: 1;
          padding-top: var(--space-20);
          padding-bottom: var(--space-20);
        }
        .hero__text { max-width: 680px; }

        .hero__eyebrow {
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          letter-spacing: 0.2em;
          text-transform: uppercase;
          color: var(--color-accent-light);
          margin-bottom: var(--space-5);
        }

        .hero__title {
          font-family: var(--font-display);
          font-size: clamp(3rem, 6vw, 5.5rem);
          font-weight: var(--weight-light);
          line-height: 1.08;
          letter-spacing: -0.03em;
          color: white;
          margin-bottom: var(--space-6);
        }

        .hero__subtitle {
          font-size: var(--text-lg);
          color: rgba(255,255,255,0.65);
          line-height: 1.6;
          margin-bottom: var(--space-8);
          max-width: 520px;
        }

        .hero__search {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          background: rgba(255,255,255,0.1);
          border: 1.5px solid rgba(255,255,255,0.2);
          border-radius: var(--radius-full);
          padding: var(--space-3) var(--space-5);
          max-width: 540px;
          margin-bottom: var(--space-8);
          backdrop-filter: blur(8px);
          transition: border-color var(--transition-base), background var(--transition-base);
        }
        .hero__search:focus-within {
          border-color: rgba(255,255,255,0.5);
          background: rgba(255,255,255,0.15);
        }
        .hero__search svg { color: rgba(255,255,255,0.5); flex-shrink: 0; }
        .hero__search input {
          flex: 1;
          background: none;
          border: none;
          outline: none;
          color: white;
          font-size: var(--text-base);
        }
        .hero__search input::placeholder { color: rgba(255,255,255,0.4); }
        .hero__search-btn {
          padding: var(--space-2) var(--space-5);
          background: var(--color-accent);
          color: white;
          border-radius: var(--radius-full);
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          cursor: pointer;
          border: none;
          font-family: inherit;
          transition: background var(--transition-fast);
          white-space: nowrap;
        }
        .hero__search-btn:hover { background: var(--color-accent-light); }

        .hero__ctas {
          display: flex;
          gap: var(--space-4);
          flex-wrap: wrap;
        }
        .hero__ctas .btn-outline {
          border-color: rgba(255,255,255,0.3);
          color: white;
        }
        .hero__ctas .btn-outline:hover {
          border-color: rgba(255,255,255,0.7);
          background: rgba(255,255,255,0.1);
          color: white;
        }

        .hero__scroll {
          position: absolute;
          bottom: var(--space-8);
          left: 50%;
          transform: translateX(-50%);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-2);
        }
        .hero__scroll-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: rgba(255,255,255,0.4);
          animation: bounce 2s infinite;
        }
        @keyframes bounce {
          0%, 100% { transform: translateY(0); opacity: 0.4; }
          50% { transform: translateY(8px); opacity: 0.8; }
        }

        /* ── Stats Bar ── */
        .stats-bar {
          background: var(--color-text-primary);
          padding-block: var(--space-10);
        }
        .stats-bar__grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          text-align: center;
          gap: var(--space-8);
        }
        .stats-bar__value {
          font-family: var(--font-display);
          font-size: var(--text-3xl);
          font-weight: var(--weight-light);
          color: white;
          line-height: 1;
          margin-bottom: var(--space-2);
        }
        .stats-bar__label {
          font-size: var(--text-xs);
          text-transform: uppercase;
          letter-spacing: 0.1em;
          color: rgba(255,255,255,0.45);
          font-weight: var(--weight-medium);
        }

        /* ── Categories ── */
        .category-grid {
          display: grid;
          grid-template-columns: repeat(6, 1fr);
          gap: var(--space-4);
        }
        .category-tile {
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          padding: var(--space-6) var(--space-4);
          text-align: center;
          text-decoration: none;
          transition: all var(--transition-base);
          border: 1.5px solid var(--color-border);
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
        }
        .category-tile:hover {
          transform: translateY(-4px);
          box-shadow: var(--shadow-md);
          border-color: var(--color-accent);
        }
        .category-tile__icon {
          width: 52px;
          height: 52px;
          border-radius: 50%;
          background: var(--color-accent-pale);
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.5rem;
        }
        .category-tile__name {
          font-size: var(--text-sm);
          font-weight: var(--weight-medium);
          color: var(--color-text-primary);
        }

        /* ── District Grid ── */
        .district-grid {
          display: grid;
          grid-template-columns: repeat(4, 1fr);
          gap: var(--space-4);
        }
        .district-card {
          display: flex;
          align-items: center;
          gap: var(--space-4);
          padding: var(--space-5);
          background: var(--color-surface);
          border-radius: var(--radius-xl);
          border: 1.5px solid var(--color-border);
          text-decoration: none;
          transition: all var(--transition-base);
        }
        .district-card:hover {
          border-color: var(--color-accent);
          transform: translateY(-2px);
          box-shadow: var(--shadow-md);
        }
        .district-card__map {
          width: 44px;
          height: 44px;
          border-radius: 50%;
          background: var(--color-accent-pale);
          display: flex;
          align-items: center;
          justify-content: center;
          color: var(--color-accent);
          flex-shrink: 0;
        }
        .district-card__name {
          font-weight: var(--weight-semibold);
          font-size: var(--text-sm);
          color: var(--color-text-primary);
        }
        .district-card__state {
          font-size: var(--text-xs);
          color: var(--color-text-muted);
        }

        /* ── Seller Banner ── */
        .seller-banner {
          padding-block: var(--space-24);
          background: var(--color-bg-alt);
        }
        .seller-banner__content {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: var(--space-12);
          flex-wrap: wrap;
        }
        .seller-banner__title {
          font-family: var(--font-display);
          font-size: var(--text-5xl);
          font-weight: var(--weight-light);
          letter-spacing: -0.03em;
          color: var(--color-text-primary);
          margin-block: var(--space-4);
        }
        .seller-banner__desc {
          font-size: var(--text-lg);
          color: var(--color-text-muted);
          max-width: 500px;
        }
        .seller-banner__actions {
          display: flex;
          flex-direction: column;
          gap: var(--space-4);
          flex-shrink: 0;
        }

        @media (max-width: 1100px) {
          .category-grid { grid-template-columns: repeat(3, 1fr); }
          .district-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-bar__grid { grid-template-columns: repeat(2, 1fr); }
        }
        @media (max-width: 768px) {
          .hero__title { font-size: 2.8rem; }
          .category-grid { grid-template-columns: repeat(3, 1fr); }
          .district-grid { grid-template-columns: 1fr; }
          .seller-banner__title { font-size: var(--text-4xl); }
          .seller-banner__content { flex-direction: column; }
        }
        @media (max-width: 480px) {
          .category-grid { grid-template-columns: repeat(2, 1fr); }
          .stats-bar__grid { grid-template-columns: repeat(2, 1fr); }
        }
      `}</style>
    </div>
  );
}

function getCategoryIcon(name) {
  const icons = {
    'Handicrafts': '🏺',
    'Textiles': '🧵',
    'Food': '🍯',
    'Jewelry': '💎',
    'Pottery': '🏺',
    'Woodwork': '🪵',
    'Paintings': '🎨',
    'Leather': '👜',
    'Spices': '🌶️',
    'Beverages': '☕',
  };
  return icons[name] || '✦';
}
