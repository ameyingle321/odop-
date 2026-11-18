// src/pages/buyer/CartPage.jsx
// Shopping cart page

import { Link, useNavigate } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, getErrorMessage, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function CartPage() {
  const { items, loading, cartTotal, cartCount, updateItem, removeItem, clearCart } = useCart();
  const toast = useToast();
  const navigate = useNavigate();

  const handleUpdate = async (itemId, qty) => {
    if (qty < 1) return;
    try {
      await updateItem(itemId, qty);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const handleRemove = async (itemId, name) => {
    try {
      await removeItem(itemId);
      toast.success(`${name} removed from cart`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  };

  const deliveryFee = cartTotal >= 499 ? 0 : 50;
  const orderTotal = cartTotal + deliveryFee;

  if (loading) return <div style={{ paddingTop: 'var(--navbar-height)' }}><LoadingSpinner fullPage /></div>;

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      <div className="page-header" style={{ background: 'var(--color-surface)', paddingTop: 'calc(var(--navbar-height) + var(--space-10))', paddingBottom: 'var(--space-8)', marginTop: 0 }}>
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb__sep">/</span>
            <span className="breadcrumb__current">Cart</span>
          </nav>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)' }}>
            Shopping Cart
            {cartCount > 0 && (
              <span style={{ fontSize: 'var(--text-xl)', color: 'var(--color-text-muted)', marginLeft: 'var(--space-3)' }}>
                ({cartCount} item{cartCount !== 1 ? 's' : ''})
              </span>
            )}
          </h1>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        {items.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', paddingBlock: 'var(--space-24)' }}>
            <div className="empty-state__icon">🛒</div>
            <h2 className="empty-state__title">Your cart is empty</h2>
            <p className="empty-state__desc">Discover amazing products from artisans across India</p>
            <Link to="/products" className="btn btn-primary btn-lg">Explore Products</Link>
          </div>
        ) : (
          <div className="cart-layout">
            {/* Cart Items */}
            <div>
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-2xl)',
                overflow: 'hidden',
                marginBottom: 'var(--space-5)',
              }}>
                {items.map((item, idx) => (
                  <div key={item.id} className="cart-item" style={{
                    borderBottom: idx < items.length - 1 ? '1px solid var(--color-border)' : 'none',
                  }}>
                    {/* Product image */}
                    <Link to={`/products/${item.product?.id}`} className="cart-item__img">
                      <img
                        src={getProductImageUrl(item.product)}
                        alt={item.product?.name || 'Product'}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                    </Link>

                    {/* Info */}
                    <div className="cart-item__info">
                      {item.product?.district_name && (
                        <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
                          {item.product.district_name}
                        </p>
                      )}
                      <Link to={`/products/${item.product?.id}`} style={{ textDecoration: 'none' }}>
                        <h3 style={{ fontSize: 'var(--text-base)', fontWeight: 500, color: 'var(--color-text-primary)', marginBottom: 'var(--space-2)' }}>
                          {item.product?.name}
                        </h3>
                      </Link>
                      <p style={{ fontSize: 'var(--text-lg)', fontWeight: 600, color: 'var(--color-text-primary)' }}>
                        {formatCurrency(item.product?.price || 0)}
                      </p>
                    </div>

                    {/* Quantity */}
                    <div className="cart-item__qty">
                      <div className="qty-control">
                        <button
                          onClick={() => item.quantity > 1 ? handleUpdate(item.id, item.quantity - 1) : handleRemove(item.id, item.product?.name)}
                          aria-label="Decrease"
                        >−</button>
                        <input
                          type="number"
                          value={item.quantity}
                          min={1}
                          onChange={e => handleUpdate(item.id, parseInt(e.target.value) || 1)}
                        />
                        <button
                          onClick={() => handleUpdate(item.id, item.quantity + 1)}
                          disabled={item.quantity >= (item.product?.stock_quantity || 99)}
                          aria-label="Increase"
                        >+</button>
                      </div>
                    </div>

                    {/* Subtotal + remove */}
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <p style={{ fontWeight: 600, fontSize: 'var(--text-lg)', marginBottom: 'var(--space-3)' }}>
                        {formatCurrency((item.product?.price || 0) * item.quantity)}
                      </p>
                      <button
                        id={`remove-${item.id}`}
                        onClick={() => handleRemove(item.id, item.product?.name)}
                        style={{ background: 'none', border: 'none', color: 'var(--color-error)', cursor: 'pointer', fontSize: 'var(--text-xs)', fontFamily: 'inherit' }}
                      >
                        Remove
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <button
                id="clear-cart-btn"
                className="btn btn-ghost btn-sm"
                onClick={() => clearCart()}
                style={{ color: 'var(--color-error)' }}
              >
                Clear entire cart
              </button>
            </div>

            {/* Order Summary */}
            <div className="cart-summary">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
                Order Summary
              </h2>

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>Subtotal ({cartCount} items)</span>
                  <span>{formatCurrency(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>Delivery</span>
                  <span style={{ color: deliveryFee === 0 ? 'var(--color-success)' : 'inherit' }}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                {deliveryFee > 0 && (
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', background: 'var(--color-bg-alt)', padding: 'var(--space-3)', borderRadius: 'var(--radius-md)' }}>
                    Add {formatCurrency(499 - cartTotal)} more for free delivery!
                  </p>
                )}
                <hr className="divider" style={{ marginBlock: 'var(--space-2)' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 600, fontSize: 'var(--text-lg)' }}>
                  <span>Total</span>
                  <span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              <button
                id="checkout-btn"
                className="btn btn-primary btn-lg"
                style={{ width: '100%', justifyContent: 'center' }}
                onClick={() => navigate('/checkout')}
              >
                Proceed to Checkout
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="5" y1="12" x2="19" y2="12"/>
                  <polyline points="12 5 19 12 12 19"/>
                </svg>
              </button>

              <Link
                to="/products"
                className="btn btn-ghost"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'var(--space-3)' }}
              >
                ← Continue Shopping
              </Link>

              <div style={{ marginTop: 'var(--space-6)', padding: 'var(--space-4)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)' }}>
                <div style={{ display: 'flex', gap: 'var(--space-3)', alignItems: 'center', marginBottom: 'var(--space-3)' }}>
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--color-success)" strokeWidth="2">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
                    Secure checkout powered by Razorpay
                  </span>
                </div>
                <div style={{ display: 'flex', gap: 'var(--space-2)', flexWrap: 'wrap' }}>
                  {['UPI', 'Cards', 'NetBanking', 'Wallets'].map(m => (
                    <span key={m} className="badge badge-neutral" style={{ fontSize: '0.65rem' }}>{m}</span>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>{`
        .cart-layout {
          display: grid;
          grid-template-columns: 1fr 380px;
          gap: var(--space-8);
          align-items: flex-start;
        }

        .cart-item {
          display: flex;
          align-items: center;
          gap: var(--space-5);
          padding: var(--space-6);
        }

        .cart-item__img {
          width: 90px;
          height: 90px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          flex-shrink: 0;
          background: var(--color-bg-alt);
          display: flex;
          align-items: center;
          justify-content: center;
        }
        .cart-item__img img { width: 100%; height: 100%; object-fit: cover; }
        .cart-item__no-img { width: 100%; height: 100%; display: flex; align-items: center; justify-content: center; }

        .cart-item__info { flex: 1; min-width: 0; }

        .cart-item__qty { flex-shrink: 0; }

        .cart-summary {
          background: var(--color-surface);
          border-radius: var(--radius-2xl);
          padding: var(--space-8);
          position: sticky;
          top: calc(var(--navbar-height) + var(--space-6));
        }

        .qty-control {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .qty-control button {
          width: 34px;
          height: 34px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.1rem;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
        }
        .qty-control button:disabled { opacity: 0.3; cursor: not-allowed; }
        .qty-control input {
          width: 44px;
          text-align: center;
          border: none;
          outline: none;
          font-size: var(--text-sm);
          font-weight: 500;
          background: none;
          -moz-appearance: textfield;
        }
        .qty-control input::-webkit-outer-spin-button,
        .qty-control input::-webkit-inner-spin-button { -webkit-appearance: none; }

        @media (max-width: 900px) {
          .cart-layout { grid-template-columns: 1fr; }
          .cart-summary { position: static; }
          .cart-item { flex-wrap: wrap; }
        }
        @media (max-width: 600px) {
          .cart-item { gap: var(--space-4); padding: var(--space-4); }
          .cart-item__img { width: 70px; height: 70px; }
        }
      `}</style>
    </div>
  );
}
