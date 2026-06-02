import { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, CATEGORIES_DEFAULT, exportCSV } from '../db';

export default function Parametres({ showToast }) {
  const categories = useLiveQuery(() => db.categories.orderBy('ordre').toArray(), []);
  const opsCount = useLiveQuery(() => db.operations.count(), []);

  async function handleExport() {
    try {
      const csv = await exportCSV();
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `especes_export_${new Date().toISOString().split('T')[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      showToast('Export CSV téléchargé ✓');
    } catch (e) {
      showToast('Erreur lors de l\'export');
    }
  }

  async function handleReset() {
    if (!confirm('Supprimer TOUTES les opérations ? Cette action est irréversible.')) return;
    await db.operations.clear();
    showToast('Données effacées');
  }

  async function handleResetCats() {
    await db.categories.clear();
    await db.categories.bulkPut(CATEGORIES_DEFAULT);
    showToast('Catégories réinitialisées');
  }

  return (
    <div className="page">
      <div className="page-header">
        <span className="page-title">Réglages</span>
      </div>

      {/* Info */}
      <div style={{ padding: '0 16px 16px' }}>
        <div style={{ background: 'var(--accent-light)', borderRadius: 'var(--radius-sm)', padding: '14px 16px', display: 'flex', gap: 12, alignItems: 'center' }}>
          <span style={{ fontSize: 24 }}>💾</span>
          <div>
            <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>Données locales</div>
            <div style={{ fontSize: 12, color: 'var(--text2)', marginTop: 2 }}>
              {opsCount || 0} opération{opsCount !== 1 ? 's' : ''} · Stockage hors ligne
            </div>
          </div>
        </div>
      </div>

      {/* Export */}
      <div style={{ padding: '0 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          EXPORT
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <SettingRow
            icon="📊"
            title="Exporter en CSV"
            sub="UTF-8, séparateur point-virgule"
            onClick={handleExport}
            chevron
          />
        </div>
      </div>

      {/* Catégories */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          CATÉGORIES ({categories?.length || 0})
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          {(categories || []).map((cat, i) => (
            <div key={cat.id}>
              {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />}
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '12px 16px' }}>
                <div style={{ width: 36, height: 36, borderRadius: 10, background: (cat.couleur || '#6B7280') + '20', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 18 }}>
                  {cat.icone}
                </div>
                <span style={{ fontSize: 15, fontWeight: 500 }}>{cat.nom}</span>
                <div style={{ marginLeft: 'auto', width: 10, height: 10, borderRadius: '50%', background: cat.couleur || '#6B7280' }} />
              </div>
            </div>
          ))}
          <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />
          <SettingRow
            icon="🔄"
            title="Réinitialiser les catégories"
            sub="Restaurer les catégories par défaut"
            onClick={handleResetCats}
            chevron
          />
        </div>
      </div>

      {/* Danger zone */}
      <div style={{ padding: '16px 16px 8px' }}>
        <div style={{ fontSize: 11, fontWeight: 600, color: 'var(--text3)', textTransform: 'uppercase', letterSpacing: '.06em', marginBottom: 8 }}>
          ZONE DANGEREUSE
        </div>
        <div className="card" style={{ overflow: 'hidden' }}>
          <button
            style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '14px 16px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font)' }}
            onClick={handleReset}
          >
            <span style={{ fontSize: 20 }}>🗑️</span>
            <div style={{ textAlign: 'left' }}>
              <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--red)' }}>Effacer toutes les données</div>
              <div style={{ fontSize: 12, color: 'var(--text3)' }}>Supprime toutes les opérations</div>
            </div>
          </button>
        </div>
      </div>

      {/* About */}
      <div style={{ padding: '20px 16px', textAlign: 'center', color: 'var(--text3)', fontSize: 12 }}>
        <div style={{ fontSize: 32, marginBottom: 8 }}>💶</div>
        <div style={{ fontWeight: 600, color: 'var(--text2)', marginBottom: 2 }}>Espèces v1.0</div>
        <div>Suivi des opérations en espèces</div>
        <div style={{ marginTop: 4 }}>100% hors ligne · Données locales</div>
      </div>
    </div>
  );
}

function SettingRow({ icon, title, sub, onClick, chevron }) {
  return (
    <button
      style={{ width: '100%', background: 'none', border: 'none', cursor: 'pointer', padding: '13px 16px', display: 'flex', alignItems: 'center', gap: 12, fontFamily: 'var(--font)', textAlign: 'left' }}
      onClick={onClick}
    >
      <span style={{ fontSize: 20 }}>{icon}</span>
      <div style={{ flex: 1 }}>
        <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text)' }}>{title}</div>
        {sub && <div style={{ fontSize: 12, color: 'var(--text3)', marginTop: 1 }}>{sub}</div>}
      </div>
      {chevron && (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--text3)" strokeWidth="2">
          <path d="m9 18 6-6-6-6"/>
        </svg>
      )}
    </button>
  );
}
