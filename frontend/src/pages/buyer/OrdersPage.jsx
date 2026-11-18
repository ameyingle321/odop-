// src/pages/buyer/OrdersPage.jsx
// Buyer order history page

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    orderService.getMyOrders()
      .then(res => setOrders(res?.data || []))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ paddingTop: 'var(--navbar-height)' }}><LoadingSpinner fullPage /></div>;

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      <div className="page-header" style={{ background: 'var(--color-surface)', paddingTop: 'calc(var(--navbar-height) + var(--space-10))', paddingBottom: 'var(--space-8)', marginTop: 0 }}>
        <div className="container">
          <nav className="breadcrumb"><Link to="/">Home</Link><span className="breadcrumb__sep">/</span><span className="breadcrumb__current">My Orders</span></nav>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)' }}>My Orders</h1>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', paddingBlock: 'var(--space-24)' }}>
            <div className="empty-state__icon">📦</div>
            <h2 className="empty-state__title">No orders yet</h2>
            <p className="empty-state__desc">Your orders will appear here once you make a purchase</p>
            <Link to="/products" className="btn btn-primary btn-lg">Start Shopping</Link>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-5)' }}>
            {orders.map(order => (
              <div key={order.id} style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-6)',
                border: '1.5px solid var(--color-border)',
              }}>
                {/* Order header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-1)' }}>
                      Order #{order.id.slice(0, 8).toUpperCase()}
                    </p>
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)' }}>
                      Placed on {formatDate(order.created_at)}
                    </p>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                    <span className={`badge badge-${ORDER_STATUS_COLORS[order.status] || 'neutral'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>
                    <span style={{ fontWeight: 700, fontSize: 'var(--text-lg)' }}>
                      {formatCurrency(order.total_amount)}
                    </span>
                    <Link to={`/orders/${order.id}`} className="btn btn-outline btn-sm">
                      View Details
                    </Link>
                  </div>
                </div>

                {/* Order items */}
                <div style={{ display: 'flex', gap: 'var(--space-3)', flexWrap: 'wrap' }}>
                  {(order.order_items || []).slice(0, 4).map(item => (
                    <div key={item.id} style={{
                      width: 60, height: 60,
                      borderRadius: 'var(--radius-md)',
                      overflow: 'hidden',
                      background: 'var(--color-bg-alt)',
                      flexShrink: 0,
                      position: 'relative',
                    }}>
                      <img
                        src={getProductImageUrl(item.product)}
                        alt={item.product?.name || 'Order item'}
                        style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />
                    </div>
                  ))}
                  {(order.order_items || []).length > 4 && (
                    <div style={{
                      width: 60, height: 60,
                      borderRadius: 'var(--radius-md)',
                      background: 'var(--color-bg-alt)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 'var(--text-xs)',
                      color: 'var(--color-text-muted)',
                      fontWeight: 600,
                    }}>
                      +{order.order_items.length - 4}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
