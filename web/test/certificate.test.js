import { describe, expect, it } from "vitest";
import { certificateData, MARK_LEGEND } from "../src/certificate.js";

describe("datos del certificado", () => {
  it("prepara nombre, historial, puntaje y datos de círculo", () => {
    const data = certificateData({
      name: "Rosa Quispe", history: [1, 2, 4], score: 58, circleId: "CAFE...", token: "XLM", amount: 10,
      date: "2026-11-18T00:00:00Z",
    });
    expect(data).toMatchObject({ name: "Rosa Quispe", history: [1, 2, 4], score: 58, circleId: "CAFE...", token: "XLM", amount: "10" });
    expect(data.date.toISOString()).toBe("2026-11-18T00:00:00.000Z");
  });

  it("usa valores seguros si faltan los datos opcionales", () => {
    expect(certificateData({})).toMatchObject({ name: "Integrante", history: [], score: 0, circleId: "", token: "", amount: "" });
  });

  it("incluye las cuatro marcas y sus significados", () => {
    expect(MARK_LEGEND.map(({ mark, label }) => [mark, label])).toEqual([
      [1, "A tiempo"], [2, "Tarde"], [3, "Faltó"], [4, "Cubierto por garantía"],
    ]);
  });
});
