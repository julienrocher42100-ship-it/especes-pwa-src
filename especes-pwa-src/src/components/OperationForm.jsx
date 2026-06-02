import { useState } from 'react';
import { addOperation } from '../db';

export default function OperationForm({ categories, onClose, onSaved, initialOp }) {
  const today = new Date().toISOString().split('T')[0];
  const [montant, setMontant] = useState(initialOp ? String(Math.abs(initialOp.montant)) : '');
  const [isNeg, setIsNeg] = useState(initialOp ? initialOp.montant < 0 : true);
  const [libelle, setLibelle] = useState(initialOp?.libelle || '');
  const [categorieId, setCategorieId] = useState(initialOp?.categorieId || '');
  const [date, setDate] = useState(initialOp?.date || today);
  const [note, setNote] = useState(initialOp?.note || '');
  const [loading, setLoading] = useState(false);

  const parsedMontant = parseFloat(montant.replace(',', '.')) || 0;
  const finalMontant = isNeg ? -Math.abs(parsedMontant) : Math.abs(parsedMontant);

  async function handleSubmit() {
    if (!parsedMontant) return;
    setLoading(true);
    try {
      await addOperation({
        montant: finalMontant,
        libelle: libelle.trim() || null,
        categorieId: categorieId ? parseInt(categorieId) : null,
        date,
        note: note.trim() || null,
      });
      onSaved();
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  const recentCats = categories.slice(0, 6);

  return (
    <div className="modal-overlay" onClick={e => e.target === e.currentTarget && onClose()}>
      <div className="modal-sheet">
        <div className="sheet-handle" />

        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
          <button className="btn-ghost" onClick={onClose}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M18 6 6 18M6 6l12 12"/>
            </svg>
          </button>
          <span style={{ fontSize: 16, fontWeight: 600 }}>Ajouter une opération</span>
          <button
            style={{
              background: parsedMontant ? 'var(--accent)' : 'var(--surface2)',
              color: parsedMontant ? '#fff' : 'var(--text3)',
              border: 'none', borderRadius: 12, width: 36, height: 36,
              cursor: parsedMontant ? 'pointer' : 'default',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              transition: 'all .2s'
            }}
            onClick={handleSubmit}
            disabled={!parsedMontant || loading}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </button>
        </div>

        {/* Quick category chips */}
        <div style={{ display: 'flex', gap: 8, overflowX: 'auto', marginBottom: 20, scrollbarWidth: 'none' }}>
          {recentCats.map(cat => (
            <button
              key={cat.id}
              className={`chip ${categorieId === cat.id || categorieId === String(cat.id) ? 'active' : ''}`}
              onClick={() => setCategorieId(String(cat.id))}
            >
              <span>{cat.icone}</span>
              <span>{cat.nom}</span>
            </button>
          ))}
        </div>

        {/* Amount */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 20 }}>
          <button
            className="amount-toggle"
            onClick={() => setIsNeg(v => !v)}
            style={{ background: isNeg ? 'var(--red)' : 'var(--green)' }}
          >
            {isNeg ? '−' : '+'}
          </button>
          <div style={{ flex: 1, position: 'relative' }}>
            <input
              className="input"
              type="number"
              inputMode="decimal"
              placeholder="0,00"
              value={montant}
              onChange={e => setMontant(e.target.value)}
              style={{
                fontSize: 32,
                fontFamily: 'var(--mono)',
                fontWeight: 700,
                textAlign: 'center',
                color: isNeg ? 'var(--red)' : 'var(--green)',
                paddingRight: 40
              }}
              autoFocus
            />
            <span style={{ position: 'absolute', right: 16, top: '50%', transform: 'translateY(-50%)', fontSize: 22, color: 'var(--text3)' }}>€</span>
          </div>
        </div>

        {/* Date */}
        <div className="form-group">
          <label className="label">Date</label>
          <input className="input" type="date" value={date} onChange={e => setDate(e.target.value)} />
        </div>

        {/* Libellé */}
        <div className="form-group">
          <label className="label">Libellé</label>
          <input
            className="input"
            type="text"
            placeholder="Ex: Supermarché, Café, Médecin..."
            value={libelle}
            onChange={e => setLibelle(e.target.value)}
          />
        </div>

        {/* Catégorie */}
        <div className="form-group">
          <label className="label">Catégorie</label>
          <select className="select" value={categorieId} onChange={e => setCategorieId(e.target.value)}>
            <option value="">Non catégorisé</option>
            {categories.map(cat => (
              <option key={cat.id} value={cat.id}>{cat.icone} {cat.nom}</option>
            ))}
          </select>
        </div>

        {/* Note */}
        <div className="form-group">
          <label className="label">Note (optionnel)</label>
          <textarea
            className="input"
            placeholder="Commentaire libre..."
            value={note}
            onChange={e => setNote(e.target.value)}
            rows={2}
            style={{ resize: 'none' }}
          />
        </div>

        <button className="btn-primary" onClick={handleSubmit} disabled={!parsedMontant || loading}>
          {loading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
