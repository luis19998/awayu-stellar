import { describe, expect, it } from "vitest";
import { generatePattern } from "../src/games/tejido.js";
import { MESSAGES as quizMessages, validateQuestions } from "../src/games/quiz.js";
import { countHistogram, drawPosition } from "../src/games/ruleta.js";

describe("lógica pura de juegos", () => {
  it("tiene 12 preguntas completas en castellano e inglés", () => {
    expect(validateQuestions(quizMessages.es.questions)).toBe(true);
    expect(validateQuestions(quizMessages.en.questions)).toBe(true);
    expect(validateQuestions(quizMessages.es.questions.slice(1))).toBe(false);
  });
  it("genera patrones repetibles con los colores de PALETTE", () => {
    expect(generatePattern(2, 17)).toEqual(generatePattern(2, 17));
    expect(generatePattern(2, 17)).toHaveLength(4);
    expect(generatePattern(1, 17)).not.toEqual([]);
  });
  it("cuenta el histograma e implementa una posición repetible", () => {
    expect(countHistogram([0, 1, 1, 4, -1], 3)).toEqual([1, 2, 0]);
    expect(drawPosition(8, 99)).toBe(drawPosition(8, 99));
    expect(drawPosition(0, 99)).toBeNull();
  });
});
