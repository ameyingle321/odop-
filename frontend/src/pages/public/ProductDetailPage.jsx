// src/pages/public/ProductDetailPage.jsx
// Full product detail page with images, info, reviews

import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { productService } from '../../services/productService';
import { reviewService } from '../../services/reviewService';
import { useCart } from '../../context/CartContext';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { formatCurrency, formatDate, getErrorMessage, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import StarRating from '../../components/common/StarRating';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';

export default function ProductDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAuthenticated, isBuyer } = useAuth();
  const { addToCart } = useCart();
  const toast = useToast();

  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [reviewMeta, setReviewMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [adding, setAdding] = useState(false);
  const [reviewForm, setReviewForm] = useState({ rating: 5, comment: '' });
  const [reviewOrderId, setReviewOrderId] = useState('');
  const [eligibleOrders, setEligibleOrders] = useState([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);
  const [showReviewForm, setShowReviewForm] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
    setLoading(true);
    Promise.all([
      productService.getProductById(id),
      reviewService.getProductReviews(id).catch(() => ({ data: [] })),
    ]).then(([prod, revs]) => {
      setProduct(prod?.data);
      const reviewData = revs?.data;
      if (Array.isArray(reviewData)) {
        setReviews(reviewData);
      } else {
        setReviews(reviewData?.reviews || []);
        setReviewMeta(reviewData?.summary || reviewData?.meta || null);
      }
    }).catch(() => navigate('/products'))
      .finally(() => setLoading(false));
  }, [id, navigate]);

  const handleAddToCart = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isBuyer) { toast.info('Only buyers can add to cart'); return; }
    try {
      setAdding(true);
      await addToCart(product.id, quantity);
      toast.success(`${product.name} added to cart!`);
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!isAuthenticated) { navigate('/login'); return; }
    if (!isBuyer) { toast.info('Only buyers can purchase'); return; }
    try {
      setAdding(true);
      await addToCart(product.id, quantity);
      navigate('/cart');
    } catch (err) {
      toast.error(getErrorMessage(err));
      setAdding(false);
    }
  };

  // When opening review form, check buyer's delivered orders for this product
  const handleOpenReviewForm = async () => {
    setShowReviewForm(true);
    try {
      setLoadingOrders(true);
      const res = await orderService.getMyOrders();
      const allOrders = res?.data || [];
      const delivered = allOrders.filter(o => 
        (o.status === 'delivered' || o.order_status === 'delivered') &&
        (o.order_items || []).some(item => (item.product_id === id || item.product?.id === id))
      );
      setEligibleOrders(delivered);
      if (delivered.length > 0) {
        setReviewOrderId(delivered[0].id);
      }
    } catch {
      setEligibleOrders([]);
    } finally {
      setLoadingOrders(false);
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    if (!reviewOrderId) {
      toast.error('Verified purchase required: Please select a delivered order containing this product.');
      return;
    }
    try {
      setSubmittingReview(true);
      await reviewService.createReview(id, {
        order_id: reviewOrderId,
        rating: reviewForm.rating,
        comment: reviewForm.comment,
      });
      toast.success('Thank you! Your verified review has been submitted.');
      setShowReviewForm(false);
      setReviewForm({ rating: 5, comment: '' });
      // Reload reviews
      const revs = await reviewService.getProductReviews(id);
      setReviews(revs?.data?.reviews || revs?.data || []);
      setReviewMeta(revs?.data?.summary || revs?.data?.meta || null);
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

  if (!product) return null;

  const images = (product.product_images && product.product_images.length > 0)
    ? product.product_images.map(img => ({
        ...img,
        url: img.image_url || img.url || getProductImageUrl(product)
      }))
    : [{ url: getProductImageUrl(product), id: 'main' }];

  return (
    <div className="product-detail" style={{ paddingTop: 'var(--navbar-height)' }}>
      <div className="container" style={{ paddingTop: 'var(--space-10)' }}>
        {/* Breadcrumb */}
        <nav className="breadcrumb" aria-label="Breadcrumb">
          <Link to="/">Home</Link>
          <span className="breadcrumb__sep">/</span>
          <Link to="/products">Products</Link>
          <span className="breadcrumb__sep">/</span>
          <span className="breadcrumb__current">{product.name}</span>
        </nav>

        {/* Main layout */}
        <div className="product-detail__grid">
          {/* ── Image Gallery ── */}
          <div className="product-detail__gallery">
            {/* Main image */}
            <div className="product-detail__main-img">
              <img
                src={images[selectedImage]?.url || getProductImageUrl(product)}
                alt={product.name}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = DEFAULT_PRODUCT_IMAGE;
                }}
              />
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="product-detail__thumbs">
                {images.map((img, i) => (
                  <button
                    key={img.id || i}
                    className={`product-detail__thumb${selectedImage === i ? ' active' : ''}`}
                    onClick={() => setSelectedImage(i)}
                    aria-label={`Image ${i + 1}`}
                  >
                    <img src={img.url} alt={`${product.name} ${i + 1}`} />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* ── Product Info ── */}
          <div className="product-detail__info">
            {/* District badge */}
            {product.district_name && (
              <div style={{ marginBottom: 'var(--space-3)' }}>
                <Link
                  to={`/products?district=${product.district_id}`}
                  className="badge badge-accent"
                  style={{ textDecoration: 'none' }}
                >
                  📍 {product.district_name}
                </Link>
                {product.category_name && (
                  <span className="badge badge-neutral" style={{ marginLeft: 'var(--space-2)' }}>
                    {product.category_name}
                  </span>
                )}
              </div>
            )}

            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'var(--text-4xl)',
              letterSpacing: '-0.02em',
              color: 'var(--color-text-primary)',
              marginBottom: 'var(--space-4)',
              lineHeight: 1.15,
            }}>
              {product.name}
            </h1>

            {/* Rating summary */}
            {reviewMeta && (
              <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-5)' }}>
                <StarRating rating={reviewMeta.average_rating || 0} showValue />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  ({reviewMeta.total_reviews} review{reviewMeta.total_reviews !== 1 ? 's' : ''})
                </span>
              </div>
            )}

            {/* Price */}
            <div style={{ marginBottom: 'var(--space-6)' }}>
              <span style={{
                fontFamily: 'var(--font-display)',
                fontSize: 'var(--text-3xl)',
                fontWeight: 600,
                color: 'var(--color-text-primary)',
              }}>
                {formatCurrency(product.price)}
              </span>
              <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', marginLeft: 8 }}>
                incl. of all taxes
              </span>
            </div>

            {/* Description */}
            {product.description && (
              <p style={{
                color: 'var(--color-text-secondary)',
                lineHeight: 1.75,
                marginBottom: 'var(--space-8)',
                fontSize: 'var(--text-base)',
              }}>
                {product.description}
              </p>
            )}

            {/* Stock */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-6)' }}>
              {product.stock_quantity > 0 ? (
                <>
                  <span className="badge badge-success">✓ In Stock</span>
                  <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                    {product.stock_quantity} available
                  </span>
                </>
              ) : (
                <span className="badge badge-error">Out of Stock</span>
              )}
            </div>

            {/* Quantity + Add to cart */}
            {product.stock_quantity > 0 && (
              <div style={{ marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                  <label htmlFor="qty" style={{ fontSize: 'var(--text-sm)', fontWeight: 500, color: 'var(--color-text-secondary)' }}>
                    Quantity:
                  </label>
                  <div className="qty-control">
                    <button
                      id="qty-minus"
                      onClick={() => setQuantity(q => Math.max(1, q - 1))}
                      disabled={quantity <= 1}
                      aria-label="Decrease quantity"
                    >−</button>
                    <input
                      id="qty"
                      type="number"
                      min="1"
                      max={product.stock_quantity}
                      value={quantity}
                      onChange={e => setQuantity(Math.max(1, Math.min(product.stock_quantity, parseInt(e.target.value) || 1)))}
                    />
                    <button
                      id="qty-plus"
                      onClick={() => setQuantity(q => Math.min(product.stock_quantity, q + 1))}
                      disabled={quantity >= product.stock_quantity}
                      aria-label="Increase quantity"
                    >+</button>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: 'var(--space-4)', flexWrap: 'wrap' }}>
                  <button
                    id="add-to-cart-btn"
                    className="btn btn-outline btn-lg"
                    onClick={handleAddToCart}
                    disabled={adding}
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    {adding ? <span className="spinner" /> : (
                      <>
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/>
                          <line x1="3" y1="6" x2="21" y2="6"/>
                          <path d="M16 10a4 4 0 0 1-8 0"/>
                        </svg>
                        Add to Cart
                      </>
                    )}
                  </button>
                  <button
                    id="buy-now-btn"
                    className="btn btn-primary btn-lg"
                    onClick={handleBuyNow}
                    disabled={adding}
                    style={{ flex: 1, minWidth: 160 }}
                  >
                    Buy Now
                  </button>
                </div>
              </div>
            )}

            {/* Seller info */}
            {product.seller_name && (
              <div className="product-detail__seller">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/>
                  <circle cx="12" cy="7" r="4"/>
                </svg>
                <div>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>Sold by</p>
                  <p style={{ fontSize: 'var(--text-sm)', fontWeight: 500 }}>{product.seller_name}</p>
                </div>
              </div>
            )}

            {/* Delivery info */}
            <div className="product-detail__delivery">
              <div className="product-detail__delivery-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <rect x="1" y="3" width="15" height="13"/><polygon points="16 8 20 8 23 11 23 16 16 16 16 8"/>
                  <circle cx="5.5" cy="18.5" r="2.5"/><circle cx="18.5" cy="18.5" r="2.5"/>
                </svg>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Free Delivery</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>On orders above ₹499</p>
                </div>
              </div>
              <div className="product-detail__delivery-item">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/>
                  <polyline points="9 22 9 12 15 12 15 22"/>
                </svg>
                <div>
                  <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>Easy Returns</p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>7-day hassle-free</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* ── Reviews Section ── */}
        <div className="product-detail__reviews section-sm">
          <div className="divider" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 'var(--space-8)' }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-3xl)' }}>
              Reviews
              {reviewMeta && (
                <span style={{ fontSize: 'var(--text-lg)', fontWeight: 400, color: 'var(--color-text-muted)', marginLeft: 'var(--space-3)' }}>
                  ({reviewMeta.total_reviews})
                </span>
              )}
            </h2>
            {isAuthenticated && isBuyer && !showReviewForm && (
              <button
                id="write-review-btn"
                className="btn btn-outline"
                onClick={handleOpenReviewForm}
              >
                Write a Review
              </button>
            )}
          </div>

          {/* Review meta */}
          {reviewMeta && (
            <div className="review-meta">
              <div className="review-meta__avg">
                <span className="review-meta__score">{(reviewMeta.average_rating || 0).toFixed(1)}</span>
                <StarRating rating={reviewMeta.average_rating || 0} size={20} />
                <span style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
                  {reviewMeta.total_reviews} reviews
                </span>
              </div>
              {reviewMeta.rating_breakdown && (
                <div className="review-meta__bars">
                  {[5, 4, 3, 2, 1].map(star => {
                    const count = reviewMeta.rating_breakdown[star] || 0;
                    const pct = reviewMeta.total_reviews > 0 ? (count / reviewMeta.total_reviews) * 100 : 0;
                    return (
                      <div key={star} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)', marginBottom: 'var(--space-2)' }}>
                        <span style={{ fontSize: 'var(--text-xs)', width: 8 }}>{star}</span>
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ color: 'var(--color-accent-gold)' }}>
                          <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
                        </svg>
                        <div style={{ flex: 1, height: 6, background: 'var(--color-border)', borderRadius: 3, overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${pct}%`, background: 'var(--color-accent-gold)', borderRadius: 3, transition: 'width 0.5s ease' }} />
                        </div>
                        <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', width: 24 }}>{count}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}

          {/* Review Form */}
          {showReviewForm && (
            <form className="review-form" onSubmit={handleReviewSubmit} id="review-form" style={{ background: 'var(--color-surface)', padding: 'var(--space-6)', borderRadius: 'var(--radius-xl)', border: '1px solid var(--color-border)', marginBottom: 'var(--space-8)' }}>
              <h3 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, marginBottom: 'var(--space-4)' }}>
                Share your verified artisan review
              </h3>

              {loadingOrders ? (
                <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>Checking verified orders…</p>
              ) : eligibleOrders.length === 0 ? (
                <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-lg)', marginBottom: 'var(--space-4)' }}>
                  <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-accent)', fontWeight: 600 }}>
                    ⓘ Verified Purchase Required
                  </p>
                  <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                    To uphold genuine artisan trust, ODOP reviews can only be submitted for delivered orders containing this craft item.
                  </p>
                </div>
              ) : (
                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label htmlFor="review-order-select" className="label-text">
                    Verified Order <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <select
                    id="review-order-select"
                    className="input"
                    value={reviewOrderId}
                    onChange={e => setReviewOrderId(e.target.value)}
                    style={{ height: 44, borderRadius: 'var(--radius-lg)' }}
                  >
                    {eligibleOrders.map(o => (
                      <option key={o.id} value={o.id}>
                        Order #{o.id.slice(0, 8).toUpperCase()} ({formatDate(o.created_at)})
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label className="label-text">Rating</label>
                <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                  {[1, 2, 3, 4, 5].map(star => (
                    <button
                      key={star}
                      type="button"
                      onClick={() => setReviewForm(f => ({ ...f, rating: star }))}
                      style={{
                        background: 'none',
                        border: 'none',
                        cursor: 'pointer',
                        fontSize: '1.8rem',
                        color: star <= reviewForm.rating ? 'var(--color-accent-gold)' : 'var(--color-border-dark)',
                        transition: 'color var(--transition-fast)',
                      }}
                    >★</button>
                  ))}
                </div>
              </div>
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label htmlFor="review-comment" className="label-text">Review</label>
                <textarea
                  id="review-comment"
                  className="input input-square"
                  rows={4}
                  placeholder="Share your honest thoughts about this product…"
                  value={reviewForm.comment}
                  onChange={e => setReviewForm(f => ({ ...f, comment: e.target.value }))}
                  required
                  style={{ resize: 'vertical' }}
                />
              </div>
              <div style={{ display: 'flex', gap: 'var(--space-4)' }}>
                <button
                  type="submit"
                  id="submit-review-btn"
                  className="btn btn-primary"
                  disabled={submittingReview}
                >
                  {submittingReview ? <span className="spinner" /> : 'Submit Review'}
                </button>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowReviewForm(false)}
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Review List */}
          <div style={{ marginTop: 'var(--space-8)' }}>
            {reviews.length === 0 ? (
              <div className="empty-state" style={{ paddingBlock: 'var(--space-12)' }}>
                <div className="empty-state__icon">💬</div>
                <p className="empty-state__title">No reviews yet</p>
                <p className="empty-state__desc">Be the first to review this product!</p>
              </div>
            ) : (
              reviews.map(review => (
                <div key={review.id} className="review-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-3)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                      <div className="avatar">
                        {review.buyer_name?.[0]?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p style={{ fontWeight: 500, fontSize: 'var(--text-sm)' }}>{review.buyer_name || 'Anonymous'}</p>
                        <StarRating rating={review.rating} size={13} />
                      </div>
                    </div>
                    <span style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                      {formatDate(review.created_at)}
                    </span>
                  </div>
                  {review.comment && (
                    <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', lineHeight: 1.65 }}>
                      {review.comment}
                    </p>
                  )}
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      <style>{`
        .product-detail__grid {
          display: grid;
          grid-template-columns: 1fr 1fr;
          gap: var(--space-16);
          margin-bottom: var(--space-12);
        }

        .product-detail__gallery {}

        .product-detail__main-img {
          aspect-ratio: 1;
          border-radius: var(--radius-2xl);
          overflow: hidden;
          background: var(--color-bg-alt);
          margin-bottom: var(--space-4);
        }

        .product-detail__thumbs {
          display: flex;
          gap: var(--space-3);
          flex-wrap: wrap;
        }

        .product-detail__thumb {
          width: 72px;
          height: 72px;
          border-radius: var(--radius-lg);
          overflow: hidden;
          border: 2px solid var(--color-border);
          cursor: pointer;
          background: none;
          padding: 0;
          transition: border-color var(--transition-fast);
        }
        .product-detail__thumb img { width: 100%; height: 100%; object-fit: cover; }
        .product-detail__thumb.active,
        .product-detail__thumb:hover {
          border-color: var(--color-accent);
        }

        .product-detail__seller {
          display: flex;
          align-items: center;
          gap: var(--space-3);
          padding: var(--space-4);
          background: var(--color-bg-alt);
          border-radius: var(--radius-lg);
          margin-bottom: var(--space-6);
          color: var(--color-text-secondary);
        }

        .product-detail__delivery {
          display: flex;
          gap: var(--space-6);
          padding-top: var(--space-5);
          border-top: 1px solid var(--color-border);
        }
        .product-detail__delivery-item {
          display: flex;
          align-items: flex-start;
          gap: var(--space-3);
          color: var(--color-accent);
        }

        .qty-control {
          display: flex;
          align-items: center;
          border: 1.5px solid var(--color-border);
          border-radius: var(--radius-full);
          overflow: hidden;
        }
        .qty-control button {
          width: 38px;
          height: 38px;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 1.2rem;
          color: var(--color-text-secondary);
          background: none;
          border: none;
          cursor: pointer;
          transition: all var(--transition-fast);
        }
        .qty-control button:hover:not(:disabled) {
          background: var(--color-bg-alt);
          color: var(--color-text-primary);
        }
        .qty-control button:disabled { opacity: 0.35; cursor: not-allowed; }
        .qty-control input {
          width: 52px;
          text-align: center;
          border: none;
          outline: none;
          font-size: var(--text-base);
          font-weight: 500;
          color: var(--color-text-primary);
          background: none;
          -moz-appearance: textfield;
        }
        .qty-control input::-webkit-outer-spin-button,
        .qty-control input::-webkit-inner-spin-button { -webkit-appearance: none; }

        .review-meta {
          display: flex;
          gap: var(--space-12);
          padding: var(--space-8);
          background: var(--color-bg-alt);
          border-radius: var(--radius-xl);
          margin-bottom: var(--space-8);
        }
        .review-meta__avg {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: var(--space-3);
          min-width: 120px;
        }
        .review-meta__score {
          font-family: var(--font-display);
          font-size: 3.5rem;
          font-weight: 200;
          line-height: 1;
          color: var(--color-text-primary);
        }
        .review-meta__bars { flex: 1; }

        .review-form {
          background: var(--color-bg-alt);
          padding: var(--space-8);
          border-radius: var(--radius-xl);
          margin-bottom: var(--space-8);
          border: 1.5px solid var(--color-border);
        }

        .review-card {
          padding: var(--space-6) 0;
          border-bottom: 1px solid var(--color-border);
        }
        .review-card:last-child { border-bottom: none; }

        @media (max-width: 900px) {
          .product-detail__grid { grid-template-columns: 1fr; gap: var(--space-8); }
          .review-meta { flex-direction: column; }
        }
      `}</style>
    </div>
  );
}
