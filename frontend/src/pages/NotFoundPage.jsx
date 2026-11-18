// src/pages/NotFoundPage.jsx
// 404 page

import { Link } from 'react-router-dom';

export default function NotFoundPage() {
  return (
    <div style={{
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      minHeight: '100vh',
      background: 'var(--color-bg)',
      textAlign: 'center',
      padding: 'var(--space-8)',
    }}>
      <p style={{ fontFamily: 'var(--font-display)', fontSize: '8rem', fontWeight: 200, lineHeight: 1, color: 'var(--color-border-dark)', marginBottom: 'var(--space-4)' }}>
        404
      </p>
      <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)', marginBottom: 'var(--space-4)' }}>
        Page not found
      </h1>
      <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-10)', maxWidth: 400 }}>
        The page you're looking for doesn't exist or has been moved.
      </p>
      <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
        <Link to="/" className="btn btn-primary btn-lg">Go Home</Link>
        <Link to="/products" className="btn btn-outline btn-lg">Browse Products</Link>
      </div>
    </div>
  );
}
