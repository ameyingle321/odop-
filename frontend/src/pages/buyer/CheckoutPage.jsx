// src/pages/buyer/CheckoutPage.jsx
// Checkout page with address + Razorpay payment

import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { orderService } from '../../services/orderService';
import { paymentService } from '../../services/paymentService';
import { formatCurrency, getErrorMessage, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';

export default function CheckoutPage() {
  const { items, cartTotal, cartCount, clearCart } = useCart();
  const { user } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();

  const [form, setForm] = useState({
    full_name:    user?.name || '',
    phone:        user?.phone || '',
    address_line: '',
    city:         '',
    state:        '',
    pincode:      '',
  });
  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  const deliveryFee = cartTotal >= 499 ? 0 : 50;
  const orderTotal  = cartTotal + deliveryFee;

  const validate = () => {
    const e = {};
    if (!form.full_name.trim()) e.full_name    = 'Name is required';
    if (!form.phone.trim())     e.phone        = 'Phone is required';
    if (!form.address_line.trim()) e.address_line = 'Address is required';
    if (!form.city.trim())      e.city         = 'City is required';
    if (!form.state.trim())     e.state        = 'State is required';
    if (!/^\d{6}$/.test(form.pincode)) e.pincode = 'Enter a valid 6-digit pincode';
    return e;
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      setLoading(true);

      // Create order
      const orderRes = await orderService.createOrder({
        shipping_address: form,
        items: items.map(i => ({ product_id: i.product_id || i.product?.id, quantity: i.quantity })),
      });

      const order = orderRes?.data;

      // Create Razorpay order
      const rzpRes = await paymentService.createRazorpayOrder(order.id);
      const rzpOrder = rzpRes?.data;

      // Open Razorpay checkout
      await paymentService.openCheckout({
        razorpayOrderId: rzpOrder.razorpay_order_id,
        amount: rzpOrder.amount,
        currency: rzpOrder.currency,
        description: `ODOP Nexus — Order #${order.id.slice(0, 8)}`,
        prefill: {
          name:    form.full_name,
          contact: form.phone,
          email:   user?.email,
        },
        onSuccess: async (response) => {
          try {
            // Verify payment
            await paymentService.verifyPayment({
              order_id:                order.id,
              razorpay_order_id:       response.razorpay_order_id,
              razorpay_payment_id:     response.razorpay_payment_id,
              razorpay_signature:      response.razorpay_signature,
            });
            await clearCart();
            toast.success('Payment successful! Order placed.');
            navigate(`/orders/${order.id}?success=true`);
          } catch (err) {
            toast.error('Payment verification failed. Contact support.');
          } finally {
            setLoading(false);
          }
        },
        onFailure: (err) => {
          toast.error('Payment cancelled or failed');
          setLoading(false);
        },
      });
    } catch (err) {
      toast.error(getErrorMessage(err));
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div style={{ paddingTop: 'var(--navbar-height)' }}>
        <div className="empty-state section">
          <div className="empty-state__icon">🛒</div>
          <h2 className="empty-state__title">Nothing to checkout</h2>
          <p className="empty-state__desc">Your cart is empty</p>
          <Link to="/products" className="btn btn-primary">Shop Now</Link>
        </div>
      </div>
    );
  }

  const inputField = (id, label, key, type = 'text', placeholder = '') => (
    <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
      <label htmlFor={id} className="label-text">
        {label} <span style={{ color: 'var(--color-error)' }}>*</span>
      </label>
      <input
        id={id}
        type={type}
        className={`input input-square${errors[key] ? ' input--error' : ''}`}
        placeholder={placeholder || label}
        value={form[key]}
        onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
      />
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      <div className="page-header" style={{ background: 'var(--color-surface)', paddingTop: 'calc(var(--navbar-height) + var(--space-10))', paddingBottom: 'var(--space-8)', marginTop: 0 }}>
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb__sep">/</span>
            <Link to="/cart">Cart</Link>
            <span className="breadcrumb__sep">/</span>
            <span className="breadcrumb__current">Checkout</span>
          </nav>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)' }}>
            Checkout
          </h1>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        <form id="checkout-form" onSubmit={handlePlaceOrder}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
            {/* Shipping Form */}
            <div>
              <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', marginBottom: 'var(--space-6)' }}>
                <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, marginBottom: 'var(--space-8)' }}>
                  Shipping Address
                </h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0 var(--space-5)' }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {inputField('co-name', 'Full Name', 'full_name', 'text', 'Your full name')}
                  </div>
                  <div>
                    {inputField('co-phone', 'Phone', 'phone', 'tel', '10-digit mobile')}
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    {inputField('co-address', 'Address Line', 'address_line', 'text', 'Street, house no., locality')}
                  </div>
                  <div>
                    {inputField('co-city', 'City', 'city', 'text', 'City')}
                  </div>
                  <div>
                    {inputField('co-state', 'State', 'state', 'text', 'State')}
                  </div>
                  <div>
                    {inputField('co-pincode', 'Pincode', 'pincode', 'text', '6-digit pincode')}
                  </div>
                </div>
              </div>

              {/* Payment notice */}
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-6)',
                border: '1.5px solid var(--color-accent-pale)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-4)' }}>
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--color-accent)" strokeWidth="1.5">
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                    <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                  </svg>
                  <span style={{ fontWeight: 600, color: 'var(--color-text-primary)' }}>Secure Payment</span>
                </div>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', lineHeight: 1.6 }}>
                  After placing your order, you'll be redirected to Razorpay's secure payment gateway.
                  We support UPI, credit/debit cards, net banking, and digital wallets.
                </p>
              </div>
            </div>

            {/* Order Summary */}
            <div style={{
              background: 'var(--color-surface)',
              borderRadius: 'var(--radius-2xl)',
              padding: 'var(--space-8)',
              position: 'sticky',
              top: 'calc(var(--navbar-height) + var(--space-6))',
            }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
                Order Summary
              </h2>

              <div style={{ maxHeight: 280, overflowY: 'auto', marginBottom: 'var(--space-6)' }}>
                {items.map(item => (
                  <div key={item.id} style={{ display: 'flex', gap: 'var(--space-3)', marginBottom: 'var(--space-4)', alignItems: 'center' }}>
                    <div style={{
                      width: 52, height: 52, borderRadius: 'var(--radius-md)',
                      overflow: 'hidden', flexShrink: 0, background: 'var(--color-bg-alt)',
                    }}>
                      <img
                        src={getProductImageUrl(item.product)}
                        alt={item.product?.name}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.product?.name}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Qty: {item.quantity}</p>
                    </div>
                    <p style={{ fontSize: 'var(--text-sm)', fontWeight: 600, flexShrink: 0 }}>
                      {formatCurrency((item.product?.price || 0) * item.quantity)}
                    </p>
                  </div>
                ))}
              </div>

              <hr className="divider" style={{ marginBlock: 'var(--space-4)' }} />

              <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>Subtotal</span><span>{formatCurrency(cartTotal)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                  <span>Delivery</span>
                  <span style={{ color: deliveryFee === 0 ? 'var(--color-success)' : 'inherit' }}>
                    {deliveryFee === 0 ? 'FREE' : formatCurrency(deliveryFee)}
                  </span>
                </div>
                <hr className="divider" style={{ marginBlock: 0 }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 700, fontSize: 'var(--text-xl)' }}>
                  <span>Total</span><span>{formatCurrency(orderTotal)}</span>
                </div>
              </div>

              <button
                type="submit"
                id="place-order-btn"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center' }}
              >
                {loading ? (
                  <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
                ) : (
                  <>
                    Pay {formatCurrency(orderTotal)}
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                    </svg>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>

      <style>{`
        .input--error { border-color: var(--color-error) !important; }
        @media (max-width: 900px) {
          form > div { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  );
}
