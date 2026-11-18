// src/components/common/LoadingSpinner.jsx
// Full-page and inline loading indicators

export function LoadingSpinner({ fullPage = false, size = 32 }) {
  if (fullPage) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '60vh',
      }}>
        <div style={{
          width: size,
          height: size,
          border: '3px solid var(--color-border)',
          borderTopColor: 'var(--color-accent)',
          borderRadius: '50%',
          animation: 'spin 0.7s linear infinite',
        }} />
      </div>
    );
  }

  return (
    <div style={{
      width: size,
      height: size,
      border: '2px solid var(--color-border)',
      borderTopColor: 'var(--color-accent)',
      borderRadius: '50%',
      animation: 'spin 0.7s linear infinite',
      display: 'inline-block',
    }} />
  );
}

export function ProductCardSkeleton() {
  return (
    <div style={{ borderRadius: 'var(--radius-xl)', overflow: 'hidden' }}>
      <div className="skeleton" style={{ aspectRatio: '3/4' }} />
      <div style={{ padding: '1rem' }}>
        <div className="skeleton" style={{ height: 10, width: '40%', marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '80%', marginBottom: 8, borderRadius: 4 }} />
        <div className="skeleton" style={{ height: 14, width: '30%', borderRadius: 4 }} />
      </div>
    </div>
  );
}

export function ProductGridSkeleton({ count = 8 }) {
  return (
    <div className="product-grid">
      {Array.from({ length: count }).map((_, i) => (
        <ProductCardSkeleton key={i} />
      ))}
    </div>
  );
}
