import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LAST_TEN_HADITHS } from '../../utils/lastTenHadithsData';
import './Hadislar.css';

export default function Hadislar() {
  const [activeTag, setActiveTag] = useState('Hammasi');
  const [expandedId, setExpandedId] = useState(null);

  const tags = ['Hammasi', ...Array.from(new Set(LAST_TEN_HADITHS.map((item) => item.tag)))];
  const filtered =
    activeTag === 'Hammasi'
      ? LAST_TEN_HADITHS
      : LAST_TEN_HADITHS.filter((item) => item.tag === activeTag);

  return (
    <div className="hadith-page">
      <section className="hadith-hero">
        <div>
          <h1>Hadis va oyatlar</h1>
          <p>Qadr kechasi va oxirgi 10 kun mavzusidagi hadislarni tartibli o&apos;qing.</p>
        </div>
        <div className="hadith-hero-meta">
          <span>{filtered.length} ta ko&apos;rinmoqda</span>
          <span>Jami: {LAST_TEN_HADITHS.length} ta</span>
        </div>
        <Link to="/last-ten" className="hadith-back">
          ← 10 kunlik sahifaga qaytish
        </Link>
      </section>

      <section className="hadith-section">
        <div className="hadith-tags">
          {tags.map((tag) => (
            <button
              key={tag}
              type="button"
              className={`hadith-tag${activeTag === tag ? ' active' : ''}`}
              onClick={() => setActiveTag(tag)}
            >
              {tag}
            </button>
          ))}
        </div>

        <div className="hadith-grid">
          {filtered.map((item) => (
            <button
              key={item.id}
              type="button"
              className={`hadith-card${expandedId === item.id ? ' expanded' : ''}`}
              onClick={() => setExpandedId(expandedId === item.id ? null : item.id)}
            >
              <div className="hadith-card-top">
                <span className="hadith-card-tag">{item.tag}</span>
                <span className="hadith-card-arrow">{expandedId === item.id ? '▲' : '▼'}</span>
              </div>
              <p className="hadith-arabic">{item.arabic}</p>
              {expandedId === item.id && <p className="hadith-uz">{item.uzbek}</p>}
              <span className="hadith-source">{item.source}</span>
            </button>
          ))}
        </div>
      </section>
    </div>
  );
}
