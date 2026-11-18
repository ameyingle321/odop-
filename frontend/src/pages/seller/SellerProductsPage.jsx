// src/pages/seller/SellerProductsPage.jsx
// Seller product management: list, create new craft, toggle status, and edit

import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { productService } from '../../services/productService';
import { formatCurrency, formatDate, getErrorMessage, getProductImageUrl, DEFAULT_PRODUCT_IMAGE } from '../../utils';
import { LoadingSpinner } from '../../components/common/LoadingSpinner';
import { useToast } from '../../context/ToastContext';

export default function SellerProductsPage() {
  const toast = useToast();
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Modal create product state
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [creating, setCreating] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category_id: '',
    district_id: '',
    price: '',
    stock: '',
    description: '',
    image_url: '',
    odop_product_name: '',
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [prodsRes, catsRes, distsRes] = await Promise.all([
        productService.getMyProducts({ limit: 50 }),
        productService.getCategories(),
        productService.getDistricts(),
      ]);

      setProducts(prodsRes?.data?.products || prodsRes?.data || []);
      const catList = catsRes?.data || [];
      const distList = distsRes?.data || [];
      setCategories(catList);
      setDistricts(distList);

      if (catList.length > 0 && !newProduct.category_id) {
        setNewProduct(p => ({ ...p, category_id: catList[0].id }));
      }
      if (distList.length > 0 && !newProduct.district_id) {
        setNewProduct(p => ({ ...p, district_id: distList[0].id }));
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleCreateProduct = async (e) => {
    e.preventDefault();
    if (!newProduct.name.trim() || !newProduct.price || !newProduct.category_id) {
      toast.error('Please enter name, category, and price');
      return;
    }

    try {
      setCreating(true);
      const payload = {
        name: newProduct.name.trim(),
        category_id: newProduct.category_id,
        district_id: newProduct.district_id || undefined,
        price: Number(newProduct.price),
        stock: Number(newProduct.stock) || 0,
        description: newProduct.description.trim() || undefined,
        odop_product_name: newProduct.odop_product_name.trim() || newProduct.name.trim(),
        images: newProduct.image_url ? [{ image_url: newProduct.image_url.trim(), display_order: 0 }] : [],
      };

      await productService.createProduct(payload);
      toast.success('Artisan craft product created successfully!');
      setShowCreateModal(false);
      setNewProduct({
        name: '',
        category_id: categories[0]?.id || '',
        district_id: districts[0]?.id || '',
        price: '',
        stock: '',
        description: '',
        image_url: '',
        odop_product_name: '',
      });
      loadData();
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setCreating(false);
    }
  };

  const handleToggleStatus = async (product) => {
    const nextStatus = product.status === 'active' ? 'inactive' : 'active';
    try {
      await productService.updateProduct(product.id, { status: nextStatus });
      toast.success(`Product status updated to ${nextStatus}.`);
      setProducts(prods => prods.map(p => p.id === product.id ? { ...p, status: nextStatus } : p));
    } catch (err) {
      toast.error(getErrorMessage(err));
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
            <span className="breadcrumb__current">Manage Products</span>
          </nav>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 'var(--space-4)' }}>
            <div>
              <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-3xl)' }}>
                Your Artisan Catalog
              </h1>
              <p style={{ fontSize: 'var(--text-sm)', color: 'var(--color-text-secondary)', marginTop: 'var(--space-1)' }}>
                Manage your active ODOP listings, pricing, and workshop inventory
              </p>
            </div>
            <button
              type="button"
              id="add-product-btn"
              onClick={() => setShowCreateModal(true)}
              className="btn btn-primary"
            >
              + Add New Craft Product
            </button>
          </div>
        </div>
      </div>

      <div className="container" style={{ paddingBlock: 'var(--space-8)' }}>
        {products.length === 0 ? (
          <div className="empty-state" style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', paddingBlock: 'var(--space-16)' }}>
            <div className="empty-state__icon">🏺</div>
            <h2 className="empty-state__title">No products listed yet</h2>
            <p className="empty-state__desc">Begin sharing your district's heritage craft with buyers across the nation.</p>
            <button type="button" onClick={() => setShowCreateModal(true)} className="btn btn-primary btn-lg">
              Add Your First Craft Listing
            </button>
          </div>
        ) : (
          <div style={{ background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', fontSize: 'var(--text-sm)' }}>
              <thead>
                <tr style={{ background: 'var(--color-bg-alt)', borderBottom: '1px solid var(--color-border)', color: 'var(--color-text-muted)' }}>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>Craft Item</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>Category</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>Price</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>Inventory</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>Status</th>
                  <th style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600, textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {products.map(p => {
                  const img = getProductImageUrl(p);
                  return (
                    <tr key={p.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                      <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-4)' }}>
                          <div style={{ width: 50, height: 50, borderRadius: 'var(--radius-md)', overflow: 'hidden', background: 'var(--color-bg-alt)', flexShrink: 0 }}>
                            <img
                              src={img}
                              alt={p.name}
                              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                              onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = DEFAULT_PRODUCT_IMAGE;
                              }}
                            />
                          </div>
                          <div>
                            <Link to={`/products/${p.id}`} style={{ fontWeight: 600, color: 'var(--color-text-primary)', textDecoration: 'none' }}>
                              {p.name}
                            </Link>
                            <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)' }}>
                              District: {p.district?.name || 'Local District'}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)', color: 'var(--color-text-secondary)' }}>
                        {p.category?.name || 'Heritage Craft'}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)', fontWeight: 600 }}>
                        {formatCurrency(p.price)}
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                        <span style={{ color: p.stock > 0 ? 'var(--color-success)' : 'var(--color-error)' }}>
                          {p.stock > 0 ? `${p.stock} in stock` : 'Out of stock'}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)' }}>
                        <span className={`badge badge-${p.status === 'active' ? 'success' : 'neutral'}`}>
                          {p.status}
                        </span>
                      </td>
                      <td style={{ padding: 'var(--space-4) var(--space-6)', textAlign: 'right' }}>
                        <button
                          type="button"
                          onClick={() => handleToggleStatus(p)}
                          className="btn btn-outline btn-sm"
                        >
                          {p.status === 'active' ? 'Deactivate' : 'Activate'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Create Product Modal */}
      {showCreateModal && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', zIndex: 1000,
          display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-4)',
        }}>
          <div style={{
            background: 'var(--color-surface)', borderRadius: 'var(--radius-2xl)', maxWidth: 600, width: '100%',
            padding: 'var(--space-8)', border: '1px solid var(--color-border)', boxShadow: 'var(--shadow-xl)',
            maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 400, fontSize: 'var(--text-2xl)', marginBottom: 'var(--space-4)' }}>
              Add New ODOP Heritage Craft
            </h2>

            <form onSubmit={handleCreateProduct}>
              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="label-text">Product Name <span style={{ color: 'var(--color-error)' }}>*</span></label>
                <input
                  type="text"
                  className="input"
                  placeholder="e.g. Handwoven Chanderi Zari Dupatta"
                  value={newProduct.name}
                  onChange={e => setNewProduct(p => ({ ...p, name: e.target.value }))}
                  required
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="label-text">Category <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <select
                    className="input"
                    value={newProduct.category_id}
                    onChange={e => setNewProduct(p => ({ ...p, category_id: e.target.value }))}
                    required
                  >
                    {categories.map(c => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>

                <div className="form-group">
                  <label className="label-text">ODOP District</label>
                  <select
                    className="input"
                    value={newProduct.district_id}
                    onChange={e => setNewProduct(p => ({ ...p, district_id: e.target.value }))}
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>{d.name} ({d.state})</option>
                    ))}
                  </select>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--space-4)', marginBottom: 'var(--space-4)' }}>
                <div className="form-group">
                  <label className="label-text">Price (₹) <span style={{ color: 'var(--color-error)' }}>*</span></label>
                  <input
                    type="number"
                    min="1"
                    className="input"
                    placeholder="2499"
                    value={newProduct.price}
                    onChange={e => setNewProduct(p => ({ ...p, price: e.target.value }))}
                    required
                  />
                </div>

                <div className="form-group">
                  <label className="label-text">Inventory Stock</label>
                  <input
                    type="number"
                    min="0"
                    className="input"
                    placeholder="10"
                    value={newProduct.stock}
                    onChange={e => setNewProduct(p => ({ ...p, stock: e.target.value }))}
                  />
                </div>
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                <label className="label-text">Product Image URL</label>
                <input
                  type="url"
                  className="input"
                  placeholder="https://images.unsplash.com/photo-..."
                  value={newProduct.image_url}
                  onChange={e => setNewProduct(p => ({ ...p, image_url: e.target.value }))}
                />
              </div>

              <div className="form-group" style={{ marginBottom: 'var(--space-6)' }}>
                <label className="label-text">Craft Heritage & Technique Description</label>
                <textarea
                  className="input input-square"
                  rows={4}
                  placeholder="Describe the artisan technique, material sourcing, GI tag details, and care instructions…"
                  value={newProduct.description}
                  onChange={e => setNewProduct(p => ({ ...p, description: e.target.value }))}
                />
              </div>

              <div style={{ display: 'flex', gap: 'var(--space-3)', justifyContent: 'flex-end' }}>
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="btn btn-ghost"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="btn btn-primary"
                >
                  {creating ? 'Publishing…' : 'Publish Craft Product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
