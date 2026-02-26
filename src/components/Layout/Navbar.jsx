import { NavLink } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { getInitials } from '../../utils/helpers';
import { getProfilePhotoById } from '../../utils/profilePhotos';
import {
  IconHome, IconCalendar, IconMoon, IconChallenge,
  IconQuran, IconMosque, IconVideo, IconTasbeh, IconQibla, IconProfile,
  IconSun, IconHeart,
} from '../Icons/RamadanIcons';
import './Navbar.css';

const NAV_ITEMS = [
  { to: '/dashboard',  label: 'Bosh sahifa', Icon: IconHome },
  { to: '/calendar',   label: 'Taqvim',      Icon: IconCalendar },
  { to: '/iftor',      label: 'Iftor',        Icon: IconMoon },
  { to: '/challenges', label: 'Topshiriqlar', Icon: IconChallenge },
  { to: '/quran',      label: "Qur'on",       Icon: IconQuran },
  { to: '/quran-hifz', label: 'Hifz',         Icon: IconMosque },
  { to: '/videos',     label: 'Darsliklar',   Icon: IconVideo },
  { to: '/nafs',       label: 'Nafs',         Icon: IconHeart },
  { to: '/tasbeh',     label: 'Tasbeh',       Icon: IconTasbeh },
  { to: '/qibla',      label: 'Qibla',        Icon: IconQibla },
  { to: '/profile',    label: 'Profil',       Icon: IconProfile },
];

export default function Navbar() {
  const { dark, toggle } = useTheme();
  const { user } = useAuth();
  const userPhoto = getProfilePhotoById(user?.profilePhotoId);

  return (
    <>
      <nav className="navbar">
        <div className="navbar-brand">
          <span className="brand-moon">
            <IconMoon size={26} color="var(--primary)" />
          </span>
          <span className="brand-name">Ramazon</span>
        </div>

        <div className="navbar-links">
          {NAV_ITEMS.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            >
              <span className="nav-icon">{item.Icon({ size: 20 })}</span>
              <span className="nav-label">{item.label}</span>
            </NavLink>
          ))}
        </div>

        <div className="navbar-actions">
          <button className="theme-toggle" onClick={toggle} title="Tema almashtirish">
            {dark ? <IconSun size={20} /> : <IconMoon size={20} />}
          </button>
          {user && (
            <NavLink to="/profile" className="avatar-btn">
              {userPhoto ? (
                <img src={userPhoto.src} alt="Profil rasmi" className="avatar-btn-image" />
              ) : (
                getInitials(user.name)
              )}
            </NavLink>
          )}
        </div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="bottom-nav">
        {NAV_ITEMS.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'active' : ''}`}
          >
            <span className="bottom-nav-icon">{item.Icon({ size: 22 })}</span>
            <span className="bottom-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </>
  );
}

