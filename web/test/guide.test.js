import { describe, expect, it } from "vitest";
import { formatConsoleCall } from "../src/guide/devconsole.js";
import { HELP_TOPICS } from "../src/guide/help.js";
import { TOURS, validateSteps } from "../src/guide/tour.js";

describe("guía Awayu", () => {
  it("valida pasos completos y rechaza recorridos vacíos o incompletos", () => {
    expect(validateSteps([{ selector: "#panel", title: "Panel", text: "Resumen" }])).toBe(true);
    expect(validateSteps([])).toBe(false);
    expect(validateSteps([{ selector: "#panel", title: "", text: "Resumen" }])).toBe(false);
    expect(validateSteps(null)).toBe(false);
  });

  it("incluye los 25 temas de ayuda en castellano e inglés", () => {
    expect(Object.keys(HELP_TOPICS)).toHaveLength(25);
    for (const data of Object.values(HELP_TOPICS)) {
      for (const lang of ["es", "en"]) {
        expect(data.title[lang].trim()).not.toBe("");
        expect(data.steps[lang].length).toBeGreaterThanOrEqual(3);
        expect(data.steps[lang].every((line) => line.trim())).toBe(true);
      }
    }
  });

  it("define recorridos predefinidos con pasos válidos", () => {
    expect(Object.keys(TOURS)).toEqual(expect.arrayContaining(["firstVisit", "contributeAndPayout", "createCircle", "guarantee", "map", "passport"]));
    Object.values(TOURS).forEach((steps) => expect(validateSteps(steps)).toBe(true));
  });

  it("formatea llamadas como código con todos los valores escapados", () => {
    const formatted = formatConsoleCall({
      contract: 'C<script>alert("x")</script>',
      fn: "contribute",
      args: ["GABC", 7],
      status: "SUCCESS",
      network: "testnet",
    });
    expect(formatted).toContain("<span class=\"aw-guide-code-function\">contribute</span>");
    expect(formatted).toContain("&lt;script&gt;");
    expect(formatted).not.toContain("<script>");
    expect(formatted).toContain("SUCCESS");
    expect(formatted).toContain("GABC");
  });
});

import { existsSync } from "node:fs";
import { ROUTE_TOPICS } from "../src/guide/help.js";
describe("tutoriales por sección", () => {
  it("cada sección ofrece temas existentes y cada tema tiene su video y póster", () => {
    for (const ids of Object.values(ROUTE_TOPICS)) for (const id of ids) expect(HELP_TOPICS[id]).toBeTruthy();
    for (const id of Object.keys(HELP_TOPICS)) {
      expect(existsSync(new URL(`../public/tutoriales/${id}.webm`, import.meta.url))).toBe(true);
      expect(existsSync(new URL(`../public/tutoriales/${id}.jpg`, import.meta.url))).toBe(true);
    }
  });
});
