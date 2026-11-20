import { describe, expect, it } from "vitest";
import { DICTS, LANGS, getLang, pickLang, setLang, t } from "../src/i18n.js";
import { HELP_TOPICS } from "../src/guide/help.js";

describe("t", () => {
  it("returns the Spanish key when the language is Spanish", () => {
    expect(t("Pagar el pozo")).toBe("Pagar el pozo");
  });

  it("fills in variables", () => {
    expect(t("Ronda {n}: {name} recibió {amount}", { n: 2, name: "Ana", amount: "10 XLM" })).toBe(
      "Ronda 2: Ana recibió 10 XLM"
    );
  });

  it("supports six language codes", () => {
    expect(LANGS.map(({ code }) => code)).toEqual(["es", "en", "pt", "qu", "ay", "gn"]);
  });

  it("accepts each language and falls back to Spanish values", () => {
    for (const { code } of LANGS) {
      setLang(code);
      expect(getLang()).toBe(code);
    }
    setLang("unknown");
    expect(getLang()).toBe("es");
    expect(pickLang({ es: "Español" }, "qu")).toBe("Español");
    setLang("es");
  });

  it("keeps every dictionary on the same Spanish source keys", () => {
    const keys = Object.keys(DICTS.en).sort();
    for (const language of ["pt", "qu", "ay", "gn"]) {
      expect(Object.keys(DICTS[language]).sort()).toEqual(keys);
    }
  });

  it("provides titles and steps for all six languages in every help topic", () => {
    const languages = ["es", "en", "pt", "qu", "ay", "gn"];
    for (const topic of Object.values(HELP_TOPICS)) {
      for (const language of languages) {
        expect(topic.title[language]).toEqual(expect.any(String));
        expect(topic.title[language].trim()).not.toBe("");
        expect(topic.steps[language].length).toBeGreaterThan(0);
        expect(topic.steps[language].every((step) => step.trim())).toBe(true);
      }
    }
  });
});
