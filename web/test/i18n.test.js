import { describe, expect, it } from "vitest";
import { t } from "../src/i18n.js";

describe("t", () => {
  it("returns the Spanish key when the language is Spanish", () => {
    expect(t("Pagar el pozo")).toBe("Pagar el pozo");
  });

  it("fills in variables", () => {
    expect(t("Ronda {n}: {name} recibió {amount}", { n: 2, name: "Ana", amount: "10 XLM" })).toBe(
      "Ronda 2: Ana recibió 10 XLM"
    );
  });
});
