import { tilt } from "./loom.js";

const REVEAL_SELECTOR = "[data-reveal], .pane > section, .card, .card-c, .eco-c, .trad, .uso, .step, .kpi, .jueces, .planet-legend li";
const COUNTER_SELECTOR = "#kpis b[data-k], [data-count], #passport .score-ring b";
const THREADS = ["#d81b60", "#f9c22e", "#13a3b0", "#1f9d55", "#5b2a86"];
const reducedQuery = "(prefers-reduced-motion: reduce)";

let activeCleanup = null;

export function motionReduced(root = globalThis.document?.documentElement) {
  if (root?.classList?.contains("aw-calm") || root?.dataset?.motion === "reduced") return true;
  try {
    if (JSON.parse(globalThis.localStorage?.getItem("awayu.studio") || "{}").calm) return true;
  } catch { /* Preferencias no disponibles. */ }
  return Boolean(globalThis.matchMedia?.(reducedQuery)?.matches);
}

function numericValue(element) {
  const text = element.textContent?.trim().replace(/[\s,]/g, "") || "";
  if (!/^\d+(?:\.\d+)?$/.test(text)) return null;
  const value = Number(text);
  return Number.isFinite(value) ? value : null;
}

function countFromZero(element, done) {
  const target = numericValue(element);
  if (target === null) return;
  if (motionReduced(element.ownerDocument.documentElement)) return;
  const locale = element.closest("[lang]")?.lang || undefined;
  const formatter = new Intl.NumberFormat(locale, { maximumFractionDigits: 2 });
  let frame = 0;
  let start = 0;
  const tick = (now) => {
    if (motionReduced(element.ownerDocument.documentElement)) {
      element.textContent = formatter.format(target);
      done();
      return;
    }
    if (!start) start = now;
    const progress = Math.min(1, (now - start) / 900);
    const eased = 1 - Math.pow(1 - progress, 3);
    element.textContent = formatter.format(target * eased);
    if (progress < 1) frame = requestAnimationFrame(tick);
    else { element.textContent = formatter.format(target); done(); }
  };
  element.textContent = formatter.format(0);
  frame = requestAnimationFrame(tick);
  return () => cancelAnimationFrame(frame);
}

/** Prepara una vista para revelar sus piezas al entrar en el área visible. */
export function revealView(root, options = {}) {
  activeCleanup?.();
  activeCleanup = null;
  if (!root || motionReduced(root.ownerDocument.documentElement)) return () => {};

  const IO = options.IntersectionObserver || globalThis.IntersectionObserver;
  const MO = options.MutationObserver || globalThis.MutationObserver;
  const observed = new WeakSet();
  const counters = new WeakMap();
  const counterTargets = new WeakSet();
  const pendingCounters = new Set();
  const startCounter = (element) => {
    if (counters.get(element) !== "pending") return;
    let cancel;
    cancel = countFromZero(element, () => { if (cancel) pendingCounters.delete(cancel); counters.set(element, null); });
    if (cancel) { pendingCounters.add(cancel); counters.set(element, cancel); }
    else counters.set(element, null);
  };
  const observer = typeof IO === "function" ? new IO((entries) => {
    for (const entry of entries) {
      if (!entry.isIntersecting) continue;
      if (counterTargets.has(entry.target)) {
        counterTargets.delete(entry.target);
        startCounter(entry.target);
        observer.unobserve(entry.target);
        continue;
      }
      entry.target.classList.add("is-visible");
      entry.target.classList.remove("is-reveal-pending");
      observer.unobserve(entry.target);
    }
  }, { threshold: 0.12, rootMargin: "0px 0px -7% 0px" }) : null;

  let delayIndex = 0;
  const revealElement = (element) => {
    if (element?.nodeType !== 1 || observed.has(element)) return;
    observed.add(element);
    if (!element.style.getPropertyValue("--d")) {
      element.style.setProperty("--d", `${(delayIndex++ % 8) * 55}ms`);
      element.dataset.motionDelay = "auto";
    }
    if (observer) {
      element.classList.add("is-reveal-pending");
      observer.observe(element);
    } else element.classList.add("is-visible");
  };

  const countElement = (element) => {
    if (counters.has(element)) return;
    const value = numericValue(element);
    if (value === null) return;
    counters.set(element, "pending");
    if (observer) {
      counterTargets.add(element);
      observer.observe(element);
    } else startCounter(element);
  };

  const scan = (node = root) => {
    if (node.nodeType !== 1) return;
    if (node.matches(REVEAL_SELECTOR)) revealElement(node);
    if (node.matches(COUNTER_SELECTOR)) countElement(node);
    node.querySelectorAll(REVEAL_SELECTOR).forEach(revealElement);
    node.querySelectorAll(COUNTER_SELECTOR).forEach(countElement);
  };
  scan(root);

  const mutationObserver = typeof MO === "function" ? new MO((mutations) => {
    for (const mutation of mutations) {
      if (mutation.type === "childList") {
        if (mutation.target.nodeType === 1 && mutation.target.matches(COUNTER_SELECTOR)) countElement(mutation.target);
        mutation.addedNodes.forEach(scan);
      }
      else if (mutation.type === "characterData") {
        const parent = mutation.target.parentElement;
        if (parent?.matches(COUNTER_SELECTOR)) countElement(parent);
      }
    }
  }) : null;
  mutationObserver?.observe(root, { childList: true, characterData: true, subtree: true });

  const disposeTilt = tilt(root, ".trad, .uso, .card-c");
  const rippleTimers = new Map();
  const ripple = (event) => {
    if (event.detail === 0 || motionReduced(root.ownerDocument.documentElement)) return;
    const button = event.target.closest?.(".btn, button.primary");
    if (!button || button.disabled) return;
    const box = button.getBoundingClientRect();
    button.style.setProperty("--wave-x", `${Math.max(0, Math.min(100, (event.clientX - box.left) / Math.max(1, box.width) * 100))}%`);
    button.style.setProperty("--wave-y", `${Math.max(0, Math.min(100, (event.clientY - box.top) / Math.max(1, box.height) * 100))}%`);
    button.classList.remove("is-rippling");
    void button.offsetWidth;
    button.classList.add("is-rippling");
    clearTimeout(rippleTimers.get(button));
    rippleTimers.set(button, setTimeout(() => { button.classList.remove("is-rippling"); rippleTimers.delete(button); }, 540));
  };
  root.addEventListener("click", ripple);

  const cleanup = () => {
    observer?.disconnect();
    mutationObserver?.disconnect();
    pendingCounters.forEach((cancel) => cancel());
    pendingCounters.clear();
    disposeTilt();
    root.removeEventListener("click", ripple);
    rippleTimers.forEach(clearTimeout);
    rippleTimers.clear();
    root.querySelectorAll(".is-reveal-pending, .is-visible").forEach((element) => {
      element.classList.remove("is-reveal-pending", "is-visible");
      if (element.dataset.motionDelay === "auto") {
        element.style.removeProperty("--d");
        delete element.dataset.motionDelay;
      }
    });
    root.querySelectorAll(".is-rippling").forEach((element) => element.classList.remove("is-rippling"));
    if (activeCleanup === cleanup) activeCleanup = null;
  };
  activeCleanup = cleanup;
  return cleanup;
}

/** Hilos ligeros para el hero; se detienen al ocultar la pestaña o reducir movimiento. */
export function mountHeroThreads(canvas, { count = 30 } = {}) {
  const ctx = canvas?.getContext?.("2d");
  if (!ctx) return { destroy() {} };
  const doc = canvas.ownerDocument;
  const win = doc.defaultView;
  const dpr = Math.min(win?.devicePixelRatio || 1, 1.5);
  const particles = Array.from({ length: Math.min(40, Math.max(0, count)) }, (_, i) => ({
    x: Math.random(), y: Math.random(),
    vx: (Math.random() - 0.5) * 0.00013,
    vy: (Math.random() - 0.5) * 0.00009,
    size: 1 + Math.random() * 1.7,
    color: THREADS[i % THREADS.length],
    phase: Math.random() * Math.PI * 2,
  }));
  let width = 1;
  let height = 1;
  let frame = 0;
  let onScreen = !doc.hidden;
  let stopped = false;
  let last = 0;

  const resize = () => {
    const box = canvas.getBoundingClientRect();
    width = Math.max(1, box.width);
    height = Math.max(1, box.height);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    draw(0, false);
  };
  const draw = (now, move = true) => {
    ctx.clearRect(0, 0, width, height);
    for (const particle of particles) {
      if (move) {
        particle.x = (particle.x + particle.vx * Math.max(1, now - last) + 1) % 1;
        particle.y = (particle.y + particle.vy * Math.max(1, now - last) + 1) % 1;
        particle.phase += 0.018;
      }
      const x = particle.x * width;
      const y = particle.y * height;
      const alpha = 0.2 + (Math.sin(particle.phase) + 1) * 0.16;
      ctx.globalAlpha = alpha;
      ctx.strokeStyle = particle.color;
      ctx.lineWidth = particle.size;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x - particle.vx * width * 130, y - particle.vy * height * 130);
      ctx.stroke();
      ctx.fillStyle = particle.color;
      ctx.beginPath();
      ctx.arc(x, y, particle.size, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  };
  const reduced = () => motionReduced(doc.documentElement);
  const animate = (now) => {
    frame = 0;
    if (stopped || !onScreen || doc.hidden || reduced()) return;
    if (now - last >= 1000 / 30) {
      draw(now);
      last = now;
    }
    frame = win.requestAnimationFrame(animate);
  };
  const stop = () => { if (frame) win.cancelAnimationFrame(frame); frame = 0; };
  const start = () => {
    stop();
    if (stopped || !onScreen || doc.hidden) return;
    if (reduced()) { draw(0, false); return; }
    frame = win.requestAnimationFrame(animate);
  };
  const visibility = () => { onScreen = !doc.hidden; start(); };
  const media = win.matchMedia?.(reducedQuery);
  const motionChange = () => start();
  const classObserver = typeof win.MutationObserver === "function" ? new win.MutationObserver(motionChange) : null;
  classObserver?.observe(doc.documentElement, { attributes: true, attributeFilter: ["class"] });
  const resizeObserver = typeof win.ResizeObserver === "function" ? new win.ResizeObserver(resize) : null;
  resizeObserver?.observe(canvas);
  if (!resizeObserver) win.addEventListener("resize", resize);
  const viewportObserver = typeof win.IntersectionObserver === "function" ? new win.IntersectionObserver(([entry]) => {
    onScreen = Boolean(entry?.isIntersecting);
    start();
  }) : null;
  viewportObserver?.observe(canvas);
  media?.addEventListener?.("change", motionChange);
  doc.addEventListener("visibilitychange", visibility);
  resize();
  start();

  return {
    destroy() {
      stopped = true;
      stop();
      classObserver?.disconnect();
      resizeObserver?.disconnect();
      viewportObserver?.disconnect();
      media?.removeEventListener?.("change", motionChange);
      doc.removeEventListener("visibilitychange", visibility);
      win.removeEventListener("resize", resize);
    },
  };
}
