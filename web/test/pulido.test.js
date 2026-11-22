// @vitest-environment jsdom
import { afterEach, beforeEach, expect, it, vi } from "vitest";
import { mountTabIndicator } from "../src/motion/tabs.js";
import { createCircleFeedback, playPayoutThreads } from "../src/motion/circle.js";

beforeEach(() => {
  document.body.dataset.route = "circulo";
  document.body.innerHTML = '<aside><div><b id="s-round"></b></div><ul id="members"><li><img></li></ul><div class="actions"></div></aside>';
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});
afterEach(() => {
  document.documentElement.classList.remove("aw-calm");
  document.body.replaceChildren();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

it.each(["aria-selected", "aria-pressed"])("el indicador sigue %s al reemplazar pestañas y al cambiar de fila", async (attr) => {
  const list = document.createElement("div");
  document.body.append(list);
  function tab(x, y, width) {
    const button = document.createElement("button");
    for (const [prop, value] of Object.entries({ offsetLeft: x, offsetTop: y, offsetWidth: width, offsetHeight: 32 })) {
      Object.defineProperty(button, prop, { value });
    }
    button.setAttribute(attr, "true");
    return button;
  }
  list.append(tab(0, 0, 88));
  const stop = mountTabIndicator(list);
  expect(list.classList.contains("has-tab-indicator")).toBe(true);
  expect(list.style.getPropertyValue("--tab-width")).toBe("60px");
  list.addEventListener("click", () => list.replaceChildren(tab(20, 38, 102)), { once: true });
  list.firstChild.focus();
  list.firstChild.click();
  await Promise.resolve();
  expect(document.activeElement).toBe(list.firstChild);
  expect(list.style.getPropertyValue("--tab-x")).toBe("34px");
  expect(list.style.getPropertyValue("--tab-y")).toBe("66px");
  list.firstChild.setAttribute(attr, "false");
  await Promise.resolve();
  expect(list.classList.contains("has-tab-indicator")).toBe(false);
  stop();
  list.replaceChildren(tab(100, 0, 80));
  await Promise.resolve();
  expect(list.classList.contains("has-tab-indicator")).toBe(false);
});

it("anima solo avances del mismo círculo y revela la marca en su lugar del aguayo", () => {
  const panel = document.querySelector("aside");
  const update = createCircleFeedback(panel);
  const circle = { contractId: "A", round: 2, members: [{ address: "socia", history: [1, 2] }] };
  update(circle);
  expect(panel.querySelector(".mark-added, .round-changed")).toBeNull();
  circle.members[0].history.push(1);
  update({ ...circle, round: 3 });
  expect(panel.querySelector(".round-changed")).toBeTruthy();
  expect(parseFloat(panel.querySelector(".mark-added").style.getPropertyValue("--mark-end"))).toBe(50);
  panel.querySelector("img").replaceWith(document.createElement("img"));
  update({ ...circle, round: 3 });
  expect(panel.querySelector(".mark-added")).toBeTruthy();
  panel.querySelector("img").replaceWith(document.createElement("img"));
  update({ ...circle, round: 7, contractId: "B" });
  expect(panel.querySelector(".mark-added, .round-changed")).toBeNull();
});

it("deja de dibujar los hilos al terminar el pago o al activar Menos movimiento", () => {
  const actions = document.querySelector(".actions");
  let frame;
  vi.stubGlobal("requestAnimationFrame", (cb) => { frame = cb; });
  const ctx = { scale: vi.fn(), clearRect: vi.fn(), beginPath: vi.fn(), moveTo: vi.fn(), lineTo: vi.fn(), stroke: vi.fn() };
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(ctx);
  vi.spyOn(Element.prototype, "clientWidth", "get").mockReturnValue(300);
  vi.spyOn(Element.prototype, "clientHeight", "get").mockReturnValue(140);
  vi.spyOn(performance, "now").mockReturnValue(100);
  playPayoutThreads(actions);
  const canvas = actions.querySelector("canvas");
  expect(canvas.getAttribute("aria-hidden")).toBe("true");
  frame(600);
  expect(ctx.stroke).toHaveBeenCalled();
  frame(1600);
  expect(canvas.hidden).toBe(true);
  playPayoutThreads(actions);
  expect(canvas.hidden).toBe(false);
  document.documentElement.classList.add("aw-calm");
  frame(700);
  expect(canvas.hidden).toBe(true);
  playPayoutThreads(actions);
  expect(canvas.hidden).toBe(true);
  expect(actions.children).toHaveLength(1);
});
