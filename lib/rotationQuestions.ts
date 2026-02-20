export type RotationOption = {
  id: string;
  label: string;
  matrix: number[][];
};

export type RotationQuestion = {
  id: string;
  title: string;
  targetLabel: string;
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

const mirrorHorizontal = (matrix: number[][]): number[][] => {
  return matrix.map((row) => [...row].reverse());
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

type QuestionOption = {
  matrix: number[][];
  isCorrect: boolean;
};

const buildQuestion = ({
  id,
  title,
  targetLabel,
  base,
  options
}: {
  id: string;
  title: string;
  targetLabel: string;
  base: number[][];
  options: [QuestionOption, QuestionOption, QuestionOption, QuestionOption];
}): RotationQuestion => {
  const normalizedOptions: RotationOption[] = options.map((option, index) => {
    return {
      id: `${id}_opt_${index + 1}`,
      label: String.fromCharCode(65 + index),
      matrix: clone(option.matrix)
    };
  });
  const correctOptionIndex = options.findIndex((option) => option.isCorrect);

  return {
    id,
    title,
    targetLabel,
    base: clone(base),
    options: normalizedOptions,
    correctOptionId: normalizedOptions[correctOptionIndex]?.id ?? normalizedOptions[0]?.id ?? ""
  };
};

const QUESTIONS: RotationQuestion[] = [
  buildQuestion({
    id: "q1",
    title: "問題1",
    targetLabel: "L字を右に90°回転した結果を選ぶ",
    base: L_SHAPE,
    options: [
      { matrix: rotateTimes(L_SHAPE, 0), isCorrect: false },
      { matrix: rotateTimes(L_SHAPE, 3), isCorrect: false },
      { matrix: rotateTimes(L_SHAPE, 1), isCorrect: true },
      { matrix: rotateTimes(L_SHAPE, 2), isCorrect: false }
    ]
  }),
  buildQuestion({
    id: "q2",
    title: "問題2",
    targetLabel: "Z字を右に90°回転した結果を選ぶ",
    base: Z_SHAPE,
    options: [
      { matrix: rotateTimes(Z_SHAPE, 0), isCorrect: false },
      { matrix: mirrorHorizontal(rotateTimes(Z_SHAPE, 1)), isCorrect: false },
      { matrix: rotateTimes(Z_SHAPE, 1), isCorrect: true },
      { matrix: mirrorHorizontal(rotateTimes(Z_SHAPE, 0)), isCorrect: false }
    ]
  }),
  buildQuestion({
    id: "q3",
    title: "問題3",
    targetLabel: "T字を右に270°回転した結果を選ぶ",
    base: T_SHAPE,
    options: [
      { matrix: rotateTimes(T_SHAPE, 2), isCorrect: false },
      { matrix: rotateTimes(T_SHAPE, 3), isCorrect: true },
      { matrix: rotateTimes(T_SHAPE, 0), isCorrect: false },
      { matrix: rotateTimes(T_SHAPE, 1), isCorrect: false }
    ]
  })
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
