// src/pages/public/ProductsPage.jsx
// Product listing page with filters, search, and sorting

import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import ProductCard from '../../components/common/ProductCard';
import { ProductGridSkeleton } from '../../components/common/LoadingSpinner';
import { SORT_OPTIONS } from '../../constants';
import { debounce } from '../../utils';

export default function ProductsPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [products, setProducts] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [districts, setDistricts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  // Filter states from URL
  const search     = searchParams.get('search') || '';
  const district   = searchParams.get('district') || '';
  const category   = searchParams.get('category') || '';
  const sort       = searchParams.get('sort') || 'created_at:desc';
  const minPrice   = searchParams.get('minPrice') || '';
  const maxPrice   = searchParams.get('maxPrice') || '';
  const page       = parseInt(searchParams.get('page') || '1');

  const updateFilter = (key, value) => {
    const newParams = new URLSearchParams(searchParams);
    if (value) newParams.set(key, value);
    else newParams.delete(key);
    if (key !== 'page') {
      newParams.set('page', '1');
    }
    setSearchParams(newParams);
    if (key === 'page') {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  };

  // Load districts and categories once
  useEffect(() => {
    Promise.all([
      productService.getDistricts().catch(() => ({ data: [] })),
      productService.getCategories().catch(() => ({ data: [] })),
    ]).then(([d, c]) => {
      setDistricts(d?.data || []);
      setCategories(c?.data || []);
    });
  }, []);

  // Load products when filters change
  useEffect(() => {
    setLoading(true);
    const params = { limit: 12, page };
    if (search)   params.search   = search;
    if (district) params.district = district;
    if (category) params.category = category;
    if (sort)     params.sort     = sort;
    if (minPrice) params.minPrice = minPrice;
    if (maxPrice) params.maxPrice = maxPrice;

    productService.getProducts(params)
      .then(res => {
        setProducts(res?.data?.products || res?.data || []);
        setTotal(res?.data?.total || 0);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [search, district, category, sort, minPrice, maxPrice, page]);

  const totalPages = Math.ceil(total / 12);
  const hasActiveFilters = district || category || minPrice || maxPrice;

  return (
    <div className="products-page">
      {/* Page Header / Hero Showcase */}
      <section className="products-hero-banner" aria-label="Craft Collection Header">
        <div className="container">
          <div className="products-hero-banner__inner">
            {/* Left Column: Breadcrumb & Editorial Story */}
            <div className="products-hero-banner__content">
              <nav className="breadcrumb" aria-label="Breadcrumb" style={{ marginBottom: '0.75rem' }}>
                <Link to="/">Home</Link>
                <span className="breadcrumb__sep">/</span>
                <span className="breadcrumb__current">Products</span>
              </nav>

              <div className="products-hero-banner__tag">
                <span>✦</span>
                <span>Verified District Heritage</span>
              </div>

              <h1 className="products-hero-banner__title">
                {search ? `Results for "${search}"` : 'Artisan Heritage Collection'}
              </h1>

              <p className="products-hero-banner__desc">
                Discover authentic One District One Product creations—handloom weaves, royal ceramics, glass artistry, and native delicacies sourced directly from master Indian artisans.
              </p>

              <div className="products-hero-banner__highlights">
                <div className="products-hero-banner__highlight-chip">
                  <span className="dot" />
                  <span>100% GI Authenticated</span>
                </div>
                <div className="products-hero-banner__highlight-chip">
                  <span className="dot" />
                  <span>Direct Artisan Fair Trade</span>
                </div>
                <div className="products-hero-banner__highlight-chip">
                  <span className="dot" />
                  <span>Free Delivery above ₹499</span>
                </div>
              </div>
            </div>

            {/* Right Column: Visual Curated Craft Showcase */}
            <div className="products-hero-banner__gallery" aria-label="Featured Craft Showcase">
              {/* Card 1: Jaipur Blue Pottery */}
              <div 
                className="craft-vignette craft-vignette--left" 
                title="Explore Jaipur Blue Pottery"
                onClick={() => {
                  const d = districts.find(x => x.name.toLowerCase().includes('jaipur'));
                  if (d) updateFilter('district', d.id);
                }}
              >
                <img 
                  src="/images/products/jaipur-blue-pottery-vase.jpg" 
                  alt="Jaipur Blue Pottery Heritage" 
                  loading="lazy" 
                />
                <div className="craft-vignette__overlay">
                  <span className="craft-vignette__district">Jaipur</span>
                  <span className="craft-vignette__name">Blue Pottery</span>
                </div>
              </div>

              {/* Card 2: Aurangabad Paithani Silk */}
              <div 
                className="craft-vignette craft-vignette--center" 
                title="Explore Aurangabad Paithani Weaves"
                onClick={() => {
                  const d = districts.find(x => x.name.toLowerCase().includes('aurangabad') || x.name.toLowerCase().includes('chhatrapati'));
                  if (d) updateFilter('district', d.id);
                }}
              >
                <span className="craft-vignette__badge">✦ GI Certified</span>
                <img 
                  src="/images/products/paithani-silk-saree-authentic.jpg" 
                  alt="Aurangabad Royal Paithani Weave" 
                  loading="lazy" 
                />
                <div className="craft-vignette__overlay">
                  <span className="craft-vignette__district">Aurangabad</span>
                  <span className="craft-vignette__name">Paithani Silk</span>
                </div>
              </div>

              {/* Card 3: Firozabad Blown Glass */}
              <div 
                className="craft-vignette craft-vignette--right" 
                title="Explore Firozabad Glass Craft"
                onClick={() => {
                  const d = districts.find(x => x.name.toLowerCase().includes('firozabad'));
                  if (d) updateFilter('district', d.id);
                }}
              >
                <img 
                  src="/images/products/firozabad-glass-vase.jpg" 
                  alt="Firozabad Artisan Blown Glass" 
                  loading="lazy" 
                />
                <div className="craft-vignette__overlay">
                  <span className="craft-vignette__district">Firozabad</span>
                  <span className="craft-vignette__name">Blown Glass</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <div className="container">
        <div className="products-page__layout">
          {/* ── Sidebar Filter ── */}
          <aside className={`filter-sidebar${sidebarOpen ? ' filter-sidebar--open' : ''}`} id="filter-sidebar">
            <div className="products-page__filter-header">
              <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                Filters
              </span>
              {hasActiveFilters && (
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setSearchParams(new URLSearchParams())}
                  id="clear-filters-btn"
                >
                  Clear all
                </button>
              )}
            </div>

            {/* Sort */}
            <div className="filter-group">
              <p className="filter-group__title">Sort by</p>
              <select
                className="input input-square"
                id="sort-select"
                value={sort}
                onChange={e => updateFilter('sort', e.target.value)}
                style={{ fontSize: 'var(--text-sm)' }}
              >
                {SORT_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            {categories.length > 0 && (
              <div className="filter-group">
                <p className="filter-group__title">Category</p>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="category"
                    value=""
                    checked={!category}
                    onChange={() => updateFilter('category', '')}
                  />
                  All Categories
                </label>
                {categories.map(cat => (
                  <label key={cat.id} className="filter-option">
                    <input
                      type="radio"
                      name="category"
                      value={cat.id}
                      checked={category === cat.id}
                      onChange={() => updateFilter('category', cat.id)}
                    />
                    {cat.name}
                  </label>
                ))}
              </div>
            )}

            {/* District Filter */}
            {districts.length > 0 && (
              <div className="filter-group">
                <p className="filter-group__title">District</p>
                <label className="filter-option">
                  <input
                    type="radio"
                    name="district"
                    value=""
                    checked={!district}
                    onChange={() => updateFilter('district', '')}
                  />
                  All Districts
                </label>
                <div style={{ maxHeight: 240, overflowY: 'auto', paddingRight: '4px' }}>
                  {districts.map(d => (
                    <label key={d.id} className="filter-option">
                      <input
                        type="radio"
                        name="district"
                        value={d.id}
                        checked={district === d.id}
                        onChange={() => updateFilter('district', d.id)}
                      />
                      {d.name}
                    </label>
                  ))}
                </div>
              </div>
            )}

            {/* Price Range */}
            <div className="filter-group">
              <p className="filter-group__title">Price Range</p>
              <div style={{ display: 'flex', gap: 'var(--space-3)' }}>
                <input
                  type="number"
                  className="input input-square"
                  id="min-price"
                  placeholder="Min ₹"
                  value={minPrice}
                  onChange={e => updateFilter('minPrice', e.target.value)}
                  style={{ fontSize: 'var(--text-sm)' }}
                />
                <input
                  type="number"
                  className="input input-square"
                  id="max-price"
                  placeholder="Max ₹"
                  value={maxPrice}
                  onChange={e => updateFilter('maxPrice', e.target.value)}
                  style={{ fontSize: 'var(--text-sm)' }}
                />
              </div>
            </div>
          </aside>

          {/* ── Product Grid ── */}
          <div className="products-page__main">
            {/* Toolbar */}
            <div className="products-page__toolbar">
              <button
                className="btn btn-outline btn-sm products-page__filter-toggle"
                onClick={() => setSidebarOpen(v => !v)}
                id="filter-toggle-btn"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="21" y1="4" x2="14" y2="4"/><line x1="10" y1="4" x2="3" y2="4"/>
                  <line x1="21" y1="12" x2="12" y2="12"/><line x1="8" y1="12" x2="3" y2="12"/>
                  <line x1="21" y1="20" x2="16" y2="20"/><line x1="12" y1="20" x2="3" y2="20"/>
                  <line x1="14" y1="2" x2="14" y2="6"/><line x1="8" y1="10" x2="8" y2="14"/>
                  <line x1="16" y1="18" x2="16" y2="22"/>
                </svg>
                Filters
              </button>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                {loading ? 'Loading…' : `${total} product${total !== 1 ? 's' : ''} found`}
              </p>
            </div>

            {/* Active filter tags */}
            {hasActiveFilters && (
              <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap', marginBottom: 'var(--space-5)' }}>
                {district && (
                  <span className="badge badge-accent">
                    District: {districts.find(d => d.id === district || d.slug === district)?.name || district}
                    <button onClick={() => updateFilter('district', '')} style={{ marginLeft: 4, cursor: 'pointer' }}>✕</button>
                  </span>
                )}
                {category && categories.find(c => c.id === category) && (
                  <span className="badge badge-accent">
                    {categories.find(c => c.id === category)?.name}
                    <button onClick={() => updateFilter('category', '')} style={{ marginLeft: 4, cursor: 'pointer' }}>✕</button>
                  </span>
                )}
                {(minPrice || maxPrice) && (
                  <span className="badge badge-accent">
                    ₹{minPrice || '0'} – ₹{maxPrice || '∞'}
                    <button onClick={() => { updateFilter('minPrice', ''); updateFilter('maxPrice', ''); }} style={{ marginLeft: 4, cursor: 'pointer' }}>✕</button>
                  </span>
                )}
              </div>
            )}

            {loading ? (
              <ProductGridSkeleton count={12} />
            ) : products.length > 0 ? (
              <>
                <div className="product-grid">
                  {products.map(product => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>

                {/* Pagination */}
                {totalPages > 1 && (
                  <div className="pagination">
                    <button
                      className="btn btn-outline btn-sm"
                      id="prev-page-btn"
                      disabled={page <= 1}
                      onClick={() => updateFilter('page', page - 1)}
                    >← Previous</button>
                    <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                      Page {page} of {totalPages}
                    </span>
                    <button
                      className="btn btn-outline btn-sm"
                      id="next-page-btn"
                      disabled={page >= totalPages}
                      onClick={() => updateFilter('page', page + 1)}
                    >Next →</button>
                  </div>
                )}
              </>
            ) : (
              <div className="empty-state">
                <div className="empty-state__icon">🔍</div>
                <h2 className="empty-state__title">No products found</h2>
                <p className="empty-state__desc">
                  Try adjusting your filters or search for something else.
                </p>
                <button
                  className="btn btn-outline"
                  onClick={() => setSearchParams(new URLSearchParams())}
                >
                  Clear all filters
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      <style>{`
        .products-page {
          min-height: 100vh;
          padding-bottom: var(--space-20);
        }

        .products-page__layout {
          display: flex;
          gap: var(--space-10);
          padding-top: var(--space-10);
          align-items: flex-start;
        }

        .products-page__filter-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: var(--space-8);
        }

        .products-page__main {
          flex: 1;
          min-width: 0;
        }

        .products-page__toolbar {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          margin-bottom: var(--space-6);
        }

        .products-page__filter-toggle {
          display: none;
        }

        .pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-6);
          margin-top: var(--space-12);
        }

        @media (max-width: 900px) {
          .filter-sidebar {
            display: none;
            position: fixed;
            inset: 0;
            background: var(--color-surface);
            z-index: var(--z-modal);
            padding: var(--space-8);
            overflow-y: auto;
            width: 300px;
            animation: slideIn 0.25s ease;
          }
          .filter-sidebar--open { display: block; }
          .products-page__filter-toggle { display: flex; }
          .products-page__layout { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
