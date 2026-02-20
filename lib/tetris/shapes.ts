import type { CellValue, PieceMatrix, PieceType } from "@/lib/tetris/types";

export const PIECE_ORDER: PieceType[] = ["I", "O", "T", "S", "Z", "J", "L"];

const SHAPES: Record<PieceType, PieceMatrix> = {
  I: [
    [0, 0, 0, 0],
    [1, 1, 1, 1],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  O: [
    [0, 1, 1, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  T: [
    [0, 1, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  S: [
    [0, 1, 1, 0],
    [1, 1, 0, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  Z: [
    [1, 1, 0, 0],
    [0, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  J: [
    [1, 0, 0, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ],
  L: [
    [0, 0, 1, 0],
    [1, 1, 1, 0],
    [0, 0, 0, 0],
    [0, 0, 0, 0]
  ]
};

const PIECE_TO_CELL: Record<PieceType, CellValue> = {
  I: 1,
  O: 2,
  T: 3,
  S: 4,
  Z: 5,
  J: 6,
  L: 7
};

const clone = (matrix: PieceMatrix): PieceMatrix => {
  return matrix.map((row) => [...row]);
};

export const getSpawnMatrix = (type: PieceType): PieceMatrix => {
  return clone(SHAPES[type]);
};

export const getPieceCellValue = (type: PieceType): CellValue => {
  return PIECE_TO_CELL[type];
};

export const rotateCW = (matrix: PieceMatrix): PieceMatrix => {
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

export const rotateCCW = (matrix: PieceMatrix): PieceMatrix => {
  const size = matrix.length;
  const rotated = Array.from({ length: size }, () => Array<number>(size).fill(0));

  for (let row = 0; row < size; row += 1) {
    for (let col = 0; col < size; col += 1) {
      const source = matrix[col];
      rotated[row][col] = source?.[size - 1 - row] ?? 0;
    }
  }

  return rotated;
};
