import {
  DEFAULT_ENGINE_CONFIG,
  type ActivePiece,
  type Board,
  type CellValue,
  type EngineConfig,
  type EngineState,
  type PieceType,
  type RotationDirection
} from "@/lib/tetris/types";
import { PIECE_ORDER, getPieceCellValue, getSpawnMatrix, rotateCCW, rotateCW } from "@/lib/tetris/shapes";

const cloneBoard = (board: Board): Board => {
  return board.map((row) => [...row] as CellValue[]);
};

const clonePiece = (piece: ActivePiece): ActivePiece => {
  return {
    ...piece,
    matrix: piece.matrix.map((row) => [...row])
  };
};

const cloneState = (state: EngineState): EngineState => {
  return {
    board: cloneBoard(state.board),
    active: clonePiece(state.active),
    hold: state.hold,
    canHold: state.canHold,
    queue: [...state.queue],
    stats: { ...state.stats },
    gameOver: state.gameOver,
    didRotateCurrent: state.didRotateCurrent,
    config: { ...state.config }
  };
};

const createEmptyBoard = (rows: number, cols: number): Board => {
  return Array.from({ length: rows }, () => Array<CellValue>(cols).fill(0));
};

const randomBag = (): PieceType[] => {
  const bag = [...PIECE_ORDER];
  for (let i = bag.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    const current = bag[i];
    bag[i] = bag[j] ?? bag[i];
    bag[j] = current;
  }
  return bag;
};

const ensureQueue = (queue: PieceType[], minLength = 7): PieceType[] => {
  const nextQueue = [...queue];
  while (nextQueue.length < minLength) {
    nextQueue.push(...randomBag());
  }
  return nextQueue;
};

const collides = (
  board: Board,
  matrix: number[][],
  x: number,
  y: number,
  cols: number,
  rows: number
): boolean => {
  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 0) {
        continue;
      }

      const nextX = x + col;
      const nextY = y + row;

      if (nextX < 0 || nextX >= cols || nextY >= rows) {
        return true;
      }

      if (nextY >= 0 && board[nextY]?.[nextX] !== 0) {
        return true;
      }
    }
  }

  return false;
};

const spawnPiece = (state: EngineState, type: PieceType): EngineState => {
  const next = cloneState(state);
  const matrix = getSpawnMatrix(type);
  const x = Math.floor((next.config.cols - matrix[0].length) / 2);
  const y = 0;

  next.active = {
    type,
    matrix,
    x,
    y
  };

  if (collides(next.board, matrix, x, y, next.config.cols, next.config.rows)) {
    next.gameOver = true;
  }

  return next;
};

const clearLines = (board: Board): { board: Board; cleared: number } => {
  const rows = board.length;
  const cols = board[0]?.length ?? 0;
  const keptRows: CellValue[][] = [];
  let cleared = 0;

  for (let row = 0; row < rows; row += 1) {
    const hasGap = board[row].some((cell) => cell === 0);
    if (hasGap) {
      keptRows.push([...board[row]] as CellValue[]);
    } else {
      cleared += 1;
    }
  }

  const emptyRows = Array.from({ length: cleared }, () => Array<CellValue>(cols).fill(0));

  return {
    board: [...emptyRows, ...keptRows],
    cleared
  };
};

const lockActivePiece = (state: EngineState): EngineState => {
  const next = cloneState(state);
  const pieceCellValue = getPieceCellValue(next.active.type);

  for (let row = 0; row < next.active.matrix.length; row += 1) {
    for (let col = 0; col < next.active.matrix[row].length; col += 1) {
      if (next.active.matrix[row][col] === 0) {
        continue;
      }

      const boardX = next.active.x + col;
      const boardY = next.active.y + row;

      if (boardY >= 0 && boardY < next.config.rows && boardX >= 0 && boardX < next.config.cols) {
        next.board[boardY][boardX] = pieceCellValue;
      }
    }
  }

  const cleared = clearLines(next.board);
  next.board = cleared.board;
  next.stats.linesCleared += cleared.cleared;
  next.stats.piecesLocked += 1;

  if (next.didRotateCurrent) {
    next.stats.fitsAfterRotation += 1;
  }

  const queue = ensureQueue(next.queue);
  const nextType = queue.shift() ?? "T";
  next.queue = queue;
  next.canHold = true;
  next.didRotateCurrent = false;

  return spawnPiece(next, nextType);
};

export const createEngine = (configOverrides: Partial<EngineConfig> = {}): EngineState => {
  const config: EngineConfig = {
    ...DEFAULT_ENGINE_CONFIG,
    ...configOverrides
  };

  const queue = ensureQueue([]);
  const firstType = queue.shift() ?? "T";

  const initial: EngineState = {
    board: createEmptyBoard(config.rows, config.cols),
    active: {
      type: firstType,
      matrix: getSpawnMatrix(firstType),
      x: Math.floor((config.cols - 4) / 2),
      y: 0
    },
    hold: null,
    canHold: true,
    queue,
    stats: {
      linesCleared: 0,
      rotationsUsed: 0,
      fitsAfterRotation: 0,
      piecesLocked: 0
    },
    gameOver: false,
    didRotateCurrent: false,
    config
  };

  if (collides(initial.board, initial.active.matrix, initial.active.x, initial.active.y, config.cols, config.rows)) {
    initial.gameOver = true;
  }

  return initial;
};

export const moveHorizontal = (state: EngineState, delta: number): EngineState => {
  if (state.gameOver || delta === 0) {
    return state;
  }

  const next = cloneState(state);
  const proposedX = next.active.x + delta;

  if (!collides(next.board, next.active.matrix, proposedX, next.active.y, next.config.cols, next.config.rows)) {
    next.active.x = proposedX;
  }

  return next;
};

export const rotateActive = (state: EngineState, direction: RotationDirection): EngineState => {
  if (state.gameOver) {
    return state;
  }

  const next = cloneState(state);
  const rotated = direction === "CW" ? rotateCW(next.active.matrix) : rotateCCW(next.active.matrix);
  const kicks = [0, -1, 1, -2, 2];

  for (const offset of kicks) {
    const proposedX = next.active.x + offset;
    if (!collides(next.board, rotated, proposedX, next.active.y, next.config.cols, next.config.rows)) {
      next.active.matrix = rotated;
      next.active.x = proposedX;
      next.didRotateCurrent = true;
      next.stats.rotationsUsed += 1;
      return next;
    }
  }

  return state;
};

export const stepGravity = (state: EngineState): EngineState => {
  if (state.gameOver) {
    return state;
  }

  const next = cloneState(state);
  const proposedY = next.active.y + 1;

  if (!collides(next.board, next.active.matrix, next.active.x, proposedY, next.config.cols, next.config.rows)) {
    next.active.y = proposedY;
    return next;
  }

  return lockActivePiece(next);
};

export const hardDrop = (state: EngineState): EngineState => {
  if (state.gameOver) {
    return state;
  }

  let next = cloneState(state);
  while (!collides(next.board, next.active.matrix, next.active.x, next.active.y + 1, next.config.cols, next.config.rows)) {
    next.active.y += 1;
  }

  next = lockActivePiece(next);
  return next;
};

export const holdActive = (state: EngineState): EngineState => {
  if (state.gameOver || !state.canHold) {
    return state;
  }

  const next = cloneState(state);
  const currentType = next.active.type;

  if (next.hold === null) {
    const queue = ensureQueue(next.queue);
    const nextType = queue.shift() ?? "T";
    next.queue = queue;
    next.hold = currentType;
    next.canHold = false;
    next.didRotateCurrent = false;
    return spawnPiece(next, nextType);
  }

  const swapType = next.hold;
  next.hold = currentType;
  next.canHold = false;
  next.didRotateCurrent = false;
  return spawnPiece(next, swapType);
};

export const getGhostY = (state: EngineState): number => {
  let ghostY = state.active.y;
  while (!collides(state.board, state.active.matrix, state.active.x, ghostY + 1, state.config.cols, state.config.rows)) {
    ghostY += 1;
  }
  return ghostY;
};
