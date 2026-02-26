import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { apiResetProgress } from '../../lib/api';
import { useTheme } from '../../context/ThemeContext';
import { getLevelInfo, getInitials } from '../../utils/helpers';
import { CITIES } from '../../utils/constants';
import { ACHIEVEMENTS } from '../../utils/xpSystem';
import { PROFILE_PHOTOS, getProfilePhotoById } from '../../utils/profilePhotos';
import XPBar from '../../components/XPBar/XPBar';
import ProgressRing from '../../components/ProgressRing/ProgressRing';
import {
  IconHeart, IconFire, IconStar, IconCheckCircle,
  IconEdit, IconSettings, IconSun, IconMoon,
  IconRefresh, IconVolumeOn, IconVolumeOff, IconLogout,
} from '../../components/Icons/RamadanIcons';
import './Profile.css';

export default function Profile() {
  const { user, updateUser, logout } = useAuth();
  const { dark, mode, toggle, setAuto } = useTheme();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    city: user?.city || 'Toshkent',
    profilePhotoId: user?.profilePhotoId || '',
  });

  const { current } = getLevelInfo(user?.xp || 0);
  const totalCompleted = Object.values(user?.completedDays || {}).flat().length;
  const earnedSet = new Set(user?.achievements || []);
  const earnedCount = ACHIEVEMENTS.filter((item) => earnedSet.has(item.id)).length;
  const selectedPhoto = getProfilePhotoById(editing ? form.profilePhotoId : user?.profilePhotoId);

  const saveProfile = () => {
    updateUser({
      name: form.name,
      city: form.city,
      profilePhotoId: form.profilePhotoId || null,
    });
    setEditing(false);
  };

  const openEditor = () => {
    setForm({
      name: user?.name || '',
      city: user?.city || 'Toshkent',
      profilePhotoId: user?.profilePhotoId || '',
    });
    setEditing(true);
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleResetProgress = async () => {
    const confirmed = window.confirm(
      'Barcha progressni 0 qilamizmi? Bu amalni orqaga qaytarib bo`lmaydi.',
    );
    if (!confirmed) return;

    // API da ham tozalash
    try {
      await apiResetProgress();
    } catch {
      // API xato bo'lsa ham local reset davom etadi
    }

    updateUser({
      xp: 0,
      activeChallenges: [],
      completedDays: {},
      streak: 0,
      longestStreak: 0,
      dailyGoal: 3,
      achievements: [],
      streakFreezes: 0,
      totalTasksCompleted: 0,
      dailyQuestBonusDates: {},
      comboCount: 1,
      lastTaskAt: 0,
      watchedVideos: {},
      watchedToday: {},
      videoNotes: {},
      videoProgress: {},
      prayerLog: {},
      prayerDebt: {},
      prayerMode: 'standard',
      tasbehData: {},
      nafsJourney: {},
      onboardingDone: false,
      _clearTransient: true,
    });
  };

  return (
    <div className="page-wrapper">
      <div className="profile-hero card fade-in-up">
        <ProgressRing percent={user?.heartPercent || 0} size={84} stroke={6}>
          <div className="profile-avatar">
            {selectedPhoto ? (
              <img src={selectedPhoto.src} alt="Profil rasmi" className="profile-avatar-image" />
            ) : (
              getInitials(user?.name)
            )}
          </div>
        </ProgressRing>

        {editing ? (
          <div className="profile-edit-form">
            <input
              className="input-field"
              value={form.name}
              onChange={(event) => setForm((prev) => ({ ...prev, name: event.target.value }))}
              placeholder="Ismingiz"
            />
            <select
              className="input-field"
              value={form.city}
              onChange={(event) => setForm((prev) => ({ ...prev, city: event.target.value }))}
            >
              {CITIES.map((city) => <option key={city}>{city}</option>)}
            </select>

            <div className="photo-picker-wrap">
              <div className="photo-picker-title">Profil rasmi</div>
              <div className="photo-picker-grid">
                <button
                  type="button"
                  className={`photo-option ${!form.profilePhotoId ? 'active' : ''}`}
                  onClick={() => setForm((prev) => ({ ...prev, profilePhotoId: '' }))}
                >
                  <span className="photo-option-fallback">{getInitials(form.name || user?.name)}</span>
                </button>
                {PROFILE_PHOTOS.map((photo) => (
                  <button
                    type="button"
                    key={photo.id}
                    className={`photo-option ${form.profilePhotoId === photo.id ? 'active' : ''}`}
                    onClick={() => setForm((prev) => ({ ...prev, profilePhotoId: photo.id }))}
                  >
                    <img src={photo.src} alt={`Profil rasmi ${photo.id}`} />
                  </button>
                ))}
              </div>
            </div>

            <div className="edit-actions">
              <button className="btn btn-primary" onClick={saveProfile}>Saqlash</button>
              <button className="btn btn-ghost" onClick={() => setEditing(false)}>Bekor</button>
            </div>
          </div>
        ) : (
          <div className="profile-info">
            <h2 className="profile-name">{user?.name}</h2>
            <p className="profile-email">{user?.email}</p>
            <div className="profile-meta">
              <span className="badge badge-gold">📍 {user?.city}</span>
              <span className="badge badge-accent">Daraja {current.level} - {current.name}</span>
            </div>
            <button className="btn btn-outline profile-edit-btn" onClick={openEditor}>
              <IconEdit size={14} /> Tahrirlash
            </button>
          </div>
        )}
      </div>

      <div className="fade-in-up" style={{ animationDelay: '0.1s' }}>
        <XPBar xp={user?.xp || 0} streak={user?.streak || 0} />
      </div>

      <div className="profile-stats-grid fade-in-up" style={{ animationDelay: '0.15s' }}>
        <div className="profile-stat card">
          <span className="pstat-icon"><IconHeart size={24} /></span>
          <span className="pstat-val">{Math.round(user?.heartPercent || 0)}%</span>
          <span className="pstat-label">Qalb nuri</span>
        </div>
        <div className="profile-stat card">
          <span className="pstat-icon"><IconFire size={24} /></span>
          <span className="pstat-val">{user?.streak || 0}</span>
          <span className="pstat-label">Joriy streak</span>
        </div>
        <div className="profile-stat card">
          <span className="pstat-icon"><IconStar size={24} /></span>
          <span className="pstat-val">{user?.longestStreak || 0}</span>
          <span className="pstat-label">Eng uzun streak</span>
        </div>
        <div className="profile-stat card">
          <span className="pstat-icon">🧊</span>
          <span className="pstat-val">{user?.streakFreezes || 0}</span>
          <span className="pstat-label">Freeze</span>
        </div>
        <div className="profile-stat card">
          <span className="pstat-icon"><IconCheckCircle size={24} /></span>
          <span className="pstat-val">{totalCompleted}</span>
          <span className="pstat-label">Jami bajarildi</span>
        </div>
      </div>

      <div className="fade-in-up" style={{ animationDelay: '0.2s' }}>
        <div className="section-title-row" style={{ marginBottom: 16 }}>
          <span className="section-icon"><IconStar size={20} /></span>
          Yutuqlar ({earnedCount}/{ACHIEVEMENTS.length})
        </div>
        <div className="badges-grid">
          {ACHIEVEMENTS.map((item) => {
            const earned = earnedSet.has(item.id);
            return (
              <div key={item.id} className={`badge-card card ${earned ? 'earned' : 'locked'}`}>
                <span className="badge-icon">{item.icon}</span>
                <div className="badge-name">{item.label}</div>
                <div className="badge-desc">{item.desc}</div>
                <div className="badge-xp">+{item.xpBonus} XP</div>
                {!earned && <div className="badge-lock">🔒</div>}
              </div>
            );
          })}
        </div>
      </div>

      <div className="fade-in-up profile-settings card" style={{ animationDelay: '0.25s' }}>
        <div className="section-title-row" style={{ marginBottom: 14 }}>
          <span className="section-icon"><IconSettings size={20} /></span>
          Sozlamalar
        </div>

        <div className="setting-row" onClick={toggle}>
          <span className="setting-label-wrap">
            {dark ? <IconSun size={18} /> : <IconMoon size={18} />}
            {dark ? 'Kunduzgi rejim' : 'Tungi rejim'}
          </span>
          <div className={`toggle-switch ${dark ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        <div className="setting-row" onClick={setAuto}>
          <span className="setting-label-wrap">
            <IconRefresh size={18} />
            Avtomatik tema {mode === 'auto' ? '(faol)' : ''}
          </span>
          <div className={`toggle-switch ${mode === 'auto' ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        <div className="setting-row" onClick={() => updateUser({ soundEnabled: !(user?.soundEnabled !== false) })}>
          <span className="setting-label-wrap">
            {user?.soundEnabled !== false ? <IconVolumeOn size={18} /> : <IconVolumeOff size={18} />}
            Ovoz effektlari
          </span>
          <div className={`toggle-switch ${user?.soundEnabled !== false ? 'on' : ''}`}>
            <div className="toggle-knob" />
          </div>
        </div>

        <div className="setting-row setting-reset" onClick={handleResetProgress}>
          <span className="setting-label-wrap">
            <IconRefresh size={18} />
            Progressni 0 qilish
          </span>
          <span className="setting-arrow">›</span>
        </div>

        <div className="setting-row setting-logout" onClick={handleLogout}>
          <span className="setting-label-wrap">
            <IconLogout size={18} />
            Chiqish
          </span>
          <span className="setting-arrow">›</span>
        </div>
      </div>
    </div>
  );
}
