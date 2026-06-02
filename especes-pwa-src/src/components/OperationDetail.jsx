import { useState } from 'react';
import { deleteOperation, updateOperation } from '../db';

function fmt(n) {
  return (n >= 0 ? '+' : '') + n.toFixed(2).replace('.', ',') + ' €';
}

export default function OperationDetail({ op, categories, onClose, onDeleted, onUpdated }) {
  const [editing, setEditing] = useState(false);
  const [montant, setMontant] = useState(String(Math.abs(op.montant)));
  const [isNeg, setIsNeg] = useState(op.montant < 0);
  const [libelle, setLibelle] = useState(op.libelle || '');
  const [categorieId, setCategorieId] = useState(op.categorieId ? String(op.categorieId) : '');
  const [date, setDate] = useState(op.date);
  const [note, setNote] = useState(op.note || '');
  const [loading, setLoading] = useState(false);

  const cat = categories.find(c => c.id === op.categorieId);

  async function handleDelete() {
    if (!confirm('Supprimer cette opération ?')) return;
    await deleteOperation(op.id);
    onDeleted();
  }

  async function handleSave() {
    const parsedMontant = parseFloat(montant.replace(',', '.')) || 0;
    if (!parsedMontant) return;
    setLoading(true);
    try {
      await updateOperation(op.id, {
        montant: isNeg ? -Math.abs(parsedMontant) : Math.abs(parsedMontant),
        libelle: libelle.trim() || null,
        categorieId: categorieId ? parseInt(categorieId) : null,
        date,
        note: note.trim() || null,
      });
      onUpdated();
    } catch (e) { console.error(e); }
    finally { setLoading(false); }
  }

  if (editing) {
    return (
      <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
        <div className="modal-sheet">
          <div className="sheet-handle" />
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
            <button className="btn-ghost" onClick={() => setEditing(false)}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="m15 18-6-6 6-6"/>
              </svg>
            </button>
            <span style={{ fontSize: 16, fontWeight: 600 }}>Modifier</span>
            <button
              style={{
                background: 'var(--accent)', color: '#fff', border: 'none',
                borderRadius: 12, width: 36, height: 36, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}
              onClick={handleSave} disabled={loading}
            >
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
            <button
              className="amount-toggle"
              onClick={() => setIsNeg(v => !v)}
              style={{ background: isNeg ? 'var(--red)' : 'var(--green)' }}
            >{isNeg ? '−' : '+'}</button>
            <input
              className="input"
              type="number" inputMode="decimal"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              style={{ fontSize: 28, fontFamily: 'var(--mono)', fontWeight: 700, textAlign: 'center', flex: 1 }}
            />
            <span style={{ fontSize: 20, color: 'var(--text3)' }}>€</span>
          </div>

          <div className="form-group">
            <label className="label">Date</label>
            <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
          </div>
          <div className="form-group">
            <label className="label">Libellé</label>
            <input className="input" type="text" value={libelle} onChange={e => setLibelle(e.target.value)} placeholder="Ex: Supermarché..." />
          </div>
          <div className="form-group">
            <label className="label">Catégorie</label>
            <select className="select" value={categorieId} onChange={e => setCategorieId(e.target.value)}>
              <option value="">Non catégorisé</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.icone} {c.nom}</option>)}
            </select>
          </div>
          <div className="form-group">
            <label className="label">Note</label>
            <textarea className="input" value={note} onChange={e => setNote(e.target.value)} rows={2} style={{ resize: 'none' }} />
          </div>
          <button className="btn-primary" onClick={handleSave} disabled={loading}>
            {loading ? 'Enregistrement...' : 'Sauvegarder'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn-ghost" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Détail</span>
          <button className="btn-ghost" onClick={() => setEditing(true)}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>

        {/* Amount big */}
        <div style={{ textAlign: 'center', padding: '16px 0 24px' }}>
          <div style={{ fontSize: 52, fontWeight: 700, fontFamily: 'var(--mono)', color: op.montant < 0 ? 'var(--red)' : 'var(--green)' }}>
            {(op.montant >= 0 ? '+' : '') + op.montant.toFixed(2).replace('.', ',')} €
          </div>
          <div style={{ fontSize: 14, color: 'var(--text3)', marginTop: 4 }}>
            {new Date(op.date + 'T00:00:00').toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </div>
        </div>

        {/* Details */}
        <div style={{ background: 'var(--surface2)', borderRadius: 'var(--radius-sm)', overflow: 'hidden', marginBottom: 16 }}>
          {[
            { label: 'Libellé', val: op.libelle || '—' },
            { label: 'Catégorie', val: cat ? `${cat.icone} ${cat.nom}` : 'Non catégorisé' },
            { label: 'Note', val: op.note || '—' },
          ].map((row, i) => (
            <div key={i}>
              {i > 0 && <div style={{ height: 1, background: 'var(--border)' }} />}
              <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 14px' }}>
                <span style={{ fontSize: 14, color: 'var(--text3)' }}>{row.label}</span>
                <span style={{ fontSize: 14, fontWeight: 500, color: 'var(--text)' }}>{row.val}</span>
              </div>
            </div>
          ))}
        </div>

        <button className="delete-btn" onClick={handleDelete}>
          Supprimer cette opération
        </button>
      </div>
    </div>
  );
}
