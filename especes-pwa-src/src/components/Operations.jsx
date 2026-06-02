import { useState, useEffect, useMemo } from 'react';
import { db, getOperations } from '../db';
import { useLiveQuery } from 'dexie-react-hooks';
import OperationForm from './OperationForm';
import OperationDetail from './OperationDetail';

function fmt(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + ' €';
}
function fmtAbs(n) {
  return n.toFixed(2).replace('.', ',') + ' €';
}

function groupByDate(ops) {
  const map = {};
  ops.forEach(op => {
    const d = op.date;
    if (!map[d]) map[d] = [];
    map[d].push(op);
  });
  return Object.entries(map).sort((a, b) => b[0].localeCompare(a[0]));
}

function formatDate(d) {
  const today = new Date().toISOString().split('T')[0];
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0];
  if (d === today) return "Aujourd'hui";
  if (d === yesterday) return 'Hier';
  const dt = new Date(d + 'T00:00:00');
  return dt.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export default function Operations({ showToast }) {
  const [showForm, setShowForm] = useState(false);
  const [selectedOp, setSelectedOp] = useState(null);
  const [search, setSearch] = useState('');
  const [filterCat, setFilterCat] = useState(null);
  const [showSearch, setShowSearch] = useState(false);

  const categories = useLiveQuery(() => db.categories.orderBy('ordre').toArray(), []);
  const allOps = useLiveQuery(() => db.operations.orderBy('date').reverse().toArray(), []);

  const filtered = useMemo(() => {
    if (!allOps) return [];
    return allOps.filter(op => {
      if (filterCat && op.categorieId !== filterCat) return false;
      if (search) {
        const s = search.toLowerCase();
        if (!op.libelle?.toLowerCase().includes(s)) return false;
      }
      return true;
    });
  }, [allOps, filterCat, search]);

  const totalDepenses = useMemo(() =>
    (allOps || []).filter(op => op.montant < 0).reduce((s, op) => s + op.montant, 0)
  , [allOps]);

  const totalEspeces = useMemo(() =>
    (allOps || []).reduce((s, op) => s + op.montant, 0)
  , [allOps]);

  const groups = useMemo(() => groupByDate(filtered), [filtered]);
  const catMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  return (
    <>
      <div className="page">
        <div className="page-header">
          <span className="page-title">Mes opérations</span>
          <button className="btn-ghost" onClick={() => setShowSearch(v => !v)}>
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
            </svg>
          </button>
        </div>

        {showSearch && (
          <div style={{ padding: '0 16px 12px' }}>
            <input
              className="input"
              placeholder="Rechercher..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              autoFocus
            />
          </div>
        )}

        <div className="summary-grid">
          <div className="summary-card">
            <div className="summary-label">Dépenses</div>
            <div className="summary-value amount-neg">{fmtAbs(Math.abs(totalDepenses))}</div>
            <div className="summary-sub">{(allOps || []).filter(o => o.montant < 0).length} opérations</div>
          </div>
          <div className="summary-card">
            <div className="summary-label">Total espèces</div>
            <div className="summary-value" style={{ color: totalEspeces >= 0 ? 'var(--green)' : 'var(--red)' }}>
              {fmtAbs(Math.abs(totalEspeces))}
            </div>
            <div className="summary-sub">solde actuel</div>
          </div>
        </div>

        {/* Category filters */}
        {categories && categories.length > 0 && (
          <div style={{ display: 'flex', gap: 8, overflowX: 'auto', padding: '0 16px 12px', scrollbarWidth: 'none' }}>
            <button
              className={`chip ${!filterCat ? 'active' : ''}`}
              onClick={() => setFilterCat(null)}
            >Tout</button>
            {categories.map(cat => (
              <button
                key={cat.id}
                className={`chip ${filterCat === cat.id ? 'active' : ''}`}
                onClick={() => setFilterCat(filterCat === cat.id ? null : cat.id)}
              >
                <span>{cat.icone}</span>
                <span>{cat.nom}</span>
              </button>
            ))}
          </div>
        )}

        {/* Operations list */}
        {groups.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
            <div style={{ fontSize: 48, marginBottom: 12 }}>💰</div>
            <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--text2)' }}>Aucune opération</div>
            <div style={{ fontSize: 14, marginTop: 4 }}>Appuyez sur + pour ajouter</div>
          </div>
        ) : (
          groups.map(([date, ops]) => {
            const total = ops.reduce((s, o) => s + o.montant, 0);
            return (
              <div key={date}>
                <div className="section-header">
                  <span className="section-title">{formatDate(date)}</span>
                  <span className="section-total" style={{ color: total < 0 ? 'var(--red)' : 'var(--green)' }}>
                    {fmt(total)}
                  </span>
                </div>
                <div className="card" style={{ margin: '0 16px 8px', overflow: 'hidden' }}>
                  {ops.map((op, i) => {
                    const cat = catMap[op.categorieId];
                    return (
                      <div key={op.id}>
                        {i > 0 && <div style={{ height: 1, background: 'var(--border)', margin: '0 16px' }} />}
                        <div className="op-row" onClick={() => setSelectedOp(op)}>
                          <div className="op-icon" style={{ background: (cat?.couleur || '#6B7280') + '20' }}>
                            {cat?.icone || '💳'}
                          </div>
                          <div className="op-info">
                            <div className="op-title">{op.libelle || cat?.nom || 'Opération'}</div>
                            <div className="op-sub">{cat?.nom || 'Non catégorisé'}</div>
                          </div>
                          <div className="op-right">
                            <div className={`op-amount ${op.montant < 0 ? 'amount-neg' : 'amount-pos'}`}>
                              {fmt(op.montant)}
                            </div>
                            <div className="op-time">
                              {op.createdAt ? new Date(op.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' }) : ''}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB */}
      <button className="fab" onClick={() => setShowForm(true)}>
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
          <path d="M12 5v14M5 12h14"/>
        </svg>
      </button>

      {showForm && (
        <OperationForm
          categories={categories || []}
          onClose={() => setShowForm(false)}
          onSaved={() => { setShowForm(false); showToast('Opération ajoutée ✓'); }}
        />
      )}

      {selectedOp && (
        <OperationDetail
          op={selectedOp}
          categories={categories || []}
          onClose={() => setSelectedOp(null)}
          onDeleted={() => { setSelectedOp(null); showToast('Opération supprimée'); }}
          onUpdated={() => { setSelectedOp(null); showToast('Opération modifiée ✓'); }}
          showToast={showToast}
        />
      )}
    </>
  );
}
