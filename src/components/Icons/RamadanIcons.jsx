// Ramadan-themed SVG icon components
// Inspired by the flaticon Ramadan icon pack style

export function IconHome({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M3 12L12 3L21 12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M5 10V20C5 20.55 5.45 21 6 21H10V16H14V21H18C18.55 21 19 20.55 19 20V10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M9 21V17C9 16.45 9.45 16 10 16H14C14.55 16 15 16.45 15 17V21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconCalendar({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="4" width="18" height="18" rx="3" stroke={color} strokeWidth="2"/>
      <path d="M8 2V6M16 2V6M3 9H21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="8" cy="14" r="1.2" fill={color}/>
      <circle cx="12" cy="14" r="1.2" fill={color}/>
      <circle cx="16" cy="14" r="1.2" fill={color}/>
      <circle cx="8" cy="18" r="1.2" fill={color}/>
      <circle cx="12" cy="18" r="1.2" fill={color}/>
    </svg>
  );
}

export function IconMoon({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="18" cy="5" r="1.5" fill={color}/>
      <circle cx="21" cy="8" r="1" fill={color}/>
      <circle cx="20" cy="4" r="0.8" fill={color}/>
    </svg>
  );
}

export function IconChallenge({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="12,2 15.09,8.26 22,9.27 17,14.14 18.18,21.02 12,17.77 5.82,21.02 7,14.14 2,9.27 8.91,8.26" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconQuran({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 19.5C4 18.12 5.12 17 6.5 17H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M6.5 2H20V22H6.5C5.12 22 4 20.88 4 19.5V4.5C4 3.12 5.12 2 6.5 2Z" stroke={color} strokeWidth="2"/>
      <path d="M12 7C12 7 10 8.5 10 10C10 11.5 11 12 12 12C13 12 14 11.5 14 10C14 8.5 12 7 12 7Z" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M9 14.5H15" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconMosque({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 10 4 10 6C10 7.1 10.9 8 12 8C13.1 8 14 7.1 14 6C14 4 12 2 12 2Z" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M8 8C8 8 6 10 6 13H18C18 10 16 8 16 8" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M4 13H20V14C20 14.55 19.55 15 19 15H5C4.45 15 4 14.55 4 14V13Z" fill={color} opacity="0.3"/>
      <path d="M4 13H20" stroke={color} strokeWidth="1.8"/>
      <path d="M6 15V21H18V15" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M10 21V17H14V21" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M2 13H4M20 13H22" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M2 10V13M22 10V13" stroke={color} strokeWidth="1.8" strokeLinecap="round"/>
      <path d="M2 8C2 8 1 9 1 10M22 8C22 8 23 9 23 10" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconVideo({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="2" y="5" width="15" height="14" rx="2" stroke={color} strokeWidth="2"/>
      <path d="M17 9L22 6V18L17 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="9.5" cy="12" r="2.5" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export function IconTasbeh({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="5" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="19" cy="9" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="19" cy="15" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="19" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="5" cy="15" r="2" stroke={color} strokeWidth="1.8"/>
      <circle cx="5" cy="9" r="2" stroke={color} strokeWidth="1.8"/>
      <path d="M12 7V7.5M14 5.5L17.3 7.3M19 11V13M17.3 16.7L14 18.5M12 17V17.5M10 18.5L6.7 16.7M5 13V11M6.7 7.3L10 5.5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <circle cx="12" cy="5" r="0.8" fill={color}/>
    </svg>
  );
}

export function IconQibla({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
      <path d="M12 3V6M12 18V21M3 12H6M18 12H21" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
      <path d="M12 7L10 12H14L12 7Z" fill={color}/>
      <path d="M12 17L14 12H10L12 17Z" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconProfile({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="8" r="4" stroke={color} strokeWidth="2"/>
      <path d="M4 20C4 16.69 7.58 14 12 14C16.42 14 20 16.69 20 20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconLantern({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 5H15L17 8V18L15 20H9L7 18V8L9 5Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round"/>
      <path d="M9 20H15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M11 20V22H13V20" stroke={color} strokeWidth="1.5"/>
      <circle cx="12" cy="13" r="2.5" stroke={color} strokeWidth="1.5"/>
      <path d="M7 11H9M15 11H17M10 8H14" stroke={color} strokeWidth="1.2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconStar({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L14.4 8.9H21.7L16 13.1L18.4 20L12 15.8L5.6 20L8 13.1L2.3 8.9H9.6L12 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconSun({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="4" stroke={color} strokeWidth="2"/>
      <path d="M12 2V4M12 20V22M4 12H2M22 12H20M6.34 6.34L4.93 4.93M19.07 19.07L17.66 17.66M17.66 6.34L19.07 4.93M4.93 19.07L6.34 17.66" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconPrayerMat({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M4 20L12 4L20 20H4Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M8 20L12 12L16 20" stroke={color} strokeWidth="1.5" strokeLinejoin="round"/>
      <path d="M4 20H20" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="9" r="1.5" stroke={color} strokeWidth="1.5"/>
    </svg>
  );
}

export function IconDates({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2C12 2 12 4 12 5" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <ellipse cx="8" cy="10" rx="3" ry="5" stroke={color} strokeWidth="1.8"/>
      <ellipse cx="16" cy="11" rx="3" ry="5" stroke={color} strokeWidth="1.8"/>
      <ellipse cx="12" cy="14" rx="3" ry="5" stroke={color} strokeWidth="1.8"/>
      <path d="M6 5C6 5 8 3 12 5C16 3 18 5 18 5" stroke={color} strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  );
}

export function IconXP({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="12" r="3" fill={color} opacity="0.3"/>
    </svg>
  );
}

export function IconBookOpen({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 3H8C9.06 3 10.08 3.42 10.83 4.17C11.58 4.92 12 5.94 12 7V21C12 20.21 11.68 19.45 11.12 18.88C10.55 18.32 9.79 18 9 18H2V3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M22 3H16C14.94 3 13.92 3.42 13.17 4.17C12.42 4.92 12 5.94 12 7V21C12 20.21 12.32 19.45 12.88 18.88C13.45 18.32 14.21 18 15 18H22V3Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBookmark({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M19 21L12 16L5 21V5C5 4.47 5.21 3.96 5.59 3.59C5.96 3.21 6.47 3 7 3H17C17.53 3 18.04 3.21 18.41 3.59C18.79 3.96 19 4.47 19 5V21Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBell({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M18 8A6 6 0 006 8C6 15 3 17 3 17H21C21 17 18 15 18 8Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M13.73 21C13.55 21.3 13.3 21.55 13 21.72C12.7 21.9 12.35 22 12 22C11.65 22 11.3 21.9 11 21.72C10.7 21.55 10.45 21.3 10.27 21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconSettings({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="3" stroke={color} strokeWidth="2"/>
      <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export function IconHeart({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconMapPin({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 7.61 3.95 5.32 5.64 3.64C7.32 1.95 9.61 1 12 1C14.39 1 16.68 1.95 18.36 3.64C20.05 5.32 21 7.61 21 10Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <circle cx="12" cy="10" r="3" stroke={color} strokeWidth="2"/>
    </svg>
  );
}

export function IconVolumeOn({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M19.07 4.93a10 10 0 010 14.14M15.54 8.46a5 5 0 010 7.07" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconVolumeOff({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="23" y1="9" x2="17" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="17" y1="9" x2="23" y2="15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconSunrise({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 2V4M4.22 6.22L5.64 7.64M1 13H3M21 13H23M18.36 7.64L19.78 6.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 13C5 10.24 7.24 8 10 8H14C16.76 8 19 10.24 19 13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 18H23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M9 22H15" stroke={color} strokeWidth="1.5" strokeLinecap="round" opacity="0.5"/>
    </svg>
  );
}

export function IconSunset({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M12 6V2M4.22 8.22L5.64 9.64M1 15H3M21 15H23M18.36 9.64L19.78 8.22" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M5 15C5 12.24 7.24 10 10 10H14C16.76 10 19 12.24 19 15" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M1 20H23" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M15 4L12 7L9 4" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconLogout({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 21H5C4.47 21 3.96 20.79 3.59 20.41C3.21 20.04 3 19.53 3 19V5C3 4.47 3.21 3.96 3.59 3.59C3.96 3.21 4.47 3 5 3H9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="16 17 21 12 16 7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <line x1="21" y1="12" x2="9" y2="12" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconRefresh({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <polyline points="23 4 23 10 17 10" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <polyline points="1 20 1 14 7 14" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M3.51 9a9 9 0 0114.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0020.49 15" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconShare({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="18" cy="5" r="3" stroke={color} strokeWidth="2"/>
      <circle cx="6" cy="12" r="3" stroke={color} strokeWidth="2"/>
      <circle cx="18" cy="19" r="3" stroke={color} strokeWidth="2"/>
      <line x1="8.59" y1="13.51" x2="15.42" y2="17.49" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <line x1="15.41" y1="6.51" x2="8.59" y2="10.49" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    </svg>
  );
}

export function IconFire({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M17.66 11.2C17.43 10.9 17.15 10.64 16.89 10.38C16.22 9.78 15.46 9.35 14.82 8.72C13.33 7.26 13 4.85 13.95 3C13 3.23 12.17 3.75 11.46 4.32C8.87 6.4 7.85 10.07 9.07 13.22C9.11 13.32 9.15 13.42 9.15 13.55C9.15 13.77 9 13.97 8.8 14.05C8.57 14.15 8.33 14.09 8.14 13.93C8.08 13.88 8.04 13.83 8 13.76C6.87 12.33 6.69 10.28 7.45 8.64C5.78 10 4.87 12.3 5 14.47C5.06 14.97 5.12 15.47 5.29 15.97C5.43 16.57 5.7 17.17 6 17.7C7.08 19.43 8.95 20.67 10.96 20.92C13.1 21.19 15.39 20.8 17.03 19.32C18.86 17.66 19.5 15 18.56 12.72L18.43 12.46C18.22 12 17.66 11.2 17.66 11.2Z" fill={color}/>
    </svg>
  );
}

export function IconBolt({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M13 2L4 13H11L10 22L20 11H13L13 2Z" fill={color}/>
    </svg>
  );
}

export function IconCheckCircle({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
      <path d="M8 12L11 15L16 9" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export function IconBarChart({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <rect x="3" y="11" width="4" height="10" rx="1" fill={color} opacity="0.55"/>
      <rect x="10" y="6" width="4" height="15" rx="1" fill={color}/>
      <rect x="17" y="3" width="4" height="18" rx="1" fill={color} opacity="0.75"/>
    </svg>
  );
}

export function IconWarning({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
      <path d="M12 9V13" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <circle cx="12" cy="17" r="1" fill={color}/>
    </svg>
  );
}

export function IconTarget({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <circle cx="12" cy="12" r="9" stroke={color} strokeWidth="2"/>
      <circle cx="12" cy="12" r="5" stroke={color} strokeWidth="1.8"/>
      <circle cx="12" cy="12" r="2" fill={color}/>
    </svg>
  );
}

export function IconEdit({ size = 22, color = 'currentColor' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round"/>
      <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}


