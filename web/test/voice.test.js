import { describe, expect, it } from "vitest";
import { canListen, canSpeak, isSpeaking, listen, speak, stopSpeaking } from "../src/guide/voice.js";
describe("voice without browser support", () => {
  it("reports unsupported APIs and fails listening clearly", async () => {
    expect(canSpeak()).toBe(false); expect(canListen()).toBe(false); expect(isSpeaking()).toBe(false); expect(speak("hola")).toBe(false); expect(stopSpeaking()).toBeUndefined();
    await expect(listen()).rejects.toThrow(/no está disponible/i);
  });
});
