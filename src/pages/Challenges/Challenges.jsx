import { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { PRESET_CHALLENGES } from '../../utils/constants';
import './Challenges.css';

const DIFFICULTIES = { Oson: 'badge-success', "O'rta": 'badge-gold', Qiyin: 'badge-accent' };

export default function Challenges() {
  const { user, updateUser } = useAuth();
  const [tab, setTab] = useState('active');
  const [modal, setModal] = useState(false);
  const [custom, setCustom] = useState({ title: '', description: '', icon: '⭐', frequency: 'Kunlik', duration: 30 });

  const activeIds = (user?.activeChallenges || []).map(c => c.id);

  const join = (challenge) => {
    if (activeIds.includes(challenge.id)) return;
    updateUser({ activeChallenges: [...(user.activeChallenges || []), challenge] });
  };

  const leave = (id) => {
    updateUser({ activeChallenges: (user.activeChallenges || []).filter(c => c.id !== id) });
  };

  const addCustom = () => {
    if (!custom.title) return;
    const nextSeq = (user?.customChallengeSeq || 0) + 1;
    const ch = { ...custom, id: `custom_${nextSeq}`, xpPerTask: 20, users: 1 };
    updateUser({
      activeChallenges: [...(user.activeChallenges || []), ch],
      customChallengeSeq: nextSeq,
    });
    setModal(false);
    setCustom({ title: '', description: '', icon: '⭐', frequency: 'Kunlik', duration: 30 });
    setTab('active');
  };

  const ICONS = ['⭐', '📚', '🕌', '🤲', '🌙', '📿', '💫', '🕊️', '🌿', '🫀'];

  return (
    <div className="page-wrapper">
      <div className="is-tabs">
        <button className={`is-tab ${tab === 'active' ? 'active' : ''}`} onClick={() => setTab('active')}>
          ⚡ Faol ({activeIds.length})
        </button>
        <button className={`is-tab ${tab === 'discover' ? 'active' : ''}`} onClick={() => setTab('discover')}>
          🔍 Kashf qilish
        </button>
      </div>

      {tab === 'active' && (
        <div className="ch-active-list fade-in">
          {(user?.activeChallenges || []).length === 0 ? (
            <div className="card ch-empty">
              <span className="empty-icon">⚡</span>
              <p>Hali faol topshiriqlar yo'q</p>
              <button className="btn btn-primary" onClick={() => setTab('discover')}>
                Topshiriq qo'shish
              </button>
            </div>
          ) : (
            (user.activeChallenges || []).map(ch => {
              const today = new Date().toISOString().slice(0, 10);
              const todayCount = user?.completedDays?.[today]?.filter(id => id === ch.id).length || 0;
              const totalDone = Object.values(user?.completedDays || {})
                .flat().filter(id => id === ch.id).length;

              return (
                <div key={ch.id} className="ch-active-item card">
                  <div className="ch-active-top">
                    <span className="ch-icon">{ch.icon}</span>
                    <div className="ch-info">
                      <div className="ch-title">{ch.title}</div>
                      <div className="ch-freq">{ch.frequency} - {ch.xpPerTask} XP</div>
                    </div>
                    <button className="btn btn-ghost ch-leave" onClick={() => leave(ch.id)}>
                      Tark etish
                    </button>
                  </div>
                  <div className="ch-stats-row">
                    <span className="badge badge-success">✅ Jami: {totalDone}</span>
                    <span className="badge badge-gold">⚡ {totalDone * ch.xpPerTask} XP</span>
                    {todayCount > 0 && <span className="badge badge-accent">Bugun bajarildi</span>}
                  </div>
                  <div className="progress-bar">
                    <div className="progress-bar-fill" style={{ width: `${Math.min((totalDone / 30) * 100, 100)}%` }} />
                  </div>
                  <span className="ch-progress-label">{totalDone}/30 kun</span>
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'discover' && (
        <div className="fade-in">
          <div className="ch-preset-grid">
            {PRESET_CHALLENGES.map(ch => {
              const joined = activeIds.includes(ch.id);
              return (
                <div key={ch.id} className={`ch-preset-card card ${joined ? 'joined' : ''}`}>
                  <div className="ch-preset-top">
                    <span className="ch-icon">{ch.icon}</span>
                    <div>
                      <div className="ch-title">{ch.title}</div>
                      <div className="ch-preset-users">👥 {ch.users.toLocaleString()} ishtirokchi</div>
                    </div>
                  </div>
                  <p className="ch-desc">{ch.description}</p>
                  <div className="ch-preset-meta">
                    <span className={`badge ${DIFFICULTIES[ch.difficulty]}`}>{ch.difficulty}</span>
                    <span className="badge badge-gold">+{ch.xpPerTask} XP</span>
                    <span className="badge badge-accent">{ch.frequency}</span>
                  </div>
                  <button
                    className={`btn ${joined ? 'btn-outline' : 'btn-primary'} ch-join-btn`}
                    onClick={() => joined ? leave(ch.id) : join(ch)}
                  >
                    {joined ? "✓ Qo'shilgansiz" : "Qo'shilish"}
                  </button>
                </div>
              );
            })}

            {/* Custom challenge card */}
            <div className="ch-preset-card ch-custom-card card" onClick={() => setModal(true)}>
              <span className="custom-plus">+</span>
              <div className="ch-title">O'z topshirig'ingizni yarating</div>
              <p className="ch-desc">Shaxsiy ibodat rejangizni qo'shing</p>
            </div>
          </div>
        </div>
      )}

      {/* Custom Modal */}
      {modal && (
        <div className="modal-overlay" onClick={() => setModal(false)}>
          <div className="modal-box card" onClick={e => e.stopPropagation()}>
            <h3 className="modal-title">Yangi topshiriq</h3>
            <div className="form-group">
              <label>Nomi</label>
              <input className="input-field" placeholder="Topshiriq nomi" value={custom.title}
                onChange={e => setCustom(p => ({ ...p, title: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Tavsif</label>
              <input className="input-field" placeholder="Qisqacha tavsif" value={custom.description}
                onChange={e => setCustom(p => ({ ...p, description: e.target.value }))} />
            </div>
            <div className="form-group">
              <label>Icon</label>
              <div className="icon-picker">
                {ICONS.map(ic => (
                  <button key={ic} className={`icon-opt ${custom.icon === ic ? 'selected' : ''}`}
                    onClick={() => setCustom(p => ({ ...p, icon: ic }))}>
                    {ic}
                  </button>
                ))}
              </div>
            </div>
            <div className="form-group">
              <label>Chastota</label>
              <select className="input-field" value={custom.frequency}
                onChange={e => setCustom(p => ({ ...p, frequency: e.target.value }))}>
                <option>Kunlik</option>
                <option>Haftalik</option>
                <option>Har 3 kunda</option>
              </select>
            </div>
            <div className="modal-actions">
              <button className="btn btn-ghost" onClick={() => setModal(false)}>Bekor</button>
              <button className="btn btn-primary" onClick={addCustom} disabled={!custom.title}>
                Qo'shish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

