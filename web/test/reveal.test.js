// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { revealView } from "../src/motion/reveal.js";

class FakeIntersectionObserver {
  static instances = [];
  constructor(callback, options) {
    this.callback = callback;
    this.options = options;
    this.targets = new Set();
    FakeIntersectionObserver.instances.push(this);
  }
  observe(target) { this.targets.add(target); }
  unobserve(target) { this.targets.delete(target); }
  disconnect() { this.targets.clear(); }
  enter(target, isIntersecting = true) { this.callback([{ target, isIntersecting }], this); }
}

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("aw-calm");
  document.body.innerHTML = `<main id="view"><section class="pane"><section data-reveal>contenido</section><a class="trad" href="#">Pasanaku</a></section></main>`;
  FakeIntersectionObserver.instances = [];
  vi.stubGlobal("matchMedia", () => ({ matches: false }));
});

afterEach(() => {
  document.body.innerHTML = "";
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe("reveal de vistas", () => {
  it("espera la intersección y revela los elementos en pantalla", () => {
    const root = document.querySelector("#view");
    const cleanup = revealView(root, { IntersectionObserver: FakeIntersectionObserver });
    const paneSection = root.querySelector("[data-reveal]");
    const tradition = root.querySelector(".trad");
    const observer = FakeIntersectionObserver.instances[0];

    expect(observer).toBeDefined();
    expect(observer.options.threshold).toBe(0.12);
    expect(paneSection.classList.contains("is-reveal-pending")).toBe(true);
    expect(tradition.style.getPropertyValue("--d")).not.toBe("");

    observer.enter(paneSection);
    expect(paneSection.classList.contains("is-visible")).toBe(true);
    expect(paneSection.classList.contains("is-reveal-pending")).toBe(false);
    cleanup();
  });

  it("no agrega clases de animación si está activo Menos movimiento", () => {
    document.documentElement.classList.add("aw-calm");
    const root = document.querySelector("#view");
    const cleanup = revealView(root, { IntersectionObserver: FakeIntersectionObserver });

    expect(FakeIntersectionObserver.instances).toHaveLength(0);
    expect(root.querySelector(".is-visible, .is-reveal-pending")).toBeNull();
    expect(root.querySelector("[data-motion-delay]")).toBeNull();
    cleanup();
  });
});
