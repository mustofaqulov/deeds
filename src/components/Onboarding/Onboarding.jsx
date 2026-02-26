import { useState } from 'react';
import HeartWidget from '../Heart/HeartWidget';
import './Onboarding.css';

const STEPS = [
  {
    icon: '☪️',
    title: "Ramazon platformasiga xush kelibsiz!",
    desc: "Bu platforma sizga Ramazon oyida ibodatlaringizni kuzatish, o'sish va ruhiy yuksalish imkonini beradi.",
    visual: <div className="ob-moon-visual">🌙<span className="ob-stars">✨ ✨ ✨</span></div>,
  },
  {
    icon: '🫀',
    title: "Qalb (Heart) tizimi",
    desc: "Har bir topshiriq bajarganingizda qalbingiz yorishib boradi. Kunlik ibodat qilmasangiz, qalb nuri biroz kamayadi.",
    visual: <HeartWidget percent={65} />,
  },
  {
    icon: '⚡',
    title: "XP va Darajalar",
    desc: "Har topshiriq uchun XP yig'asiz. Murid → Tolib → Solik → Orif → Abdol → Qutb — ruhiy sayohatingiz bosqichlari.",
    visual: (
      <div className="ob-levels">
        {['Murid','Tolib','Solik','Orif','Abdol','Qutb'].map((l, i) => (
          <div key={l} className="ob-level-item" style={{ opacity: 0.3 + i * 0.14 }}>
            <span>{i + 1}</span> {l}
          </div>
        ))}
      </div>
    ),
  },
  {
    icon: '📿',
    title: "Topshiriqlar va Streak",
    desc: "Kunlik topshiriqlarni bajaring, streak toping! Har kuni izchil ibodat qilganingiz uchun bonus XP beriladi.",
    visual: (
      <div className="ob-streak-visual">
        {[1,2,3,4,5,6,7].map(d => (
          <div key={d} className={`ob-day ${d <= 5 ? 'done' : ''}`}>
            <span>{d <= 5 ? '🔥' : '○'}</span>
            <span>{d}-kun</span>
          </div>
        ))}
      </div>
    ),
  },
];

export default function Onboarding({ onDone }) {
  const [step, setStep] = useState(0);
  const current = STEPS[step];
  const isLast = step === STEPS.length - 1;

  return (
    <div className="ob-overlay fade-in">
      <div className="ob-card fade-in-up">
        <div className="ob-step-dots">
          {STEPS.map((_, i) => (
            <span key={i} className={`ob-dot ${i === step ? 'active' : i < step ? 'done' : ''}`} />
          ))}
        </div>

        <div className="ob-visual">{current.visual}</div>

        <div className="ob-icon">{current.icon}</div>
        <h2 className="ob-title">{current.title}</h2>
        <p className="ob-desc">{current.desc}</p>

        <div className="ob-actions">
          {step > 0 && (
            <button className="btn btn-ghost ob-back" onClick={() => setStep(s => s - 1)}>
              ← Orqaga
            </button>
          )}
          <button
            className="btn btn-primary ob-next"
            onClick={() => isLast ? onDone() : setStep(s => s + 1)}
          >
            {isLast ? "Boshlash 🌙" : "Keyingisi →"}
          </button>
        </div>

        <button className="ob-skip" onClick={onDone}>O'tkazib yuborish</button>
      </div>
    </div>
  );
}
