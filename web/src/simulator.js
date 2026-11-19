// Simulador de pasanaku: qué significa cada turno en plata y en tiempo.
// Quien cobra temprano recibe un adelanto sin interés; quien cobra tarde
// está ahorrando. Todo es aritmética simple, sin datos externos.

/**
 * @param {{members:number, amount:number, periodDays:number, apy?:number}} p
 * @returns {{pot:number, total:number, turns:Array}}
 */
export function simulate({ members, amount, periodDays, apy = 0 }) {
  const n = Math.max(2, Math.min(50, Math.floor(members) || 2));
  const a = Math.max(0, Number(amount) || 0);
  const d = Math.max(1, Number(periodDays) || 1);
  const pot = n * a;
  const turns = [];
  for (let k = 1; k <= n; k++) {
    // Al cobrar en el turno k ya aportó k cuotas y le faltan n - k.
    const paidBefore = k * a;
    const advance = pot - paidBefore; // lo que recibe por adelantado (y devuelve después)
    const saved = (k - 1) * a; // lo que puso antes de cobrar, excluyendo la cuota del mismo turno
    turns.push({
      turn: k,
      day: k * d,
      receives: pot,
      advance: Math.max(0, advance),
      saved,
      role: k === n ? "ahorro" : k === 1 ? "adelanto" : advance >= saved ? "adelanto" : "ahorro",
    });
  }
  // Rendimiento estimado del pozo: en promedio espera media ronda antes de pagarse
  const yieldPerRound = pot * apy * (d / 2 / 365);
  return { pot, total: pot, turns, yieldPerRound, yieldTotal: yieldPerRound * n, days: n * d };
}

/** Barras SVG: adelanto (arriba) y ahorro (abajo) por turno. */
export function simulationSvg(sim, { width = 520, height = 200 } = {}) {
  const n = sim.turns.length;
  const max = Math.max(1, ...sim.turns.map((t) => Math.max(t.advance, t.saved)));
  const bw = (width - 40) / n;
  const mid = height / 2;
  const scale = (mid - 18) / max;
  const bars = sim.turns
    .map((t, i) => {
      const x = 30 + i * bw + bw * 0.15;
      const w = bw * 0.7;
      const up = t.advance * scale;
      const down = t.saved * scale;
      return `<rect x="${x.toFixed(1)}" y="${(mid - up).toFixed(1)}" width="${w.toFixed(1)}" height="${up.toFixed(1)}" rx="2" fill="#d81b60"><title>Turno ${t.turn}: adelanto ${t.advance}</title></rect>
<rect x="${x.toFixed(1)}" y="${mid}" width="${w.toFixed(1)}" height="${down.toFixed(1)}" rx="2" fill="#13a3b0"><title>Turno ${t.turn}: ahorro ${t.saved}</title></rect>
${n <= 16 ? `<text x="${(x + w / 2).toFixed(1)}" y="${height - 2}" font-size="10" text-anchor="middle" fill="currentColor">${t.turn}</text>` : ""}`;
    })
    .join("\n");
  return `<svg viewBox="0 0 ${width} ${height}" width="100%" role="img" aria-label="Adelanto y ahorro por turno">
<line x1="26" x2="${width - 6}" y1="${mid}" y2="${mid}" stroke="currentColor" stroke-opacity=".3"/>
<text x="0" y="14" font-size="10" fill="#d81b60">adelanto</text>
<text x="0" y="${height - 14}" font-size="10" fill="#13a3b0">ahorro</text>
${bars}
</svg>`;
}
