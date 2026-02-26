import { useState, useEffect } from 'react';
import { IconQibla, IconMapPin, IconWarning, IconRefresh } from '../../components/Icons/RamadanIcons';
import './Qibla.css';

const MECCA = { lat: 21.4225, lng: 39.8262 };

function calcBearing(from, to) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const dLng = toRad(to.lng - from.lng);
  const lat1 = toRad(from.lat);
  const lat2 = toRad(to.lat);
  const y = Math.sin(dLng) * Math.cos(lat2);
  const x = Math.cos(lat1) * Math.sin(lat2) - Math.sin(lat1) * Math.cos(lat2) * Math.cos(dLng);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function calcDistance(from, to) {
  const R = 6371;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(to.lat - from.lat);
  const dLng = toRad(to.lng - from.lng);
  const a = Math.sin(dLat/2)**2 + Math.cos(toRad(from.lat)) * Math.cos(toRad(to.lat)) * Math.sin(dLng/2)**2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)));
}

export default function Qibla() {
  const [pos, setPos] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [deviceAngle, setDeviceAngle] = useState(0);

  const bearing = pos ? calcBearing(pos, MECCA) : null;
  const distance = pos ? calcDistance(pos, MECCA) : null;
  const qiblaAngle = bearing !== null ? bearing - deviceAngle : null;

  useEffect(() => {
    const handler = (e) => {
      const angle = e.webkitCompassHeading ?? e.alpha ?? 0;
      setDeviceAngle(angle);
    };
    if (typeof DeviceOrientationEvent !== 'undefined') {
      if (typeof DeviceOrientationEvent.requestPermission === 'function') {
        DeviceOrientationEvent.requestPermission().then(p => {
          if (p === 'granted') window.addEventListener('deviceorientation', handler);
        }).catch(() => {});
      } else {
        window.addEventListener('deviceorientation', handler);
      }
    }
    return () => window.removeEventListener('deviceorientation', handler);
  }, []);

  const getLocation = () => {
    setLoading(true);
    setError('');
    navigator.geolocation.getCurrentPosition(
      (p) => { setPos({ lat: p.coords.latitude, lng: p.coords.longitude }); setLoading(false); },
      () => { setError("Joylashuvni aniqlab bo'lmadi. Ruxsat bering."); setLoading(false); }
    );
  };

  return (
    <div className="page-wrapper qibla-page">
      <div className="section-title-row" style={{ marginBottom: 20, alignSelf: 'stretch' }}>
        <span className="section-icon"><IconQibla size={20} /></span>
        Qibla Yo'nalishi
      </div>

      {!pos && (
        <div className="qibla-start card">
          <div className="qibla-kaaba">🕋</div>
          <p>Qibla yo'nalishini topish uchun joylashuvingizga ruxsat bering.</p>
          <button className="btn btn-primary" onClick={getLocation} disabled={loading}>
            {loading ? <span className="spinner" /> : <IconMapPin size={16} color="white" />}
            Joylashuvni aniqlash
          </button>
          {error && (
            <p className="qibla-error">
              <IconWarning size={15} /> {error}
            </p>
          )}
        </div>
      )}

      {pos && bearing !== null && (
        <>
          <div className="qibla-compass-wrap card">
            <div className="qibla-compass">
              <div className="compass-rose">
                {['Sh','G','J','Sh'].map((d, i) => (
                  <span key={i} className="compass-dir" style={{ '--angle': `${i * 90}deg` }}>{d}</span>
                ))}
              </div>
              <div
                className="qibla-arrow"
                style={{ transform: `rotate(${qiblaAngle ?? bearing}deg)` }}
              >
                <div className="arrow-body">
                  <div className="arrow-tip">🕋</div>
                  <div className="arrow-line" />
                  <div className="arrow-tail" />
                </div>
              </div>
              <div className="compass-center" />
            </div>
          </div>

          <div className="qibla-info">
            <div className="qibla-stat card">
              <span className="qi-val">{Math.round(bearing)}°</span>
              <span className="qi-label">Qibla burchagi</span>
            </div>
            <div className="qibla-stat card">
              <span className="qi-val">{distance?.toLocaleString()} km</span>
              <span className="qi-label">Makkagacha masofa</span>
            </div>
          </div>

          <div className="qibla-location card">
            <span className="ql-label">
              <IconMapPin size={13} /> Sizning joylashuvingiz
            </span>
            <span className="ql-val">{pos.lat.toFixed(4)}° N, {pos.lng.toFixed(4)}° E</span>
          </div>

          <div className="qibla-hint card">
            <p>💡 Telefoningizni tekis ushlab, 🕋 belgisi Makkaga qaragan yo'nalishni ko'rsatadi.</p>
            <p style={{ marginTop: 6, fontSize: 12, opacity: 0.7 }}>Kompas uchun qurilma sensoriga ruxsat bering.</p>
          </div>

          <button className="btn btn-outline" onClick={() => setPos(null)} style={{ marginTop: 8 }}>
            <IconRefresh size={15} /> Qayta aniqlash
          </button>
        </>
      )}
    </div>
  );
}
