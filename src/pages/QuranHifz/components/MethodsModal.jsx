const METHODS = [
  {
    id: 'takror',
    icon: '🔁',
    title: 'Takror - Repetition',
    desc: 'Surahni 3-5 marta tinglang, har oyatni 7 marta baland ovozda takrorlang.',
    best: 'Qisqa surahlar',
    level: 'Oson',
  },
  {
    id: 'silsila',
    icon: '🔗',
    title: 'Silsila - Chain Method',
    desc: '1-oyat -> 2-oyat, so\'ng 1+2. Har yangi oyatni boshlanganidan ulang.',
    best: 'O\'rta surahlar',
    level: 'O\'rta',
  },
  {
    id: 'audio',
    icon: '🎧',
    title: 'Audio Immersion',
    desc: 'Sekin qiroatni takroriy tinglang (Husary tavsiya). 10 tinglashdan so\'ng yoddan o\'qing.',
    best: 'Eshitish orqali',
    level: 'O\'rta',
  },
  {
    id: 'kitabat',
    icon: '✍️',
    title: 'Kitobat - Yozma usul',
    desc: 'Oyatni qo\'l bilan 3 marta yozing, so\'ng yopib yoddan yozing.',
    best: 'Vizual o\'quvchilar',
    level: 'Oson',
  },
  {
    id: 'tafsir',
    icon: '📖',
    title: 'Tafsir-First',
    desc: 'Avval ma\'nosini o\'qing, so\'ng hikoya va ma\'no asosida yodlang.',
    best: 'Uzun surahlar',
    level: 'Qiyin',
  },
  {
    id: 'sabaq',
    icon: '🧭',
    title: 'Sabaq-Sabqi-Manzil',
    desc: 'Sabaq - yangi qism, Sabqi - kechagi qism, Manzil - 7 kunlik takror.',
    best: 'Jiddiy hifz',
    level: 'Qiyin',
  },
  {
    id: 'spaced',
    icon: '🗓️',
    title: 'Spaced Repetition',
    desc: '1, 2, 4, 8, 16-kunlarda takror. Uzoq muddatli mustahkamlash uchun.',
    best: 'Katta hifz',
    level: 'O\'rta',
  },
];

export default function MethodsModal({ open, onClose }) {
  if (!open) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="methods-modal card" onClick={e => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2>📖 Yodlash usullari</h2>
            <p>Har bir usulni sinab, o\'zingizga mosini tanlang.</p>
          </div>
          <button className="btn btn-ghost" onClick={onClose}>Yopish</button>
        </div>

        <div className="methods-grid">
          {METHODS.map(method => (
            <div key={method.id} className="method-card card">
              <div className="method-icon">{method.icon}</div>
              <div className="method-title">{method.title}</div>
              <p className="method-desc">{method.desc}</p>
              <div className="method-meta">
                <span className="badge badge-gold">{method.best}</span>
                <span className="badge badge-accent">{method.level}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

