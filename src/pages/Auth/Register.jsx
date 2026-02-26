import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { CITIES } from '../../utils/constants';
import { IconMoon, IconWarning } from '../../components/Icons/RamadanIcons';
import './Auth.css';

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', city: 'Toshkent' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const { register } = useAuth();
  const navigate = useNavigate();

  const handle = (e) => setForm(f => ({ ...f, [e.target.name]: e.target.value }));

  const submit = async (e) => {
    e.preventDefault();
    setError('');
    if (form.password.length < 6) { setError("Parol kamida 6 ta belgi bo'lishi kerak"); return; }
    setLoading(true);
    const result = await register(form.name, form.email, form.password, form.city);
    setLoading(false);
    if (result === true) {
      setSuccess(true);
      setTimeout(() => navigate('/dashboard'), 2000);
    } else if (result?.error === 'email_taken') {
      setError("Bu email allaqachon ro'yxatdan o'tgan");
    } else {
      setError("Ro'yxatdan o'tishda xato. Qaytadan urinib ko'ring.");
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card welcome-card fade-in">
          <div className="welcome-moon">🌙</div>
          <h2>Assalomu alaykum, {form.name}!</h2>
          <p>Ramadan platformasiga xush kelibsiz.</p>
          <p className="welcome-sub">Dashboard yuklanmoqda...</p>
        </div>
      </div>
    );
  }

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
          <h1>Ro'yxatdan o'ting</h1>
          <p>Ramazon sayohatingizni boshlang</p>
        </div>

        {error && (
          <div className="auth-error">
            <IconWarning size={16} /> {error}
          </div>
        )}

        <form onSubmit={submit} className="auth-form">
          <div className="form-group">
            <label>Ismingiz</label>
            <input className="input-field" type="text" name="name" placeholder="Abdulloh" value={form.name} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Email</label>
            <input className="input-field" type="email" name="email" placeholder="email@example.com" value={form.email} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Parol</label>
            <input className="input-field" type="password" name="password" placeholder="••••••••" value={form.password} onChange={handle} required />
          </div>
          <div className="form-group">
            <label>Shahringiz</label>
            <select className="input-field" name="city" value={form.city} onChange={handle}>
              {CITIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>

          <button type="submit" className="btn btn-primary auth-submit" disabled={loading}>
            {loading ? <span className="spinner" /> : <IconMoon size={18} color="white" />}
            Ro'yxatdan o'tish
          </button>
        </form>

        <div className="auth-footer">
          Hisobingiz bormi? <Link to="/login">Kiring</Link>
        </div>
      </div>
    </div>
  );
}
