import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

class FakeAudioContext {
  static latest;

  constructor() {
    this.currentTime = 0;
    this.state = "running";
    this.destination = {};
    this.oscillators = [];
    FakeAudioContext.latest = this;
  }

  createOscillator() {
    const oscillator = {
      frequency: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(), start: vi.fn(), stop: vi.fn(),
    };
    this.oscillators.push(oscillator);
    return oscillator;
  }

  createGain() {
    return {
      gain: { setValueAtTime: vi.fn(), exponentialRampToValueAtTime: vi.fn() },
      connect: vi.fn(),
    };
  }
}

describe("sonido de Awayu", () => {
  let sound;

  beforeEach(async () => {
    vi.resetModules();
    globalThis.AudioContext = FakeAudioContext;
    globalThis.localStorage = {
      getItem: vi.fn(() => null),
      setItem: vi.fn(),
    };
    sound = await import("../src/sound.js");
  });

  afterEach(() => {
    delete globalThis.AudioContext;
    delete globalThis.localStorage;
  });

  it("prepara AudioContext sin reproducir sonido por sí solo", () => {
    expect(sound.initSound()).toBe(true);
    expect(sound.isMuted()).toBe(false);
  });

  it("genera efectos solo cuando se invocan expresamente", () => {
    sound.initSound();
    expect(FakeAudioContext.latest.oscillators).toHaveLength(0);
    sound.coin();
    sound.payout();
    sound.weave();
    sound.error();
    expect(FakeAudioContext.latest.oscillators).toHaveLength(11);
    expect(sound.isMuted()).toBe(false);
  });

  it("recuerda el silencio y no programa tonos mientras está silenciado", () => {
    sound.initSound();
    sound.setMuted(true);
    sound.coin();
    expect(FakeAudioContext.latest.oscillators).toHaveLength(0);
    expect(sound.isMuted()).toBe(true);
    expect(globalThis.localStorage.setItem).toHaveBeenCalledWith("awayu.sound.muted", "true");
  });

  it("tolera que localStorage lance excepciones", async () => {
    globalThis.localStorage.getItem.mockImplementation(() => { throw new Error("denegado"); });
    globalThis.localStorage.setItem.mockImplementation(() => { throw new Error("denegado"); });
    vi.resetModules();
    sound = await import("../src/sound.js");
    expect(sound.isMuted()).toBe(false);
    expect(() => sound.setMuted(true)).not.toThrow();
  });
});
