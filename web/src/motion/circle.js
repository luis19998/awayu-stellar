import { motionReduced } from "./reveal.js";

/** Conserva la ronda y las longitudes por socio, incluso cuando la vista rehace la lista. */
export function createCircleFeedback(panel) {
  let previousCircle;
  let previousRound;
  let histories = new Map();
  const roundBox = panel.querySelector("#s-round").parentElement;
  roundBox.addEventListener("animationend", () => roundBox.classList.remove("round-changed"));

  return (circle) => {
    const key = circle.contractId || circle;
    const sameCircle = previousCircle === key;
    const animate = sameCircle && panel.ownerDocument.body.dataset.route === "circulo" && !motionReduced();
    if (animate && circle.round > previousRound) roundBox.classList.add("round-changed");
    else if (!animate) roundBox.classList.remove("round-changed");

    const now = performance.now();
    const rows = panel.querySelector("#members").children;
    const next = new Map();
    circle.members.forEach((member, index) => {
      const length = member.history.length;
      const old = sameCircle ? histories.get(member.address) : null;
      // Un refresco de saldo puede volver a crear la fila durante la animación.
      const added = animate && old && length > old.length;
      const start = added ? now : old?.start;
      const from = added ? old.length : old?.from;
      if (animate && start != null && now - start < 580) {
        const strip = rows[index]?.querySelector("img");
        if (strip) {
          strip.classList.add("mark-added");
          strip.style.setProperty("--mark-delay", `${start - now}ms`);
          // historyStripDataURL reserva al menos seis espacios en el tejido.
          const cell = 100 / Math.max(length, 6);
          strip.style.setProperty("--mark-start", `${100 - from * cell}%`);
          strip.style.setProperty("--mark-end", `${100 - length * cell}%`);
        }
      }
      next.set(member.address, { length, start, from });
    });
    previousCircle = key;
    previousRound = circle.round;
    histories = next;
  };
}

/** Ráfaga corta que comparte el ancho de los controles, también en el panel móvil. */
export function playPayoutThreads(actions) {
  const doc = actions.ownerDocument;
  if (doc.hidden || doc.body.dataset.route !== "circulo" || motionReduced()) return;
  let canvas = actions.querySelector(".payout-threads");
  if (canvas && !canvas.hidden) return;
  if (!canvas) {
    canvas = doc.createElement("canvas");
    canvas.className = "payout-threads";
    canvas.setAttribute("aria-hidden", "true");
    actions.append(canvas);
  }
  canvas.hidden = false;
  const ctx = canvas.getContext("2d");
  const width = canvas.clientWidth;
  const height = canvas.clientHeight;
  if (!ctx || !width || !height) { canvas.hidden = true; return; }
  const dpr = Math.min(window.devicePixelRatio || 1, 1.5);
  canvas.width = Math.round(width * dpr);
  canvas.height = Math.round(height * dpr);
  ctx.scale(dpr, dpr);
  const styles = getComputedStyle(actions);
  const colors = ["--gold", "--teal", "--magenta", "--ink"].map((name) => styles.getPropertyValue(name).trim());
  const threads = Array.from({ length: 26 }, (_, i) => ({
    dx: (Math.random() - .64) * width * .9,
    rise: (.48 + Math.random() * .46) * height,
    twist: Math.random() * 8,
    length: 4 + Math.random() * 6,
    color: colors[i % colors.length],
  }));
  const start = performance.now();
  const draw = (now) => {
    const p = (now - start) / 1500;
    if (p >= 1 || doc.hidden || doc.body.dataset.route !== "circulo" || motionReduced()) {
      canvas.hidden = true;
      return;
    }
    ctx.clearRect(0, 0, width, height);
    ctx.globalAlpha = Math.min(1, (1 - p) * 3);
    ctx.lineWidth = 2;
    ctx.lineCap = "round";
    for (const thread of threads) {
      const x = width * .74 + thread.dx * p;
      const y = height * .9 - 4 * thread.rise * p * (1 - p);
      const angle = thread.twist + p * 7;
      ctx.strokeStyle = thread.color;
      ctx.beginPath();
      ctx.moveTo(x, y);
      ctx.lineTo(x + thread.length * Math.cos(angle), y + thread.length * Math.sin(angle));
      ctx.stroke();
    }
    requestAnimationFrame(draw);
  };
  requestAnimationFrame(draw);
}
