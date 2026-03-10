import { useState } from 'react';
import { Link } from 'react-router-dom';
import { SUNNAH_CATEGORIES } from '../../utils/sunnahData';
import './Sunnatlar.css';

function getSunnahCheckKey(categoryId, idx) {
  return `${categoryId}_${idx}`;
}

export default function Sunnatlar() {
  const [checks, setChecks] = useState(() => {
    try {
      const current = JSON.parse(localStorage.getItem('rmd_sunn_checks') || '{}');
      if (Object.keys(current).length) {
        return current;
      }

      // keep old progress if user used sunnat checks in old LastTenDays page
      return JSON.parse(localStorage.getItem('rmd_lt_sunn') || '{}');
    } catch {
      return {};
    }
  });

  const toggle = (key) => {
    setChecks((prev) => {
      const next = { ...prev, [key]: !prev[key] };
      localStorage.setItem('rmd_sunn_checks', JSON.stringify(next));
      return next;
    });
  };

  const totalAll = SUNNAH_CATEGORIES.reduce((sum, cat) => sum + cat.items.length, 0);
  const doneAll = SUNNAH_CATEGORIES.reduce(
    (sum, cat) =>
      sum +
      cat.items.filter((_, idx) => checks[getSunnahCheckKey(cat.id, idx)]).length,
    0,
  );
  const overallPct = totalAll ? Math.round((doneAll / totalAll) * 100) : 0;

  return (
    <div className="sunnah-page">
      <section className="sunnah-hero">
        <div className="sunnah-hero-head">
          <h1>Sunnatlar</h1>
          <p>Payg&apos;ambarimizning kundalik amallarini tartibli tarzda bajaring.</p>
        </div>
        <div className="sunnah-hero-stats">
          <div className="sunnah-stat">
            <span className="sunnah-stat-value">{doneAll}</span>
            <span className="sunnah-stat-label">Bajarilgan</span>
          </div>
          <div className="sunnah-stat">
            <span className="sunnah-stat-value">{totalAll - doneAll}</span>
            <span className="sunnah-stat-label">Qolgan</span>
          </div>
          <div className="sunnah-stat">
            <span className="sunnah-stat-value">{overallPct}%</span>
            <span className="sunnah-stat-label">Umumiy</span>
          </div>
        </div>
        <Link to="/last-ten" className="sunnah-back-link">
          ← 10 kunlik sahifaga qaytish
        </Link>
      </section>

      <section className="sunnah-grid">
        {SUNNAH_CATEGORIES.map((cat) => {
          const total = cat.items.length;
          const done = cat.items.filter((_, idx) => checks[getSunnahCheckKey(cat.id, idx)]).length;
          const pct = total ? Math.round((done / total) * 100) : 0;

          return (
            <article key={cat.id} className="sunnah-card">
              <div className="sunnah-card-head">
                <span className="sunnah-card-icon">{cat.icon}</span>
                <div>
                  <h2>{cat.title}</h2>
                  <p>{done}/{total} bajarildi</p>
                </div>
              </div>

              <div className="sunnah-progress">
                <div className="sunnah-progress-fill" style={{ width: `${pct}%` }} />
              </div>

              <div className="sunnah-items">
                {cat.items.map((item, idx) => {
                  const key = getSunnahCheckKey(cat.id, idx);
                  const doneItem = !!checks[key];
                  return (
                    <button
                      key={key}
                      type="button"
                      className={`sunnah-item${doneItem ? ' done' : ''}`}
                      onClick={() => toggle(key)}
                    >
                      <span className={`sunnah-check${doneItem ? ' done' : ''}`}>{doneItem ? 'v' : ''}</span>
                      <span>{item}</span>
                    </button>
                  );
                })}
              </div>
            </article>
          );
        })}
      </section>
    </div>
  );
}
