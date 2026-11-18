// src/pages/seller/SellerOrdersPage.jsx
// Seller order fulfillment page: view incoming orders, inspect delivery address, and update status

import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { formatCurrency, formatDate, getErrorMessage } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { useToast } from '../../context/ToastContext';

export default function SellerOrdersPage() {
  const toast = useToast();
  const [searchParams, setSearchParams] = useSearchParams();
  const currentFilter = searchParams.get('status') || 'all';

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState(null);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const params = {};
      if (currentFilter !== 'all') params.status = currentFilter;
      const res = await orderService.getSellerOrders(params);
      setOrders(res?.data || []);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadOrders();
  }, [currentFilter]);

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      setUpdatingId(orderId);
      await orderService.updateOrderStatus(orderId, newStatus);
      toast.success(`Order #${orderId.slice(0, 8).toUpperCase()} updated to ${newStatus}.`);
      setOrders(list => list.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div style={{ paddingTop: 'var(--navbar-height)' }}>
        <LoadingSpinner fullPage />
      </div>
    );
  }

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      {/* Header */}
      <div className="page-header" style={{ background: 'var(--color-surface)', paddingTop: 'calc(var(--navbar-height) + var(--space-8))', paddingBottom: 'var(--space-8)', marginTop: 0 }}>
        <div className="container">
          <nav className="breadcrumb">
            <Link to="/">Home</Link>
            <span className="breadcrumb__sep">/</span>
            <Link to="/seller/dashboard">Seller Dashboard</Link>
            <span className="breadcrumb__sep">/</span>
            <span className="breadcrumb__current">Order Fulfillment</span>
          </nav>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-3xl)' }}>
            Customer Orders Received
          </h1>
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
            Track artisan shipments and update fulfillment progress for buyers
          </p>

          {/* Filter Pills */}
          <div style={{ display: 'flex', gap: 'var(--space-2)', marginTop: 'var(--space-5)', flexWrap: 'wrap' }}>
            {['all', 'pending_payment', 'confirmed', 'shipped', 'delivered', 'cancelled'].map(st => (
              <button
                key={st}
                type="button"
                className={`btn btn-sm ${currentFilter === st ? 'btn-primary' : 'btn-outline'}`}
                onClick={() => setSearchParams(st === 'all' ? {} : { status: st })}
                style={{ textTransform: 'capitalize' }}
              >
                {st === 'all' ? 'All Orders' : ORDER_STATUS_LABELS[st] || st}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        {orders.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', paddingBlock: 'var(--space-16)' }}>
            <div className="empty-state__icon">📦</div>
            <h2 className="empty-state__title">No orders found</h2>
            <p className="empty-state__desc">Orders from buyers for your artisan crafts will appear here.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-6)' }}>
            {orders.map(order => (
              <div
                key={order.id}
                style={{
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-2xl)',
                  padding: 'var(--space-6)',
                  border: '1px solid var(--color-border)',
                }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 'var(--space-4)', marginBottom: 'var(--space-5)' }}>
                  <div>
                    <span style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)' }}>
                      ORDER #{order.id.slice(0, 8).toUpperCase()}
                    </span>
                    <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: '2px' }}>
                      Placed {formatDate(order.created_at)}
                    </p>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                    <span className={`badge badge-${ORDER_STATUS_COLORS[order.status] || 'neutral'}`}>
                      {ORDER_STATUS_LABELS[order.status] || order.status}
                    </span>

                    {/* Status updater dropdown */}
                    {order.status !== 'delivered' && order.status !== 'cancelled' && (
                      <select
                        className="input"
                        style={{ height: 36, fontSize: 'var(--text-xs)', borderRadius: 'var(--radius-md)', padding: '0 8px' }}
                        value={order.status}
                        disabled={updatingId === order.id}
                        onChange={e => handleUpdateStatus(order.id, e.target.value)}
                      >
                        <option value={order.status} disabled>Current: {ORDER_STATUS_LABELS[order.status] || order.status}</option>
                        {order.status === 'confirmed' && <option value="processing">Mark In Production (Processing)</option>}
                        {order.status === 'processing' && <option value="shipped">Mark Shipped</option>}
                        {order.status === 'shipped' && <option value="delivered">Mark Delivered</option>}
                        <option value="cancelled">Cancel Order</option>
                      </select>
                    )}
                  </div>
                </div>

                {/* Items & Shipping row */}
                <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 'var(--space-6)', paddingTop: 'var(--space-4)', borderTop: '1px solid var(--color-border)' }}>
                  <div>
                    <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-text-muted)', marginBottom: 'var(--space-3)' }}>
                      ITEMS
                    </p>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                      {(order.order_items || []).map(item => (
                        <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 'var(--text-sm)' }}>
                          <span>
                            {item.product?.name || 'Artisan Craft'} <span style={{ color: 'var(--color-text-muted)' }}>× {item.quantity}</span>
                          </span>
                          <span style={{ fontWeight: 600 }}>{formatCurrency(item.total_price || (item.unit_price * item.quantity))}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', padding: 'var(--space-4)', fontSize: 'var(--text-xs)' }}>
                    <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: '4px' }}>
                      Ship To: {order.delivery_name}
                    </p>
                    <p style={{ color: 'var(--color-text-secondary)', lineHeight: 1.4 }}>
                      {order.delivery_address}<br />
                      {order.delivery_city}, {order.delivery_state} {order.delivery_pincode}
                    </p>
                    <p style={{ marginTop: '6px', color: 'var(--color-text-muted)' }}>
                      Phone: {order.delivery_phone}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
