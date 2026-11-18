// src/pages/auth/LoginPage.jsx
// Clean Skanvi-style login page

import { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';
import { getErrorMessage } from '../../utils';

export default function LoginPage() {
  const { login } = useAuth();
  const toast = useToast();
  const navigate = useNavigate();
  const location = useLocation();

  const from = location.state?.from?.pathname || '/';

  const [form, setForm] = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [showPassword, setShowPassword] = useState(false);

  const validate = () => {
    const e = {};
    if (!form.email)    e.email    = 'Email is required';
    if (!form.password) e.password = 'Password is required';
    return e;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const errs = validate();
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});

    try {
      setLoading(true);
      const result = await login(form);
      if (result.success) {
        toast.success(`Welcome back, ${result.data.user.name}!`);
        navigate(from, { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-page__split">
        {/* Left decorative panel */}
        <div className="auth-page__panel">
          <div className="auth-page__panel-inner">
            <Link to="/" className="auth-page__logo">
              <span style={{ fontWeight: 700, fontSize: '1.5rem', letterSpacing: '-0.04em' }}>ODOP</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', margin: '0 4px' }}>•</span>
              <span style={{ fontWeight: 300, fontSize: '1.5rem', letterSpacing: '-0.02em', opacity: 0.8 }}>Nexus</span>
            </Link>
            <div className="auth-page__panel-content">
              <h2 style={{ fontFamily: 'var(--font-display)', fontWeight: 200, fontSize: '3rem', color: 'white', lineHeight: 1.1, marginBottom: '1.5rem' }}>
                India's finest crafts,<br />at your doorstep.
              </h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', fontSize: '1.05rem', lineHeight: 1.65 }}>
                Thousands of authentic ODOP products from artisans across every district.
              </p>
            </div>
            <div className="auth-page__panel-stats">
              {[
                { n: '300+', l: 'Districts' },
                { n: '5000+', l: 'Products' },
                { n: '2000+', l: 'Artisans' },
              ].map(s => (
                <div key={s.l}>
                  <p style={{ fontSize: '1.5rem', fontWeight: 300, color: 'white' }}>{s.n}</p>
                  <p style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.45)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{s.l}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right form panel */}
        <div className="auth-page__form-wrap">
          <div className="auth-page__form-inner">
            <h1 style={{
              fontFamily: 'var(--font-display)',
              fontWeight: 300,
              fontSize: 'var(--text-4xl)',
              letterSpacing: '-0.02em',
              marginBottom: 'var(--space-2)',
            }}>
              Welcome back
            </h1>
            <p style={{ color: 'var(--color-text-muted)', marginBottom: 'var(--space-10)' }}>
              Don't have an account?{' '}
              <Link to="/register" style={{ color: 'var(--color-accent)', fontWeight: 500, textDecoration: 'none' }}>
                Sign up
              </Link>
            </p>

            <form onSubmit={handleSubmit} id="login-form" noValidate>
              {/* Email */}
              <div className="form-group" style={{ marginBottom: 'var(--space-5)' }}>
                <label htmlFor="login-email" className="label-text">Email address</label>
                <input
                  id="login-email"
                  type="email"
                  className={`input${errors.email ? ' input--error' : ''}`}
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  autoComplete="email"
                  autoFocus
                  style={{ borderRadius: 'var(--radius-lg)', height: 48 }}
                />
                {errors.email && <p className="form-error">{errors.email}</p>}
              </div>

              {/* Password */}
              <div className="form-group" style={{ marginBottom: 'var(--space-8)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 'var(--space-2)' }}>
                  <label htmlFor="login-password" className="label-text" style={{ margin: 0 }}>Password</label>
                  <a href="#" style={{ fontSize: 'var(--text-xs)', color: 'var(--color-accent)', textDecoration: 'none' }}>
                    Forgot password?
                  </a>
                </div>
                <div style={{ position: 'relative' }}>
                  <input
                    id="login-password"
                    type={showPassword ? 'text' : 'password'}
                    className={`input${errors.password ? ' input--error' : ''}`}
                    placeholder="Your password"
                    value={form.password}
                    onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                    autoComplete="current-password"
                    style={{ borderRadius: 'var(--radius-lg)', height: 48, paddingRight: 48 }}
                  />
                  <button
                    type="button"
                    id="toggle-password"
                    onClick={() => setShowPassword(v => !v)}
                    style={{
                      position: 'absolute', right: 14, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer',
                      color: 'var(--color-text-muted)',
                    }}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/>
                        <line x1="1" y1="1" x2="23" y2="23"/>
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/>
                        <circle cx="12" cy="12" r="3"/>
                      </svg>
                    )}
                  </button>
                </div>
                {errors.password && <p className="form-error">{errors.password}</p>}
              </div>

              <button
                type="submit"
                id="login-submit-btn"
                className="btn btn-primary btn-lg"
                disabled={loading}
                style={{ width: '100%', justifyContent: 'center', height: 52 }}
              >
                {loading ? <span className="spinner" style={{ borderColor: 'rgba(255,255,255,0.3)', borderTopColor: 'white' }} /> : 'Sign in'}
              </button>
            </form>

            <p style={{ textAlign: 'center', marginTop: 'var(--space-8)', fontSize: 'var(--text-sm)', color: 'var(--color-text-muted)' }}>
              Want to sell your products?{' '}
              <Link to="/register?role=seller" style={{ color: 'var(--color-accent)', fontWeight: 500, textDecoration: 'none' }}>
                Become a seller
              </Link>
            </p>
          </div>
        </div>
      </div>

      <style>{`
        .auth-page {
          min-height: 100vh;
          display: flex;
        }

        .auth-page__split {
          display: flex;
          flex: 1;
        }

        .auth-page__panel {
          flex: 0 0 42%;
          background: linear-gradient(135deg, #1c1c1a 0%, var(--color-accent) 100%);
          position: relative;
          display: flex;
          flex-direction: column;
          padding: var(--space-10);
        }

        .auth-page__panel-inner {
          display: flex;
          flex-direction: column;
          height: 100%;
        }

        .auth-page__logo {
          display: flex;
          align-items: center;
          font-family: var(--font-display);
          color: white;
          text-decoration: none;
          margin-bottom: auto;
        }

        .auth-page__panel-content {
          flex: 1;
          display: flex;
          flex-direction: column;
          justify-content: center;
          padding-block: var(--space-12);
        }

        .auth-page__panel-stats {
          display: flex;
          gap: var(--space-8);
          padding-top: var(--space-8);
          border-top: 1px solid rgba(255,255,255,0.15);
        }

        .auth-page__form-wrap {
          flex: 1;
          display: flex;
          align-items: center;
          justify-content: center;
          padding: var(--space-10);
          background: var(--color-surface);
        }

        .auth-page__form-inner {
          width: 100%;
          max-width: 440px;
        }

        .input--error {
          border-color: var(--color-error) !important;
        }

        @media (max-width: 768px) {
          .auth-page__panel { display: none; }
          .auth-page__form-wrap { padding: var(--space-6); }
        }
      `}</style>
    </div>
  );
}
