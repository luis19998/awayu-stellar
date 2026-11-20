import { streamLedgers, DEFAULT_HORIZON } from "../horizon.js";
import { pickLang } from "../i18n.js";

const COPY = {
  es: { title: "Pulso de Stellar", subtitle: "Ledgers de testnet cerrándose en vivo", rate: "Ledgers / min", average: "Tiempo medio entre ledgers", operations: "operaciones", transactions: "transacciones", unavailable: "Flujo en vivo no disponible · consultando cada 5 segundos" },
  en: { title: "Stellar Pulse", subtitle: "Testnet ledgers, closing live", rate: "Ledgers / min", average: "Average close time", operations: "operations", transactions: "transactions", unavailable: "Live stream unavailable · checking every 5 seconds" },
};
for (const code of ["pt", "qu", "ay", "gn"]) COPY[code] = { ...COPY.es };

export function normalizeLedger(record = {}) {
  const rawTime = record.closed_at ?? record.closedAt ?? record.timestamp;
  const parsedTime = typeof rawTime === "string" ? Date.parse(rawTime) : Number(rawTime);
  return {
    sequence: Number(record.sequence ?? record.id ?? record.ledger_sequence ?? 0),
    operations: Number(record.operation_count ?? record.operations_count ?? record._embedded?.records?.length ?? 0),
    transactions: Number(record.successful_transaction_count ?? record.transaction_count ?? record.transactions_count ?? 0),
    closedAt: Number.isFinite(parsedTime) ? parsedTime : Date.now(),
  };
}

export function ledgerMetrics(ledgers, now = Date.now()) {
  const recent = ledgers.filter((ledger) => ledger.closedAt >= now - 60_000 && ledger.closedAt <= now + 1000);
  const ordered = [...ledgers].sort((a, b) => a.closedAt - b.closedAt);
  const gaps = ordered.slice(1).map((ledger, i) => ledger.closedAt - ordered[i].closedAt).filter((gap) => gap > 0);
  return {
    perMinute: recent.length,
    averageMs: gaps.length ? Math.round(gaps.reduce((sum, gap) => sum + gap, 0) / gaps.length) : null,
  };
}

export function ledgerRate(timestamps, now = Date.now(), windowMs = 60_000) {
  return timestamps.filter((time) => now - time <= windowMs && now >= time).length;
}

export function averageLedgerInterval(timestamps) {
  if (timestamps.length < 2) return 0;
  const ordered = [...timestamps].sort((a, b) => a - b);
  return (ordered.at(-1) - ordered[0]) / (ordered.length - 1);
}

export function scaleLedgerRing(sequence, min = 0, max = 1_000_000_000) {
  const value = Math.max(0, Number(sequence) || 0);
  return 28 + Math.min(1, Math.log10(value + 1) / Math.log10(max + 1)) * 80;
}

export function mount(container, { lang = "es" } = {}) {
  const copy = pickLang(COPY, lang);
  const root = document.createElement("section");
  root.style.cssText = "position:relative;width:100%;height:100%;min-height:300px;overflow:hidden;border-radius:18px;background:radial-gradient(ellipse at center,#1f1746 0%,#0a0818 72%);color:#fff;font:14px system-ui,sans-serif";
  const canvas = document.createElement("canvas");
  canvas.setAttribute("role", "img");
  canvas.setAttribute("aria-label", copy.subtitle);
  canvas.style.cssText = "position:absolute;inset:0;width:100%;height:100%";
  const heading = document.createElement("div");
  heading.style.cssText = "position:absolute;top:18px;left:20px;pointer-events:none";
  heading.innerHTML = `<strong style="font-size:20px;letter-spacing:.02em">${copy.title}</strong><div style="opacity:.7;margin-top:3px">${copy.subtitle}</div>`;
  const stats = document.createElement("div");
  stats.style.cssText = "position:absolute;right:20px;top:18px;display:flex;gap:20px;text-align:right;pointer-events:none";
  const status = document.createElement("div");
  status.style.cssText = "position:absolute;bottom:14px;left:18px;color:#f9c22e;font-size:12px;display:none";
  root.append(canvas, heading, stats, status); container.appendChild(root);
  const context = canvas.getContext("2d");
  const ledgers = [];
  let stopped = false; let visible = !document.hidden; let frame = 0; let pollTimer = 0;
  const reducedMotion = globalThis.matchMedia?.("(prefers-reduced-motion: reduce)");
  let streamClose;

  function resize() {
    const rect = root.getBoundingClientRect();
    const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(rect.width * ratio));
    canvas.height = Math.max(1, Math.round(rect.height * ratio));
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
  }
  function addLedger(raw) {
    const ledger = normalizeLedger(raw);
    if (!ledger.sequence || ledgers.some((item) => item.sequence === ledger.sequence)) return;
    ledgers.push({ ...ledger, arrivedAt: performance.now() });
    ledgers.sort((a, b) => a.closedAt - b.closedAt);
    while (ledgers.length > 50) ledgers.shift();
    renderStats();
    if (reducedMotion?.matches && visible && !frame) frame = requestAnimationFrame(draw);
  }
  function renderStats() {
    const metrics = ledgerMetrics(ledgers);
    const avg = metrics.averageMs == null ? "—" : `${(metrics.averageMs / 1000).toFixed(2)} s`;
    stats.innerHTML = `<div><div style="font-size:11px;opacity:.65">${copy.rate}</div><strong style="font-size:19px">${metrics.perMinute}</strong></div><div><div style="font-size:11px;opacity:.65">${copy.average}</div><strong style="font-size:19px">${avg}</strong></div>`;
  }
  async function pollLatest() {
    try {
      const response = await fetch(`${DEFAULT_HORIZON}/ledgers?order=desc&limit=1`, { headers: { Accept: "application/json" } });
      if (!response.ok) throw new Error(`Horizon ${response.status}`);
      const json = await response.json();
      const record = json._embedded?.records?.[0];
      if (record) addLedger(record);
    } catch { /* Retry on the next interval while the fallback is active. */ }
  }
  function beginPolling() {
    if (pollTimer || stopped) return;
    status.textContent = copy.unavailable; status.style.display = "block";
    pollLatest();
    if (visible) pollTimer = globalThis.setInterval(pollLatest, 5000);
  }
  try {
    streamClose = streamLedgers(addLedger);
    streamClose.source?.addEventListener?.("error", beginPolling);
    streamClose.source?.addEventListener?.("open", () => {
      if (pollTimer) globalThis.clearInterval(pollTimer);
      pollTimer = 0; status.style.display = "none";
    });
  } catch { beginPolling(); }

  function draw(time) {
    frame = 0;
    if (stopped || !visible) return;
    const width = root.clientWidth || 640;
    const height = root.clientHeight || 360;
    context.clearRect(0, 0, width, height);
    const cx = width * 0.5; const cy = height * 0.56;
    const maxRadius = Math.max(24, Math.min(width, height) * 0.39);
    const latest = ledgers.slice(-8).reverse();
    latest.forEach((ledger, index) => {
      const age = Math.max(0, time - ledger.arrivedAt);
      const phase = (reducedMotion?.matches ? 0.48 : age / 3200) + index * 0.09;
      const radius = 24 + (phase % 1) * maxRadius;
      const alpha = Math.max(0.08, 0.8 - (phase % 1) * 0.68);
      context.beginPath(); context.arc(cx, cy, radius, 0, Math.PI * 2);
      context.strokeStyle = `rgba(108,222,223,${alpha})`; context.lineWidth = 1.5 + (1 - phase % 1) * 2;
      context.shadowBlur = 18; context.shadowColor = "#5be5d1"; context.stroke(); context.shadowBlur = 0;
      if (index === 0) {
        context.textAlign = "center"; context.textBaseline = "middle";
        context.fillStyle = "#fff"; context.font = "600 22px system-ui"; context.fillText(`#${ledger.sequence}`, cx, cy - 9);
        context.fillStyle = "#bcb5e7"; context.font = "12px system-ui";
        context.fillText(`${ledger.operations} ${copy.operations} · ${ledger.transactions} ${copy.transactions}`, cx, cy + 15);
      }
    });
    if (!ledgers.length) {
      context.textAlign = "center"; context.textBaseline = "middle";
      context.fillStyle = "rgba(255,255,255,.68)"; context.font = "14px system-ui";
      context.fillText(english ? "Listening for the next ledger…" : "Escuchando el próximo ledger…", cx, cy);
    }
    if (!reducedMotion?.matches) frame = requestAnimationFrame(draw);
  }
  const observer = typeof ResizeObserver !== "undefined" ? new ResizeObserver(resize) : null;
  observer?.observe(root);
  const visibility = () => {
    visible = !document.hidden;
    if (visible) {
      if (status.style.display !== "none" && !pollTimer) pollTimer = globalThis.setInterval(pollLatest, 5000);
      if (!frame) frame = requestAnimationFrame(draw);
    } else {
      if (frame) { cancelAnimationFrame(frame); frame = 0; }
      if (pollTimer) { globalThis.clearInterval(pollTimer); pollTimer = 0; }
    }
  };
  const motionChange = () => {
    if (reducedMotion?.matches && frame) { cancelAnimationFrame(frame); frame = 0; }
    if (visible && !frame) frame = requestAnimationFrame(draw);
  };
  document.addEventListener("visibilitychange", visibility);
  reducedMotion?.addEventListener?.("change", motionChange);
  globalThis.addEventListener?.("resize", resize);
  resize(); renderStats();
  if (visible) frame = requestAnimationFrame(draw);
  return { destroy() {
    if (stopped) return;
    stopped = true; cancelAnimationFrame(frame); observer?.disconnect(); streamClose?.();
    if (pollTimer) globalThis.clearInterval(pollTimer);
    document.removeEventListener("visibilitychange", visibility);
    reducedMotion?.removeEventListener?.("change", motionChange);
    globalThis.removeEventListener?.("resize", resize);
    root.remove();
  } };
}
