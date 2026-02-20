import { getGhostY } from "@/lib/tetris/engine";
import type { CellValue, EngineState, PieceType } from "@/lib/tetris/types";
import { getPieceCellValue, getSpawnMatrix } from "@/lib/tetris/shapes";

const CELL_SIZE = 24;
const PAD = 8;
const SIDEBAR_WIDTH = 130;

const COLORS: Record<CellValue, string> = {
  0: "#101826",
  1: "#22d3ee",
  2: "#facc15",
  3: "#c084fc",
  4: "#4ade80",
  5: "#f87171",
  6: "#60a5fa",
  7: "#fb923c"
};

const strokeCell = (ctx: CanvasRenderingContext2D, x: number, y: number, size: number): void => {
  ctx.strokeStyle = "rgba(255,255,255,0.07)";
  ctx.strokeRect(x + 0.5, y + 0.5, size - 1, size - 1);
};

const fillCell = (
  ctx: CanvasRenderingContext2D,
  x: number,
  y: number,
  color: string,
  size: number,
  alpha = 1
): void => {
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.fillStyle = color;
  ctx.fillRect(x + 1, y + 1, size - 2, size - 2);
  ctx.restore();
};

const drawMiniPiece = (
  ctx: CanvasRenderingContext2D,
  type: PieceType,
  startX: number,
  startY: number,
  size: number
): void => {
  const matrix = getSpawnMatrix(type);
  const cell = getPieceCellValue(type);

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 0) {
        continue;
      }
      const x = startX + col * size;
      const y = startY + row * size;
      fillCell(ctx, x, y, COLORS[cell], size, 1);
      strokeCell(ctx, x, y, size);
    }
  }
};

export const getCanvasSize = (state: EngineState): { width: number; height: number } => {
  const width = PAD * 3 + state.config.cols * CELL_SIZE + SIDEBAR_WIDTH;
  const height = PAD * 2 + state.config.rows * CELL_SIZE;
  return { width, height };
};

export const drawGame = (
  ctx: CanvasRenderingContext2D,
  state: EngineState,
  remainingSec: number
): void => {
  const { width, height } = getCanvasSize(state);
  ctx.clearRect(0, 0, width, height);
  ctx.fillStyle = "#0f172a";
  ctx.fillRect(0, 0, width, height);

  const boardStartX = PAD;
  const boardStartY = PAD;

  for (let row = 0; row < state.config.rows; row += 1) {
    for (let col = 0; col < state.config.cols; col += 1) {
      const x = boardStartX + col * CELL_SIZE;
      const y = boardStartY + row * CELL_SIZE;
      fillCell(ctx, x, y, COLORS[state.board[row][col]], CELL_SIZE, 1);
      strokeCell(ctx, x, y, CELL_SIZE);
    }
  }

  const ghostY = getGhostY(state);
  const activeCell = getPieceCellValue(state.active.type);

  for (let row = 0; row < state.active.matrix.length; row += 1) {
    for (let col = 0; col < state.active.matrix[row].length; col += 1) {
      if (state.active.matrix[row][col] === 0) {
        continue;
      }

      const ghostX = boardStartX + (state.active.x + col) * CELL_SIZE;
      const ghostDrawY = boardStartY + (ghostY + row) * CELL_SIZE;
      fillCell(ctx, ghostX, ghostDrawY, COLORS[activeCell], CELL_SIZE, 0.28);

      const x = boardStartX + (state.active.x + col) * CELL_SIZE;
      const y = boardStartY + (state.active.y + row) * CELL_SIZE;
      fillCell(ctx, x, y, COLORS[activeCell], CELL_SIZE, 1);
      strokeCell(ctx, x, y, CELL_SIZE);
    }
  }

  const sidebarX = boardStartX + state.config.cols * CELL_SIZE + PAD * 1.5;

  ctx.fillStyle = "#e2e8f0";
  ctx.font = "12px sans-serif";
  ctx.fillText(`残り ${Math.floor(remainingSec / 60)}:${String(remainingSec % 60).padStart(2, "0")}`, sidebarX, 30);
  ctx.fillText(`LINE ${state.stats.linesCleared}`, sidebarX, 54);
  ctx.fillText(`ROT ${state.stats.rotationsUsed}`, sidebarX, 76);
  ctx.fillText(`FIT ${state.stats.fitsAfterRotation}`, sidebarX, 98);

  ctx.fillStyle = "#94a3b8";
  ctx.fillText("HOLD", sidebarX, 132);

  if (state.hold) {
    drawMiniPiece(ctx, state.hold, sidebarX, 140, 14);
  }

  ctx.fillStyle = "#94a3b8";
  ctx.fillText("NEXT", sidebarX, 228);

  const nextType = state.queue[0];
  if (nextType) {
    drawMiniPiece(ctx, nextType, sidebarX, 236, 14);
  }

  if (state.gameOver) {
    ctx.fillStyle = "rgba(15,23,42,0.72)";
    ctx.fillRect(boardStartX, boardStartY + 180, state.config.cols * CELL_SIZE, 54);
    ctx.fillStyle = "#f8fafc";
    ctx.font = "bold 16px sans-serif";
    ctx.fillText("GAME OVER", boardStartX + 64, boardStartY + 212);
  }
};
