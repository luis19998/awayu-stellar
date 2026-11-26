// Puntaje de historial idéntico al del contrato `pasanaku` (score_of en Rust):
// a tiempo 100, tarde 50, cubierto por garantía 25, faltó 0, y división ENTERA
// (el contrato redondea hacia abajo). Se usa en el reporte y en el pasaporte.
export const MARK_POINTS = Object.freeze({ 1: 100, 2: 50, 3: 0, 4: 25 });

export function scoreOf(history = []) {
  if (!history.length) return 0;
  const total = history.reduce((sum, mark) => sum + (MARK_POINTS[mark] ?? 0), 0);
  return Math.floor(total / history.length);
}

export function summarize(history = []) {
  const counts = { 1: 0, 2: 0, 3: 0, 4: 0 };
  for (const mark of history) if (counts[mark] !== undefined) counts[mark] += 1;
  return { counts, total: history.length, score: scoreOf(history) };
}
