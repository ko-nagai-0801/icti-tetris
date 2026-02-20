"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createEngine, hardDrop, holdActive, moveHorizontal, rotateActive, stepGravity } from "@/lib/tetris/engine";
import { drawGame, getCanvasSize } from "@/lib/tetris/render";
import type { EngineState } from "@/lib/tetris/types";
import type { TetrisStats } from "@/lib/types";

type HudState = {
  remainingSec: number;
  linesCleared: number;
  rotationsUsed: number;
  fitsAfterRotation: number;
  piecesLocked: number;
};

type FinishReason = "timer" | "manual" | "gameover";

type TetrisCanvasProps = {
  targetSec: number;
  onFinish: (stats: TetrisStats, reason: FinishReason) => void;
};

type TouchGestureStart = {
  x: number;
  y: number;
  startedAt: number;
  touchCount: 1 | 2;
  moved: boolean;
  longPressTriggered: boolean;
};

const formatClock = (sec: number): string => {
  const minutes = Math.floor(sec / 60);
  const seconds = sec % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
};

export function TetrisCanvas({ targetSec, onFinish }: TetrisCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const engineRef = useRef<EngineState>(createEngine());
  const rafRef = useRef<number | null>(null);
  const startedAtRef = useRef<string>(new Date().toISOString());
  const startMsRef = useRef<number>(0);
  const lastGravityRef = useRef<number>(0);
  const lastHudRef = useRef<number>(0);
  const finishedRef = useRef(false);
  const onFinishRef = useRef(onFinish);
  const touchGestureRef = useRef<TouchGestureStart | null>(null);
  const longPressTimerRef = useRef<number | null>(null);

  const [hud, setHud] = useState<HudState>({
    remainingSec: targetSec,
    linesCleared: 0,
    rotationsUsed: 0,
    fitsAfterRotation: 0,
    piecesLocked: 0
  });

  useEffect(() => {
    onFinishRef.current = onFinish;
  }, [onFinish]);

  const clearLongPressTimer = useCallback((): void => {
    if (longPressTimerRef.current !== null) {
      window.clearTimeout(longPressTimerRef.current);
      longPressTimerRef.current = null;
    }
  }, []);

  const getElapsedSec = useCallback((now: number): number => {
    if (startMsRef.current <= 0) {
      return 0;
    }
    const elapsed = Math.floor((now - startMsRef.current) / 1000);
    return Math.max(0, elapsed);
  }, []);

  const getRemaining = useCallback(
    (now: number): number => {
      const elapsed = getElapsedSec(now);
      return Math.max(0, targetSec - elapsed);
    },
    [getElapsedSec, targetSec]
  );

  const syncHud = useCallback(
    (now: number): void => {
      const state = engineRef.current;
      setHud({
        remainingSec: getRemaining(now),
        linesCleared: state.stats.linesCleared,
        rotationsUsed: state.stats.rotationsUsed,
        fitsAfterRotation: state.stats.fitsAfterRotation,
        piecesLocked: state.stats.piecesLocked
      });
    },
    [getRemaining]
  );

  const redraw = useCallback(
    (now: number): void => {
      const canvas = canvasRef.current;
      if (!canvas) {
        return;
      }
      const ctx = canvas.getContext("2d");
      if (!ctx) {
        return;
      }
      drawGame(ctx, engineRef.current, getRemaining(now));
    },
    [getRemaining]
  );

  const finish = useCallback(
    (reason: FinishReason): void => {
      if (finishedRef.current) {
        return;
      }
      finishedRef.current = true;

      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }

      const now = performance.now();
      const elapsed = getElapsedSec(now);
      const durationSec = Math.max(1, Math.min(targetSec, elapsed));
      const state = engineRef.current;

      onFinishRef.current(
        {
          startedAt: startedAtRef.current,
          endedAt: new Date().toISOString(),
          durationSec,
          linesCleared: state.stats.linesCleared,
          rotationsUsed: state.stats.rotationsUsed,
          fitsAfterRotation: state.stats.fitsAfterRotation,
          piecesLocked: state.stats.piecesLocked
        },
        reason
      );
    },
    [getElapsedSec, targetSec]
  );

  const applyEngine = useCallback(
    (next: EngineState): void => {
      engineRef.current = next;
      const now = performance.now();
      redraw(now);
      syncHud(now);

      if (next.gameOver) {
        finish("gameover");
      }
    },
    [finish, redraw, syncHud]
  );

  useEffect(() => {
    const initial = createEngine();
    engineRef.current = initial;
    startedAtRef.current = new Date().toISOString();
    startMsRef.current = performance.now();
    lastGravityRef.current = startMsRef.current;
    lastHudRef.current = startMsRef.current;
    finishedRef.current = false;

    const { width, height } = getCanvasSize(initial);
    const canvas = canvasRef.current;
    if (canvas) {
      canvas.width = width;
      canvas.height = height;
    }

    const loop = (now: number): void => {
      if (finishedRef.current) {
        return;
      }

      const timeSinceGravity = now - lastGravityRef.current;
      if (timeSinceGravity >= engineRef.current.config.gravityMs) {
        engineRef.current = stepGravity(engineRef.current);
        lastGravityRef.current = now;
      }

      const remaining = getRemaining(now);
      redraw(now);

      if (now - lastHudRef.current >= 160) {
        syncHud(now);
        lastHudRef.current = now;
      }

      if (engineRef.current.gameOver) {
        finish("gameover");
        return;
      }

      if (remaining <= 0) {
        finish("timer");
        return;
      }

      rafRef.current = window.requestAnimationFrame(loop);
    };

    rafRef.current = window.requestAnimationFrame(loop);

    return () => {
      if (rafRef.current !== null) {
        window.cancelAnimationFrame(rafRef.current);
      }
      clearLongPressTimer();
    };
  }, [clearLongPressTimer, finish, getRemaining, redraw, syncHud, targetSec]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent): void => {
      if (finishedRef.current) {
        return;
      }

      let handled = true;
      switch (event.key) {
        case "ArrowLeft":
          applyEngine(moveHorizontal(engineRef.current, -1));
          break;
        case "ArrowRight":
          applyEngine(moveHorizontal(engineRef.current, 1));
          break;
        case "ArrowDown":
          applyEngine(stepGravity(engineRef.current));
          break;
        case " ":
          applyEngine(hardDrop(engineRef.current));
          break;
        case "z":
        case "Z":
          applyEngine(rotateActive(engineRef.current, "CCW"));
          break;
        case "x":
        case "X":
        case "ArrowUp":
          applyEngine(rotateActive(engineRef.current, "CW"));
          break;
        case "c":
        case "C":
          applyEngine(holdActive(engineRef.current));
          break;
        default:
          handled = false;
      }

      if (handled) {
        event.preventDefault();
      }
    };

    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [applyEngine]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) {
      return;
    }

    const getCenter = (touches: TouchList): { x: number; y: number } => {
      if (touches.length >= 2) {
        const first = touches[0];
        const second = touches[1];
        return {
          x: (first.clientX + second.clientX) / 2,
          y: (first.clientY + second.clientY) / 2
        };
      }
      const touch = touches[0];
      return {
        x: touch.clientX,
        y: touch.clientY
      };
    };

    const onTouchStart = (event: TouchEvent): void => {
      if (finishedRef.current || event.touches.length === 0) {
        return;
      }

      clearLongPressTimer();
      const center = getCenter(event.touches);
      const touchCount: 1 | 2 = event.touches.length >= 2 ? 2 : 1;
      touchGestureRef.current = {
        x: center.x,
        y: center.y,
        startedAt: performance.now(),
        touchCount,
        moved: false,
        longPressTriggered: false
      };

      if (touchCount === 1) {
        longPressTimerRef.current = window.setTimeout(() => {
          const current = touchGestureRef.current;
          if (!current || current.touchCount !== 1 || current.moved) {
            return;
          }
          current.longPressTriggered = true;
          applyEngine(holdActive(engineRef.current));
        }, 420);
      }

      event.preventDefault();
    };

    const onTouchMove = (event: TouchEvent): void => {
      const current = touchGestureRef.current;
      if (!current || event.touches.length === 0) {
        return;
      }

      const center = getCenter(event.touches);
      const dx = center.x - current.x;
      const dy = center.y - current.y;
      if (Math.abs(dx) > 8 || Math.abs(dy) > 8) {
        current.moved = true;
        clearLongPressTimer();
      }

      event.preventDefault();
    };

    const onTouchEnd = (event: TouchEvent): void => {
      const current = touchGestureRef.current;
      if (!current) {
        return;
      }

      clearLongPressTimer();

      if (current.longPressTriggered) {
        touchGestureRef.current = null;
        event.preventDefault();
        return;
      }

      const durationMs = performance.now() - current.startedAt;

      if (current.touchCount === 2) {
        if (durationMs < 280 && !current.moved) {
          applyEngine(rotateActive(engineRef.current, "CCW"));
        }
        touchGestureRef.current = null;
        event.preventDefault();
        return;
      }

      const changed = event.changedTouches[0];
      if (!changed) {
        touchGestureRef.current = null;
        return;
      }

      const dx = changed.clientX - current.x;
      const dy = changed.clientY - current.y;

      if (Math.abs(dx) > 28 && Math.abs(dx) > Math.abs(dy)) {
        const steps = Math.max(1, Math.min(3, Math.floor(Math.abs(dx) / 32)));
        let nextState = engineRef.current;
        const direction = dx < 0 ? -1 : 1;
        for (let i = 0; i < steps; i += 1) {
          nextState = moveHorizontal(nextState, direction);
        }
        applyEngine(nextState);
      } else if (dy > 36 && Math.abs(dy) > Math.abs(dx)) {
        applyEngine(hardDrop(engineRef.current));
      } else if (durationMs < 280) {
        applyEngine(rotateActive(engineRef.current, "CW"));
      }

      touchGestureRef.current = null;
      event.preventDefault();
    };

    canvas.addEventListener("touchstart", onTouchStart, { passive: false });
    canvas.addEventListener("touchmove", onTouchMove, { passive: false });
    canvas.addEventListener("touchend", onTouchEnd, { passive: false });
    canvas.addEventListener("touchcancel", onTouchEnd, { passive: false });

    return () => {
      clearLongPressTimer();
      canvas.removeEventListener("touchstart", onTouchStart);
      canvas.removeEventListener("touchmove", onTouchMove);
      canvas.removeEventListener("touchend", onTouchEnd);
      canvas.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [applyEngine, clearLongPressTimer]);

  return (
    <div className="tetris-wrap card">
      <p className="help">速さより、回転してフィットさせることに集中します。</p>
      <canvas
        ref={canvasRef}
        className="tetris-canvas"
        aria-label="Tetris Game"
        onContextMenu={(event) => event.preventDefault()}
      />

      <div className="stats-grid">
        <div className="stat">残り時間: {formatClock(hud.remainingSec)}</div>
        <div className="stat">Line: {hud.linesCleared}</div>
        <div className="stat">Rotation: {hud.rotationsUsed}</div>
        <div className="stat">Fit after rotation: {hud.fitsAfterRotation}</div>
        <div className="stat">Pieces: {hud.piecesLocked}</div>
      </div>

      <div className="tetris-controls">
        <button
          type="button"
          className="btn-outline"
          aria-label="左へ移動"
          data-testid="tetris-move-left"
          onClick={() => applyEngine(moveHorizontal(engineRef.current, -1))}
        >
          ←
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="右へ移動"
          data-testid="tetris-move-right"
          onClick={() => applyEngine(moveHorizontal(engineRef.current, 1))}
        >
          →
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="ソフトドロップ"
          data-testid="tetris-soft-drop"
          onClick={() => applyEngine(stepGravity(engineRef.current))}
        >
          ↓
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="ハードドロップ"
          data-testid="tetris-hard-drop"
          onClick={() => applyEngine(hardDrop(engineRef.current))}
        >
          DROP
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="左回転"
          data-testid="tetris-rotate-ccw"
          onClick={() => applyEngine(rotateActive(engineRef.current, "CCW"))}
        >
          ↺ 左回転
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="右回転"
          data-testid="tetris-rotate-cw"
          onClick={() => applyEngine(rotateActive(engineRef.current, "CW"))}
        >
          ↻ 右回転
        </button>
        <button
          type="button"
          className="btn-outline"
          aria-label="ホールド"
          data-testid="tetris-hold"
          onClick={() => applyEngine(holdActive(engineRef.current))}
        >
          HOLD
        </button>
      </div>

      <div className="tetris-guide">
        <div className="tetris-guide-row">
          <strong>キーボード:</strong> ←/→ 移動, ↓ ソフトドロップ, Space ハードドロップ
        </div>
        <div className="tetris-guide-row">
          <strong>回転:</strong> Z = 左回転, X or ↑ = 右回転, C = HOLD
        </div>
        <div className="tetris-guide-row">
          <strong>スマホ:</strong> タップ=右回転, 2本指タップ=左回転, 長押し=HOLD
        </div>
        <div className="tetris-guide-row">
          <strong>ジェスチャ:</strong> 左右スワイプ=移動, 下スワイプ=ハードドロップ
        </div>
      </div>

      <div className="row">
        <button type="button" className="btn-outline" onClick={() => finish("manual")} data-testid="tetris-finish-button">
          手動で終了して次へ
        </button>
      </div>
    </div>
  );
}
