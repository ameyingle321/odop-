// src/components/common/ProductCard.jsx
// Skanvi-style product card with image, district, name, price

import { Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import { useState } from 'react';

export default function ProductCard({ product }) {
  const { isAuthenticated, isBuyer } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();
  const [adding, setAdding] = useState(false);
  const [wishlisted, setWishlisted] = useState(false);

  const mainImage = getProductImageUrl(product);
  const price = product.price;
  const districtName = product.districts?.name || product.district_name || product.district;

  const handleAddToCart = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isAuthenticated) {
      toast.info('Please login to add items to cart');
      return;
    }
    if (!isBuyer) {
      toast.info('Only buyers can add to cart');
      return;
    }
    try {
      setAdding(true);
      await addToCart(product.id, 1);
      toast.success(`${product.name} added to cart`);
    } catch (err) {
      toast.error(err?.response?.data?.message || 'Failed to add to cart');
    } finally {
      setAdding(false);
    }
  };

  const handleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setWishlisted(v => !v);
    toast.success(wishlisted ? 'Removed from wishlist' : 'Added to wishlist');
  };

  return (
    <Link to={`/products/${product.id}`} className="product-card" id={`product-card-${product.id}`}>
      <div className="product-card__image-wrap">
        <img
          src={mainImage}
          alt={product.name}
          loading="lazy"
          onError={(e) => {
            e.target.onerror = null;
            e.target.src = DEFAULT_PRODUCT_IMAGE;
          }}
        />

        {/* District badge */}
        {districtName && (
          <div className="product-card__badge">{districtName}</div>
        )}

        {/* Wishlist button */}
        <button
          className="product-card__wishlist"
          onClick={handleWishlist}
          aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        >
          <svg
            width="16" height="16" viewBox="0 0 24 24"
            fill={wishlisted ? 'currentColor' : 'none'}
            stroke="currentColor" strokeWidth="2"
            style={{ color: wishlisted ? '#e05050' : 'currentColor' }}
          >
            <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>
          </svg>
        </button>

        {/* Quick add to cart */}
        <button
          className="product-card__add-btn"
          onClick={handleAddToCart}
          disabled={adding}
          aria-label="Add to cart"
        >
          {adding ? (
            <span className="spinner" style={{ width: 16, height: 16, borderWidth: 2 }} />
          ) : (
            <>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                <line x1="3" y1="6" x2="21" y2="6"/>
                <path d="M16 10a4 4 0 0 1-8 0"/>
              </svg>
              Add to cart
            </>
          )}
        </button>
      </div>

      <div className="product-card__info">
        {product.category_name && (
          <p className="product-card__district">{product.category_name}</p>
        )}
        <h3 className="product-card__name">{product.name}</h3>
        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-2)' }}>
          <span className="product-card__price">{formatCurrency(price)}</span>
          {product.stock_quantity === 0 && (
            <span className="badge badge-error" style={{ fontSize: '0.7rem' }}>Out of stock</span>
          )}
        </div>
      </div>

      <style>{`
        .product-card__no-image {
          width: 100%;
          height: 100%;
          display: flex;
          align-items: center;
          justify-content: center;
          background: var(--color-bg-alt);
          color: var(--color-text-muted);
        }

        .product-card__add-btn {
          position: absolute;
          bottom: var(--space-3);
          left: var(--space-3);
          right: var(--space-3);
          display: flex;
          align-items: center;
          justify-content: center;
          gap: var(--space-2);
          padding: var(--space-2) var(--space-4);
          background: white;
          color: var(--color-text-primary);
          border: none;
          border-radius: var(--radius-full);
          font-size: var(--text-xs);
          font-weight: var(--weight-semibold);
          cursor: pointer;
          font-family: var(--font-body);
          letter-spacing: 0.04em;
          opacity: 0;
          transform: translateY(6px);
          transition: all var(--transition-base);
          backdrop-filter: blur(4px);
        }
        .product-card:hover .product-card__add-btn {
          opacity: 1;
          transform: translateY(0);
        }
        .product-card__add-btn:hover {
          background: var(--color-accent);
          color: white;
        }
        .product-card__add-btn:disabled {
          opacity: 0.7;
          cursor: not-allowed;
        }
      `}</style>
    </Link>
  );
}
