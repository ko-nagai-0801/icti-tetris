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
    };
  }, [finish, getRemaining, redraw, syncHud, targetSec]);

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

  return (
    <div className="tetris-wrap card">
      <p className="help">速さより、回転してフィットさせることに集中します。</p>
      <canvas ref={canvasRef} className="tetris-canvas" aria-label="Tetris Game" />

      <div className="stats-grid">
        <div className="stat">残り時間: {formatClock(hud.remainingSec)}</div>
        <div className="stat">Line: {hud.linesCleared}</div>
        <div className="stat">Rotation: {hud.rotationsUsed}</div>
        <div className="stat">Fit after rotation: {hud.fitsAfterRotation}</div>
        <div className="stat">Pieces: {hud.piecesLocked}</div>
      </div>

      <div className="tetris-controls">
        <button type="button" className="btn-outline" onClick={() => applyEngine(moveHorizontal(engineRef.current, -1))}>
          ←
        </button>
        <button type="button" className="btn-outline" onClick={() => applyEngine(moveHorizontal(engineRef.current, 1))}>
          →
        </button>
        <button type="button" className="btn-outline" onClick={() => applyEngine(stepGravity(engineRef.current))}>
          ↓
        </button>
        <button type="button" className="btn-outline" onClick={() => applyEngine(hardDrop(engineRef.current))}>
          DROP
        </button>
        <button type="button" className="btn-outline" onClick={() => applyEngine(rotateActive(engineRef.current, "CW"))}>
          回転
        </button>
        <button type="button" className="btn-outline" onClick={() => applyEngine(holdActive(engineRef.current))}>
          HOLD
        </button>
      </div>

      <div className="row">
        <button type="button" className="btn-outline" onClick={() => finish("manual")}>
          手動で終了して次へ
        </button>
      </div>

      <p className="help">キー操作: ← → ↓ Space Z X C</p>
    </div>
  );
}
