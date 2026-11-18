// src/pages/buyer/OrderDetailPage.jsx
// Detailed order view with status tracker, items, delivery address & review action

import { useState, useEffect } from 'react';
import { useParams, Link, useSearchParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { reviewService } from '../../services/reviewService';
import { formatCurrency, formatDate, getErrorMessage, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { useToast } from '../../context/ToastContext';

export default function OrderDetailPage() {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const toast = useToast();
  const isNewOrder = searchParams.get('success') === 'true';

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelling, setCancelling] = useState(false);

  // Review modal state
  const [reviewModalItem, setReviewModalItem] = useState(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    orderService.getOrderById(id)
      .then(res => setOrder(res?.data || null))
      .catch(err => toast.error(getErrorMessage(err)))
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancelOrder = async () => {
    if (!window.confirm('Are you sure you want to cancel this order?')) return;
    try {
      setCancelling(true);
      await orderService.cancelOrder(id);
      toast.success('Order cancelled successfully.');
      const res = await orderService.getOrderById(id);
      setOrder(res?.data || null);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCancelling(false);
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (!reviewModalItem) return;
    try {
      setSubmittingReview(true);
      await reviewService.createReview(reviewModalItem.product_id || reviewModalItem.product?.id, {
        order_id: id,
        rating,
        comment,
      });
      toast.success('Thank you! Your verified review has been recorded.');
      setReviewModalItem(null);
      setComment('');
      setRating(5);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--navbar-height)' }}>
        <LoadingSpinner fullPage />
      </div>
    );
  }

  if (!order) {
    return (
      <div className="container section-md" style={{ paddingTop: 'calc(var(--navbar-height) + var(--space-8))' }}>
        <div className="empty-state">
          <div className="empty-state__icon">🔍</div>
          <h2 className="empty-state__title">Order Not Found</h2>
          <p className="empty-state__desc">The requested order could not be located.</p>
          <Link to="/orders" className="btn btn-primary">Back to My Orders</Link>
        </div>
      </div>
    );
  }

  const steps = ['pending_payment', 'confirmed', 'processing', 'shipped', 'delivered'];
  const currentStepIdx = steps.indexOf(order.status);
  const isDelivered = order.status === 'delivered';
  const canCancel = order.status === 'pending_payment' || order.status === 'confirmed';

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--color-surface)', paddingTop: 'calc(var(--navbar-height) + var(--space-8))', paddingBottom: 'var(--space-8)', marginTop: 0 }}>
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb__sep">/</span>
            <Link to="/orders">My Orders</Link>
            <span className="breadcrumb__sep">/</span>
            <span className="breadcrumb__current">#{order.id.slice(0, 8).toUpperCase()}</span>
          </nav>

          {isNewOrder && (
            <div style={{ padding: 'var(--space-4) var(--space-6)', background: 'var(--color-accent-pale)', color: 'var(--color-accent-dark)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-5)', border: '1px solid rgba(217, 119, 6, 0.2)' }}>
              🎉 <strong>Payment Confirmed!</strong> Thank you for supporting authentic ODOP artisans. Your order has been placed.
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-3xl)' }}>
                Order #{order.id.slice(0, 8).toUpperCase()}
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                Placed on {formatDate(order.created_at)}
              </p>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
              <span className={`badge badge-${ORDER_STATUS_COLORS[order.status] || 'neutral'}`} style={{ fontSize: 'var(--text-sm)', padding: '6px 14px' }}>
                {ORDER_STATUS_LABELS[order.status] || order.status}
              </span>
              {canCancel && (
                <button
                  type="button"
                  onClick={handleCancelOrder}
                  disabled={cancelling}
                  className="btn btn-outline btn-sm"
                  style={{ color: 'var(--color-error)', borderColor: 'var(--color-error)' }}
                >
                  {cancelling ? 'Cancelling…' : 'Cancel Order'}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        {/* Progress Tracker (unless cancelled) */}
        {order.status !== 'cancelled' && (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-8)' }}>
            <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-6)' }}>
              Fulfillment Journey
            </h3>
            <div style={{ display: 'flex', justifyContent: 'space-between', position: 'relative' }}>
              {/* Progress bar line */}
              <div style={{
                position: 'absolute', top: 16, left: 30, right: 30, height: 3,
                background: 'var(--color-border)', zIndex: 0
              }}>
                <div style={{
                  height: '100%',
                  background: 'var(--color-accent)',
                  width: `${Math.max(0, (currentStepIdx / (steps.length - 1)) * 100)}%`,
                  transition: 'width 0.4s ease'
                }} />
              </div>

              {steps.map((st, i) => {
                const isPassed = currentStepIdx >= i;
                const isCurrent = currentStepIdx === i;
                return (
                  <div key={st} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', zIndex: 1, flex: 1 }}>
                    <div style={{
                      width: 32, height: 32, borderRadius: '50%',
                      background: isPassed ? 'var(--color-accent)' : 'var(--color-surface)',
                      border: `2px solid ${isPassed ? 'var(--color-accent)' : 'var(--color-border)'}`,
                      color: isPassed ? 'white' : 'var(--color-text-muted)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 'var(--text-xs)', fontWeight: 700, marginBottom: 'var(--space-2)'
                    }}>
                      {isPassed ? '✓' : i + 1}
                    </div>
                    <span style={{
                      fontSize: 'var(--text-xs)',
                      fontWeight: isCurrent ? 600 : 400,
                      color: isPassed ? 'var(--color-text-primary)' : 'var(--color-text-muted)',
                      textAlign: 'center'
                    }}>
                      {ORDER_STATUS_LABELS[st] || st}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Order Details Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
          {/* Items */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', border: '1px solid var(--color-border)' }}>
            <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-6)' }}>
              Ordered Craft Items
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
              {(order.order_items || []).map(item => {
                const prod = item.product || {};
                const img = getProductImageUrl(prod);
                return (
                  <div key={item.id} style={{ display: 'flex', gap: 'var(--space-4)', paddingBottom: 'var(--space-5)', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-lg)', overflow: 'hidden', background: 'var(--color-bg-alt)', flexShrink: 0 }}>
                      <img
                        src={img}
                        alt={prod.name || 'Craft item'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                    <div style={{ flex: 1 }}>
                      <Link to={`/products/${prod.id || item.product_id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none', fontSize: 'var(--text-base)' }}>
                        {prod.name || 'ODOP Artisan Craft'}
                      </Link>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-1)' }}>
                        Quantity: {item.quantity} × {formatCurrency(item.unit_price)}
                      </p>
                      {item.district && (
                        <span style={{ fontSize: '0.7rem', padding: '2px 8px', borderRadius: 4, background: 'var(--color-bg-alt)', color: 'var(--color-accent)', marginTop: 'var(--space-2)', display: 'inline-block' }}>
                          Origin: {item.district}
                        </span>
                      )}
                    </div>
                    <div style={{ textAlign: 'right', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>
                        {formatCurrency(item.total_price || (item.unit_price * item.quantity))}
                      </span>
                      {isDelivered && (
                        <button
                          type="button"
                          onClick={() => setReviewModalItem(item)}
                          className="btn btn-outline btn-sm"
                          style={{ fontSize: 'var(--text-xs)', marginTop: 'var(--space-2)' }}
                        >
                          ★ Review Craft
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Delivery & Summary Column */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {/* Delivery address */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
                Delivery Destination
              </h3>
              <p style={{ fontWeight: 600, fontSize: 'var(--text-base)' }}>{order.delivery_name}</p>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)', lineHeight: 1.5 }}>
                {order.delivery_address}<br />
                {order.delivery_city}, {order.delivery_district}<br />
                {order.delivery_state} — {order.delivery_pincode}
              </p>
              <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginTop: 'var(--space-3)' }}>
                Contact: {order.delivery_phone}
              </p>
            </div>

            {/* Payment Summary */}
            <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-6)', border: '1px solid var(--color-border)' }}>
              <h3 style={{ fontSize: 'var(--text-sm)', fontWeight: 600, color: 'var(--color-text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-4)' }}>
                Financial Summary
              </h3>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-2)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Item Subtotal</span>
                <span>{formatCurrency(order.subtotal || order.total_amount)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)', marginBottom: 'var(--space-4)' }}>
                <span style={{ color: 'var(--color-text-secondary)' }}>Delivery Fee</span>
                <span style={{ color: 'var(--color-success)' }}>Free</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-lg)', fontWeight: 700, paddingTop: 'var(--space-3)', borderTop: '1px solid var(--color-border)' }}>
                <span>Total Paid</span>
                <span style={{ color: 'var(--color-accent)' }}>{formatCurrency(order.total_amount)}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      {reviewModalItem && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)'
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', maxWidth: 480, width: '100%',
            padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
              Review {reviewModalItem.product?.name || 'Craft'}
            </h2>
            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-5)' }}>
              Verified purchase review for Order #{order.id.slice(0, 8).toUpperCase()}
            </p>

            <form onSubmit={handleSubmitReview}>
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="label-text">Artisan Craft Rating</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[1, 2, 3, 4, 5].map(s => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setRating(s)}
                      style={{
                        background: 'none', border: 'none', cursor: 'pointer', fontSize: '2rem',
                        color: s <= rating ? 'var(--color-accent-gold)' : 'var(--color-border-dark)'
                      }}
                    >★</button>
                  ))}
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="label-text">Comments & Heritage Appreciation</label>
                <textarea
                  className="input input-square"
                  rows={4}
                  placeholder="Share details regarding material authenticity, packaging, and craft quality…"
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  style={{ resize: 'vertical' }}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setReviewModalItem(null)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingReview}
                  className="btn btn-primary"
                >
                  {submittingReview ? 'Submitting…' : 'Post Verified Review'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
