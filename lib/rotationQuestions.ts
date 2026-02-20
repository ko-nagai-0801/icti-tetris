export type RotationOption = {
  id: string;
  matrix: number[][];
};

export type RotationQuestion = {
  id: string;
  title: string;
  prompt: string;
  base: number[][];
  options: RotationOption[];
  correctOptionId: string;
};

const clone = (matrix: number[][]): number[][] => {
  return matrix.map((row) => [...row]);
};

const rotateCW = (matrix: number[][]): number[][] => {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array<number>(size).fill(0));

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const source = matrix[size - 1 - col];
      rotated[row][col] = source?.[row] ?? 0;
    }
  }

  return rotated;
};

const rotateTimes = (matrix: number[][], times: number): number[][] => {
  let out = clone(matrix);
  for (let i = 0; i < times; i += 1) {
    out = rotateCW(out);
  }
  return out;
};

const L_SHAPE = [
  [1, 0, 0],
  [1, 1, 1],
  [0, 0, 0]
];

const Z_SHAPE = [
  [1, 1, 0],
  [0, 1, 1],
  [0, 0, 0]
];

const T_SHAPE = [
  [0, 1, 0],
  [1, 1, 1],
  [0, 0, 0]
];

const buildQuestion = (
  id: string,
  title: string,
  base: number[][],
  targetTurns: number,
  optionTurns: [number, number, number, number]
): RotationQuestion => {
  const options: RotationOption[] = optionTurns.map((turns, index) => {
    return {
      id: `${id}_opt_${index + 1}`,
      matrix: rotateTimes(base, turns)
    };
  });

  const correctOptionIndex = optionTurns.findIndex((turns) => turns === targetTurns);

  return {
    id,
    title,
    prompt: "左の形を時計回りに回したとき、指定の向きになる選択肢を選んでください。",
    base: clone(base),
    options,
    correctOptionId: options[correctOptionIndex]?.id ?? options[0]?.id ?? ""
  };
};

const QUESTIONS: RotationQuestion[] = [
  buildQuestion("q1", "問題1: L字を90°回転", L_SHAPE, 1, [1, 0, 2, 3]),
  buildQuestion("q2", "問題2: Z字を180°回転", Z_SHAPE, 2, [3, 2, 1, 0]),
  buildQuestion("q3", "問題3: T字を270°回転", T_SHAPE, 3, [0, 3, 1, 2])
];

export const getRotationQuestions = (count: number): RotationQuestion[] => {
  return QUESTIONS.slice(0, count).map((question) => {
    return {
      ...question,
      base: clone(question.base),
      options: question.options.map((option) => ({
        ...option,
        matrix: clone(option.matrix)
      }))
    };
  });
};
