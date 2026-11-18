// src/components/common/StarRating.jsx
// Reusable star rating display

export default function StarRating({ rating = 0, max = 5, size = 16, showValue = false }) {
  return (
    <div className="stars-wrap" style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
      <div className="stars" style={{ fontSize: size }}>
        {Array.from({ length: max }).map((_, i) => {
          const filled = i < Math.floor(rating);
          const half   = !filled && i < rating;
          return (
            <span key={i} style={{ position: 'relative', display: 'inline-block', width: size, height: size }}>
              {/* Empty star */}
              <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"
                style={{ color: '#e0d8cc', position: 'absolute', top: 0, left: 0 }}>
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
              </svg>
              {/* Filled or half overlay */}
              {(filled || half) && (
                <svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" stroke="currentColor" strokeWidth="1.5"
                  style={{
                    color: 'var(--color-accent-gold)',
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    clipPath: half ? 'inset(0 50% 0 0)' : 'none',
                  }}>
                  <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                </svg>
              )}
            </span>
          );
        })}
      </div>
      {showValue && (
        <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', fontWeight: 500 }}>
          {rating.toFixed(1)}
        </span>
      )}
    </div>
  );
}
