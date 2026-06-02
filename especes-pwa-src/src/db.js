import Dexie from 'dexie';

export const db = new Dexie('EspecesDB');

db.version(1).stores({
  operations: '++id, date, montant, libelle, categorieId, note, createdAt, updatedAt, bienRattache, voyageId',
  categories: '++id, nom, couleur, icone, ordre',
  parametres: 'cle'
});

// Catégories par défaut
export const CATEGORIES_DEFAULT = [
  { id: 1, nom: 'Alimentation', couleur: '#5B5BF6', icone: '🛒', ordre: 1 },
  { id: 2, nom: 'Transport', couleur: '#10B981', icone: '🚌', ordre: 2 },
  { id: 3, nom: 'Loisirs', couleur: '#8B5CF6', icone: '🎭', ordre: 3 },
  { id: 4, nom: 'Santé', couleur: '#EF4444', icone: '💊', ordre: 4 },
  { id: 5, nom: 'Logement', couleur: '#F59E0B', icone: '🏠', ordre: 5 },
  { id: 6, nom: 'Habillement', couleur: '#EC4899', icone: '👗', ordre: 6 },
  { id: 7, nom: 'Restaurant', couleur: '#F97316', icone: '🍽️', ordre: 7 },
  { id: 8, nom: 'Café', couleur: '#92400E', icone: '☕', ordre: 8 },
  { id: 9, nom: 'Boulangerie', couleur: '#D97706', icone: '🥖', ordre: 9 },
  { id: 10, nom: 'Supermarché', couleur: '#059669', icone: '🛒', ordre: 10 },
  { id: 11, nom: 'Courses', couleur: '#0EA5E9', icone: '🛍️', ordre: 11 },
  { id: 12, nom: 'Autres', couleur: '#6B7280', icone: '···', ordre: 12 },
];

export async function initDB() {
  const count = await db.categories.count();
  if (count === 0) {
    await db.categories.bulkPut(CATEGORIES_DEFAULT);
  }
}

export async function addOperation(op) {
  const now = new Date().toISOString();
  return db.operations.add({ ...op, createdAt: now, updatedAt: now });
}

export async function updateOperation(id, op) {
  return db.operations.update(id, { ...op, updatedAt: new Date().toISOString() });
}

export async function deleteOperation(id) {
  return db.operations.delete(id);
}

export async function getOperations({ dateDebut, dateFin, categorieId, search } = {}) {
  let query = db.operations.orderBy('date').reverse();
  const all = await query.toArray();
  return all.filter(op => {
    if (dateDebut && op.date < dateDebut) return false;
    if (dateFin && op.date > dateFin) return false;
    if (categorieId && op.categorieId !== categorieId) return false;
    if (search) {
      const s = search.toLowerCase();
      if (!op.libelle?.toLowerCase().includes(s)) return false;
    }
    return true;
  });
}

export async function exportCSV() {
  const ops = await db.operations.orderBy('date').reverse().toArray();
  const cats = await db.categories.toArray();
  const catMap = Object.fromEntries(cats.map(c => [c.id, c.nom]));
  const header = 'Date;Libellé;Montant;Catégorie;Note';
  const rows = ops.map(op =>
    [op.date, op.libelle || '', op.montant, catMap[op.categorieId] || '', op.note || ''].join(';')
  );
  return [header, ...rows].join('\n');
}
