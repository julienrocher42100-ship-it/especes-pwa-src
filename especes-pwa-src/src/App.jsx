import { useState, useEffect } from 'react';
import { initDB } from './db';
import Operations from './components/Operations';
import Stats from './components/Stats';
import Parametres from './components/Parametres';

function NavIcon({ type, active }) {
  const color = active ? 'var(--accent)' : 'var(--text3)';
  if (type === 'ops') return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <rect x="3" y="4" width="18" height="18" rx="3"/>
      <path d="M7 9h10M7 13h7"/>
    </svg>
  );
  if (type === 'stats') return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <path d="M18 20V10M12 20V4M6 20v-6"/>
    </svg>
  );
  if (type === 'params') return (
    <svg viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2">
      <circle cx="12" cy="12" r="3"/>
      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/>
    </svg>
  );
}

export default function App() {
  const [tab, setTab] = useState('ops');
  const [ready, setReady] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    initDB().then(() => setReady(true));
  }, []);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  }

  if (!ready) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100dvh', background: 'var(--bg)' }}>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: 52, marginBottom: 16 }}>💶</div>
        <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Espèces</div>
        <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>Chargement...</div>
      </div>
    </div>
  );

  return (
    <>
      {tab === 'ops' && <Operations showToast={showToast} />}
      {tab === 'stats' && <Stats />}
      {tab === 'params' && <Parametres showToast={showToast} />}

      <nav className="nav">
        {[
          { k: 'ops', icon: 'ops', label: 'Opérations' },
          { k: 'stats', icon: 'stats', label: 'Stats' },
          { k: 'params', icon: 'params', label: 'Réglages' },
        ].map(({ k, icon, label }) => (
          <button key={k} className={`nav-item ${tab === k ? 'active' : ''}`} onClick={() => setTab(k)}>
            <NavIcon type={icon} active={tab === k} />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {toast && <div className="toast">{toast}</div>}
    </>
  );
}
