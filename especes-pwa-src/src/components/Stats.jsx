import { useMemo, useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from '../db';
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';

function fmtAbs(n) {
  return Math.abs(n).toFixed(2).replace('.', ',') + ' €';
}

function getPeriodRange(period) {
  const now = new Date();
  const today = now.toISOString().split('T')[0];
  if (period === 'week') {
    const d = new Date(now);
    d.setDate(d.getDate() - 6);
    return { start: d.toISOString().split('T')[0], end: today };
  }
  if (period === 'month') {
    return { start: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`, end: today };
  }
  if (period === 'year') {
    return { start: `${now.getFullYear()}-01-01`, end: today };
  }
  return { start: null, end: null };
}

const COLORS = ['#5B5BF6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899', '#F97316', '#06B6D4'];

export default function Stats() {
  const [period, setPeriod] = useState('month');
  const categories = useLiveQuery(() => db.categories.toArray(), []);
  const allOps = useLiveQuery(() => db.operations.orderBy('date').toArray(), []);

  const { start, end } = getPeriodRange(period);

  const ops = useMemo(() => {
    if (!allOps) return [];
    return allOps.filter(op => {
      if (start && op.date < start) return false;
      if (end && op.date > end) return false;
      return true;
    });
  }, [allOps, start, end]);

  const catMap = useMemo(() => {
    if (!categories) return {};
    return Object.fromEntries(categories.map(c => [c.id, c]));
  }, [categories]);

  const totalDepenses = ops.filter(o => o.montant < 0).reduce((s, o) => s + o.montant, 0);
  const totalRevenus = ops.filter(o => o.montant > 0).reduce((s, o) => s + o.montant, 0);
  const nbOps = ops.length;

  // By category
  const byCat = useMemo(() => {
    const map = {};
    ops.filter(o => o.montant < 0).forEach(op => {
      const key = op.categorieId || 0;
      if (!map[key]) map[key] = { id: key, montant: 0 };
      map[key].montant += op.montant;
    });
    return Object.values(map)
      .map(r => ({
        name: catMap[r.id]?.nom || 'Autres',
        icone: catMap[r.id]?.icone || '···',
        value: Math.abs(r.montant),
        montant: r.montant
      }))
      .sort((a, b) => b.value - a.value);
  }, [ops, catMap]);

  // By day
  const byDay = useMemo(() => {
    const map = {};
    ops.filter(o => o.montant < 0).forEach(op => {
      if (!map[op.date]) map[op.date] = 0;
      map[op.date] += Math.abs(op.montant);
    });
    return Object.entries(map)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([d, v]) => ({
        label: new Date(d + 'T00:00:00').toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
        value: parseFloat(v.toFixed(2))
      }));
  }, [ops]);

  const PERIODS = [
    { k: 'week', l: '7 jours' },
    { k: 'month', l: 'Ce mois' },
    { k: 'year', l: 'Cette année' },
    { k: 'all', l: 'Tout' },
  ];

  return (
    <div className="page">
      <div className="page-header">
        <span className="page-title">Statistiques</span>
      </div>

      {/* Period selector */}
      <div style={{ display: 'flex', gap: 8, padding: '0 16px 16px', overflowX: 'auto', scrollbarWidth: 'none' }}>
        {PERIODS.map(p => (
          <button key={p.k} className={`chip ${period === p.k ? 'active' : ''}`} onClick={() => setPeriod(p.k)}>
            {p.l}
          </button>
        ))}
      </div>

      {/* Summary */}
      <div className="summary-grid">
        <div className="summary-card">
          <div className="summary-label">Total dépenses</div>
          <div className="summary-value amount-neg">{fmtAbs(totalDepenses)}</div>
        </div>
        <div className="summary-card">
          <div className="summary-label">Nb opérations</div>
          <div className="summary-value">{nbOps}</div>
        </div>
      </div>
      {totalRevenus > 0 && (
        <div style={{ padding: '0 16px 12px' }}>
          <div className="summary-card" style={{ padding: '12px 14px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span className="summary-label" style={{ marginBottom: 0, alignSelf: 'center' }}>Revenus</span>
              <span style={{ fontSize: 18, fontWeight: 700, color: 'var(--green)', fontFamily: 'var(--mono)' }}>+{fmtAbs(totalRevenus)}</span>
            </div>
          </div>
        </div>
      )}

      {ops.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 24px', color: 'var(--text3)' }}>
          <div style={{ fontSize: 40, marginBottom: 12 }}>📊</div>
          <div style={{ fontSize: 15, color: 'var(--text2)' }}>Aucune donnée pour cette période</div>
        </div>
      ) : (
        <>
          {/* Pie chart */}
          {byCat.length > 0 && (
            <div className="stat-section">
              <div className="stat-section-title">Dépenses par catégorie</div>
              <div style={{ width: '100%', height: 200 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={byCat}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={2}
                      dataKey="value"
                    >
                      {byCat.map((entry, i) => (
                        <Cell key={i} fill={COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(v) => fmtAbs(v)} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div style={{ marginTop: 8 }}>
                {byCat.map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: '50%', background: COLORS[i % COLORS.length], flexShrink: 0 }} />
                      <span style={{ fontSize: 14 }}>{item.icone} {item.name}</span>
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--red)', fontFamily: 'var(--mono)' }}>
                      -{fmtAbs(item.value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Bar chart by day */}
          {byDay.length > 1 && (
            <div className="stat-section">
              <div className="stat-section-title">Dépenses par jour</div>
              <div style={{ width: '100%', height: 160 }}>
                <ResponsiveContainer>
                  <BarChart data={byDay} margin={{ top: 4, right: 4, left: -24, bottom: 0 }}>
                    <XAxis dataKey="label" tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fontSize: 11, fill: 'var(--text3)' }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(v) => [fmtAbs(v), 'Dépenses']} />
                    <Bar dataKey="value" fill="var(--accent)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
