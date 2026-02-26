import { useEffect } from 'react';
import './QuranHifz.css';

export default function QuranHifz() {
  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow;
    const prevHtmlOverflow = document.documentElement.style.overflow;

    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = prevBodyOverflow;
      document.documentElement.style.overflow = prevHtmlOverflow;
    };
  }, []);

  return (
    <div className="quran-hifz-page hifz-coming-page">
      <div className="hifz-coming-overlay">
        <div className="hifz-coming-card card">
          <span className="hifz-coming-badge">Quran Hifz</span>
          <h2>Coming Soon</h2>
          <p>Bu bo‘lim hozir qayta ishlanmoqda. Tez orada yangi formatda ishga tushadi.</p>
        </div>
      </div>
    </div>
  );
}
