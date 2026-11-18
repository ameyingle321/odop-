// src/pages/seller/SellerDashboardPage.jsx
// Seller dashboard with stats and quick actions

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { orderService } from '../../services/orderService';
import { productService } from '../../services/productService';
import { useAuth } from '../../context/AuthContext';
import { formatCurrency, formatDate } from '../../utils';
import { ORDER_STATUS_LABELS, ORDER_STATUS_COLORS } from '../../constants';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function SellerDashboardPage() {
  const { user } = useAuth();
  const [stats, setStats] = useState({ products: 0, orders: 0, revenue: 0, pending: 0 });
  const [recentOrders, setRecentOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      productService.getMyProducts({ limit: 1 }),
      orderService.getSellerOrders({ limit: 5 }),
    ]).then(([prods, orders]) => {
      const ordList = orders?.data || [];
      setRecentOrders(ordList.slice(0, 5));
      const revenue = ordList.filter(o => o.status === 'delivered').reduce((s, o) => s + (o.total_amount || 0), 0);
      const pending = ordList.filter(o => o.status === 'pending').length;
      setStats({
        products: prods?.data?.total || 0,
        orders:   ordList.length,
        revenue,
        pending,
      });
    }).catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div style={{ paddingTop: 'var(--navbar-height)' }}><LoadingSpinner fullPage /></div>;

  return (
    <div style={{ paddingTop: 'var(--navbar-height)', minHeight: '100vh', background: 'var(--color-bg-alt)' }}>
      {/* Header */}
      <div style={{ background: 'var(--color-surface)', padding: 'calc(var(--navbar-height) + var(--space-10)) 0 var(--space-10)', borderBottom: '1px solid var(--color-border)' }}>
        <div className="container">
          <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginBottom: 'var(--space-2)' }}>
            Seller Dashboard
          </p>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-10)' }}>
        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 'var(--space-5)', marginBottom: 'var(--space-10)' }}>
          {[
            { label: 'Total Products', value: stats.products, icon: '🏺', color: 'var(--color-accent-pale)', link: '/seller/products' },
            { label: 'Total Orders', value: stats.orders, icon: '📦', color: '#ddeef8', link: '/seller/orders' },
            { label: 'Revenue', value: formatCurrency(stats.revenue), icon: '💰', color: '#d4f0e4', link: '/seller/orders' },
            { label: 'Pending Orders', value: stats.pending, icon: '⏳', color: '#fdf0d8', link: '/seller/orders?status=pending' },
          ].map(s => (
            <Link key={s.label} to={s.link} style={{ textDecoration: 'none' }}>
              <div style={{
                background: 'var(--color-surface)',
                borderRadius: 'var(--radius-2xl)',
                padding: 'var(--space-6)',
                border: '1.5px solid var(--color-border)',
                transition: 'all var(--transition-base)',
                cursor: 'pointer',
              }}
              onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = 'var(--shadow-md)'; }}
              onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = ''; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: s.color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.5rem', marginBottom: 'var(--space-4)' }}>
                  {s.icon}
                </div>
                <p style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-3xl)', color: 'var(--color-text-primary)', lineHeight: 1 }}>
                  {s.value}
                </p>
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)', marginTop: 'var(--space-2)' }}>
                  {s.label}
                </p>
              </div>
            </Link>
          ))}
        </div>

        {/* Quick Actions */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-8)', alignItems: 'flex-start' }}>
          {/* Recent Orders */}
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', padding: 'var(--space-8)', border: '1px solid var(--color-border)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 'var(--space-6)' }}>
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)' }}>Recent Orders</h2>
              <Link to="/seller/orders" className="btn btn-ghost btn-sm" style={{ fontSize: 'var(--text-xs)' }}>View all →</Link>
            </div>
            {recentOrders.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--space-8)' }}>
                <div className="empty-state__icon" style={{ fontSize: '2rem' }}>📭</div>
                <p className="empty-state__title" style={{ fontSize: 'var(--text-xl)' }}>No orders yet</p>
              </div>
            ) : (
              <div>
                {recentOrders.map(order => (
                  <Link key={order.id} to={`/seller/orders/${order.id}`} style={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    padding: 'var(--space-4) 0',
                    borderBottom: '1px solid var(--color-border)',
                    textDecoration: 'none',
                  }}>
                    <div>
                      <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-primary)' }}>
                        #{order.id.slice(0, 8).toUpperCase()}
                      </p>
                      <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>{formatDate(order.created_at)}</p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <span className={`badge badge-${ORDER_STATUS_COLORS[order.status] || 'neutral'}`} style={{ fontSize: '0.7rem' }}>
                        {ORDER_STATUS_LABELS[order.status] || order.status}
                      </span>
                      <span style={{ fontWeight: 600, fontSize: 'var(--text-sm)' }}>{formatCurrency(order.total_amount)}</span>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Quick Actions */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-2)' }}>
              Quick Actions
            </h2>
            {[
              { to: '/seller/products/new', icon: '➕', label: 'Add New Product', desc: 'List a new product for sale', color: 'var(--color-accent)' },
              { to: '/seller/products',     icon: '📋', label: 'Manage Products', desc: 'Edit or remove your listings', color: '#5a7a9a' },
              { to: '/seller/orders',       icon: '📦', label: 'View Orders',     desc: 'Manage and update order status', color: '#9a6060' },
            ].map(action => (
              <Link
                key={action.to}
                to={action.to}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 'var(--space-4)',
                  padding: 'var(--space-5)',
                  background: 'var(--color-surface)',
                  borderRadius: 'var(--radius-xl)',
                  border: '1.5px solid var(--color-border)',
                  textDecoration: 'none',
                  transition: 'all var(--transition-base)',
                }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = action.color; e.currentTarget.style.transform = 'translateX(4px)'; }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = ''; e.currentTarget.style.transform = ''; }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: `${action.color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', flexShrink: 0 }}>
                  {action.icon}
                </div>
                <div>
                  <p style={{ fontWeight: 600, color: 'var(--color-text-primary)', marginBottom: 'var(--space-1)' }}>{action.label}</p>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>{action.desc}</p>
                </div>
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--color-border-dark)" strokeWidth="2" style={{ marginLeft: 'auto', flexShrink: 0 }}>
                  <line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/>
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
