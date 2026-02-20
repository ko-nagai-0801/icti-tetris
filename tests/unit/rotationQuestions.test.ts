import { describe, expect, it } from "vitest";
import { getRotationQuestions } from "../../lib/rotationQuestions";

const trimMatrix = (matrix: number[][]): number[][] => {
  let minRow = matrix.length;
  let maxRow = -1;
  let minCol = matrix[0]?.length ?? 0;
  let maxCol = -1;

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 1) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  if (maxRow === -1) {
    return [[0]];
  }

  return matrix.slice(minRow, maxRow + 1).map((row) => row.slice(minCol, maxCol + 1));
};

const matrixKey = (matrix: number[][]): string => {
  return trimMatrix(matrix)
    .map((row) => row.join(""))
    .join("|");
};

describe("rotation questions", () => {
  it("returns requested number of questions", () => {
    const questions = getRotationQuestions(3);
    expect(questions).toHaveLength(3);
  });

  it("contains exactly one correct option and no duplicated shapes", () => {
    const questions = getRotationQuestions(3);

    for (const question of questions) {
      const correctCount = question.options.filter((option) => option.id === question.correctOptionId).length;
      expect(correctCount).toBe(1);

      const optionKeys = question.options.map((option) => matrixKey(option.matrix));
      const unique = new Set(optionKeys);
      expect(unique.size).toBe(question.options.length);
    }
  });
});
