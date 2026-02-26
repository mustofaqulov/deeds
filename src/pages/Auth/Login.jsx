import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { IconMoon, IconWarning } from '../../components/Icons/RamadanIcons';
import './Auth.css';

export default function Login() {
  const [form, setForm] = useState({ email: '', password: '', remember: false });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.type === 'checkbox' ? e.target.checked : e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    const ok = await login(form.email, form.password);
    setLoading(false);
    if (ok) navigate('/dashboard');
    else setError("Email yoki parol noto'g'ri");
  };

  return (
    <div className="auth-page">
      <div className="auth-bg-decor">
        <span className="auth-moon">☪️</span>
        {[...Array(8)].map((_, i) => (
          <span key={i} className="auth-star" style={{ '--i': i }} />
        ))}
      </div>

      <div className="auth-card fade-in-up">
        <div className="auth-header">
          <h1>Xush kelibsiz</h1>
          <p>Hisobingizga kiring</p>
        </div>

        {error && (
          <div className="auth-error">
            <IconWarning size={16} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Email</label>
            <input
              className="input-field"
              type="email"
              name="email"
              placeholder="email@example.com"
              value={form.email}
              onChange={handle}
              required
            />
          </div>

          <div className="form-group">
            <label>Parol</label>
            <input
              className="input-field"
              type="password"
              name="password"
              placeholder="••••••••"
              value={form.password}
              onChange={handle}
              required
            />
          </div>

          <div className="form-row">
            <label className="checkbox-label">
              <input type="checkbox" name="remember" checked={form.remember} onChange={handle} />
              Meni eslab qol
            </label>
            <a href="#" className="forgot-link">Parolni unutdim?</a>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <IconMoon size={18} color="white" />}
            Kirish
          </button>
        </form>

        <div className="auth-footer">
          Hisob yo'qmi? <Link to="/register">Ro'yxatdan o'ting</Link>
        </div>
      </div>
    </div>
  );
}
