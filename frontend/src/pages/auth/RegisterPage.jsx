// src/pages/auth/RegisterPage.jsx
// Register page with buyer/seller role selection and full backend integration

import { useState, useEffect } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { productService } from '../../services/productService';
import { getErrorMessage, isValidEmail, isValidPhone } from '../../utils';

export default function RegisterPage() {
  const { register } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const initialRole = searchParams.get('role') || 'buyer';

  const [form, setForm] = useState({
    name: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    role: initialRole,
    business_name: '',
    district_id: '',
    address: '',
    state: 'Uttar Pradesh',
  });
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  // Load active districts for seller registration dropdown
  useEffect(() => {
    productService.getDistricts()
      .then(res => {
        const list = res?.data || [];
        setDistricts(list);
        if (list.length > 0 && !form.district_id) {
          setForm(f => ({ ...f, district_id: list[0].id }));
        }
      })
      .catch(console.error);
  }, []);

  const validate = () => {
    const e = {};
    if (!form.name.trim()) e.name = 'Full name is required';
    if (!isValidEmail(form.email)) e.email = 'Enter a valid email address';
    if (form.phone && !isValidPhone(form.phone)) e.phone = 'Enter a valid 10-digit phone number';
    if (form.password.length < 8) e.password = 'Password must be at least 8 characters';
    if (form.password !== form.confirmPassword) e.confirmPassword = 'Passwords do not match';

    if (form.role === 'seller') {
      if (!form.business_name.trim()) e.business_name = 'Business name is required';
      if (!form.district_id) e.district_id = 'Select your registered ODOP district';
      if (!form.address.trim()) e.address = 'Workshop or business address is required';
    }

    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) {
      setErrors(errs);
      return;
    }
    setErrors({});

    try {
      setLoading(true);
      const payload = {
        name: form.name.trim(),
        email: form.email.trim(),
        phone: form.phone ? form.phone.trim() : undefined,
        password: form.password,
        role: form.role,
      };

      if (form.role === 'seller') {
        payload.business_name = form.business_name.trim();
        payload.district_id = form.district_id;
        payload.address = form.address.trim();
        payload.state = form.state || 'Uttar Pradesh';
      }

      const result = await register(payload);

      if (result.success) {
        toast.success(`Welcome to ODOP Nexus, ${result.data?.user?.name || form.name}!`);
        if (form.role === 'seller') {
          navigate('/seller/dashboard');
        } else {
          navigate('/');
        }
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  const field = (id, label, type, placeholder, key, required = true) => (
    <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
      <label htmlFor={id} className="label-text">
        {label}
        {required && <span style={{ color: 'var(--color-error)' }}> *</span>}
      </label>
      <div style={{ position: 'relative' }}>
        <input
          id={id}
          type={key === 'password' || key === 'confirmPassword' ? (showPassword ? 'text' : 'password') : type}
          className={`input${errors[key] ? ' input--error' : ''}`}
          placeholder={placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
          style={{ borderRadius: 'var(--radius-lg)', height: 46 }}
          autoComplete={key === 'email' ? 'email' : key === 'password' ? 'new-password' : 'off'}
        />
        {(key === 'password' || key === 'confirmPassword') && (
          <button
            type="button"
            onClick={() => setShowPassword(v => !v)}
            style={{
              position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
              background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-text-muted)',
            }}
            aria-label="Toggle password visibility"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              {showPassword
                ? <><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></>
                : <><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></>
              }
            </svg>
          </button>
        )}
      </div>
      {errors[key] && <p className="form-error">{errors[key]}</p>}
    </div>
  );

  return (
    <div className="auth-page" style={{ minHeight: '100vh', display: 'flex', alignItems: 'stretch' }}>
      {/* Left decorative panel */}
      <div className="auth-page__panel" style={{
        flex: '0 0 38%',
        background: 'linear-gradient(160deg, #1c1c1a 0%, #3d5a4e 100%)',
        display: 'flex',
        flexDirection: 'column',
        padding: 'var(--space-10)',
      }}>
        <Link to="/" style={{ fontFamily: 'var(--font-display)', color: 'white', textDecoration: 'none', fontSize: '1.4rem', fontWeight: 700, letterSpacing: '-0.04em', marginBottom: 'auto' }}>
          ODOP<span style={{ fontWeight: 300, opacity: 0.7 }}>•Nexus</span>
        </Link>

        <div style={{ paddingBlock: 'var(--space-12)' }}>
          <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 200, fontSize: '2.5rem', color: 'white', lineHeight: 1.15, marginBottom: 'var(--space-5)' }}>
            Join thousands of artisans & shoppers.
          </h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-4)', marginTop: 'var(--space-8)' }}>
            {[
              { icon: '✓', text: 'Verified ODOP district artisan registry' },
              { icon: '✓', text: 'Authentic GI-tagged craft discovery' },
              { icon: '✓', text: 'Direct artisan-to-buyer transactions' },
              { icon: '✓', text: 'Secure Razorpay escrow payment' },
            ].map(item => (
              <div key={item.text} style={{ display: 'flex', alignItems: 'center', gap: 'var(--space-3)' }}>
                <span style={{
                  width: 24, height: 24, borderRadius: '50%',
                  background: 'rgba(255,255,255,0.15)',
                  color: 'white',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '0.75rem', fontWeight: 700, flexShrink: 0,
                }}>{item.icon}</span>
                <span style={{ color: 'rgba(255,255,255,0.7)', fontSize: 'var(--text-sm)' }}>{item.text}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right form */}
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 'var(--space-8)', background: 'var(--color-surface)', overflowY: 'auto' }}>
        <div style={{ width: '100%', maxWidth: 480, paddingBlock: 'var(--space-6)' }}>
          <h1 style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 'var(--text-4xl)', letterSpacing: '-0.02em', marginBottom: 'var(--space-2)' }}>
            Create account
          </h1>
          <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-6)' }}>
            Already have one?{' '}
            <Link to="/login" style={{ color: 'var(--color-accent)', fontWeight: 500, textDecoration: 'none' }}>Sign in</Link>
          </p>

          {/* Role Toggle */}
          <div className="tabs" style={{ marginBottom: 'var(--space-6)' }}>
            <button
              type="button"
              id="role-buyer-btn"
              className={`tab${form.role === 'buyer' ? ' active' : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'buyer' }))}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🛍 Shop as Buyer
            </button>
            <button
              type="button"
              id="role-seller-btn"
              className={`tab${form.role === 'seller' ? ' active' : ''}`}
              onClick={() => setForm(f => ({ ...f, role: 'seller' }))}
              style={{ flex: 1, justifyContent: 'center' }}
            >
              🏺 Sell as Artisan
            </button>
          </div>

          <form id="register-form" onSubmit={handleSubmit} noValidate>
            {field('reg-name', 'Full name', 'text', 'Your full name', 'name')}
            {field('reg-email', 'Email address', 'email', 'you@example.com', 'email')}
            {field('reg-phone', 'Phone number', 'tel', '10-digit mobile number', 'phone', false)}

            {/* Seller specific fields */}
            {form.role === 'seller' && (
              <div style={{ padding: 'var(--space-4)', background: 'var(--color-bg-alt)', borderRadius: 'var(--radius-xl)', marginBottom: 'var(--space-4)', border: '1px solid var(--color-border)' }}>
                <p style={{ fontSize: 'var(--text-xs)', fontWeight: 600, color: 'var(--color-accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 'var(--space-3)' }}>
                  Artisan / Seller Business Details
                </p>

                {field('reg-biz', 'Business / Studio Name', 'text', 'e.g. Varanasi Silk Weavers Co-op', 'business_name')}

                <div className="form-group" style={{ marginBottom: 'var(--space-4)' }}>
                  <label htmlFor="reg-district" className="label-text">
                    Registered ODOP District <span style={{ color: 'var(--color-error)' }}>*</span>
                  </label>
                  <select
                    id="reg-district"
                    className={`input${errors.district_id ? ' input--error' : ''}`}
                    value={form.district_id}
                    onChange={e => setForm(f => ({ ...f, district_id: e.target.value }))}
                    style={{ borderRadius: 'var(--radius-lg)', height: 46 }}
                  >
                    {districts.map(d => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.state})
                      </option>
                    ))}
                  </select>
                  {errors.district_id && <p className="form-error">{errors.district_id}</p>}
                </div>

                {field('reg-address', 'Workshop / Store Address', 'text', 'Complete street address', 'address')}
                {field('reg-state', 'State', 'text', 'State', 'state')}
              </div>
            )}

            {field('reg-password', 'Password', 'password', 'Min. 8 characters', 'password')}
            {field('reg-confirm', 'Confirm password', 'password', 'Repeat your password', 'confirmPassword')}

            <button
              type="submit"
              id="register-submit-btn"
              className="btn btn-primary btn-lg"
              disabled={loading}
              style={{ width: '100%', justifyContent: 'center', height: 50, marginTop: 'var(--space-2)' }}
            >
              {loading ? (
                <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} />
              ) : (
                `Create ${form.role === 'seller' ? 'Artisan Seller' : 'Buyer'} Account`
              )}
            </button>
          </form>

          <p style={{ fontSize: 'var(--text-xs)', color: 'var(--color-text-muted)', textAlign: 'center', marginTop: 'var(--space-5)', lineHeight: 1.5 }}>
            By creating an account you agree to our{' '}
            <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>Terms of Service</a>{' '}
            and{' '}
            <a href="#" style={{ color: 'var(--color-accent)', textDecoration: 'none' }}>ODOP Artisan Guidelines</a>.
          </p>
        </div>
      </div>

      <style>{`
        .input--error { border-color: var(--color-error) !important; }
        @media (max-width: 768px) { .auth-page__panel { display: none; } }
      `}</style>
    </div>
  );
}
