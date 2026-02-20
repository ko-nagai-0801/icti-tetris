export type PieceType = "I" | "O" | "T" | "S" | "Z" | "J" | "L";

export type CellValue = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;

export type PieceMatrix = number[][];
export type Board = CellValue[][];

export type RotationDirection = "CW" | "CCW";

export type ActivePiece = {
  type: PieceType;
  matrix: PieceMatrix;
  x: number;
  y: number;
};

export type RuntimeStats = {
  linesCleared: number;
  rotationsUsed: number;
  fitsAfterRotation: number;
  piecesLocked: number;
};

export type EngineConfig = {
  rows: number;
  cols: number;
  gravityMs: number;
};

export type EngineState = {
  board: Board;
  active: ActivePiece;
  hold: PieceType | null;
  canHold: boolean;
  queue: PieceType[];
  stats: RuntimeStats;
  gameOver: boolean;
  didRotateCurrent: boolean;
  config: EngineConfig;
};

export const DEFAULT_ENGINE_CONFIG: EngineConfig = {
  rows: 20,
  cols: 10,
  gravityMs: 1000
};
