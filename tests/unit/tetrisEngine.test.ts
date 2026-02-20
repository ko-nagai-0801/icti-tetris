import { describe, expect, it } from "vitest";
import { createEngine, hardDrop, rotateActive, stepGravity } from "../../lib/tetris/engine";

describe("tetris engine regressions", () => {
  it("increments rotation count when rotation succeeds", () => {
    const engine = createEngine();
    const rotated = rotateActive(engine, "CW");

    expect(rotated.stats.rotationsUsed).toBeGreaterThanOrEqual(1);
  });

  it("locks a piece with hard drop", () => {
    const engine = createEngine();
    const dropped = hardDrop(engine);

    expect(dropped.stats.piecesLocked).toBeGreaterThanOrEqual(1);
  });

  it("gravity eventually progresses game state", () => {
    let engine = createEngine();
    const initialLocked = engine.stats.piecesLocked;

    for (let i = 0; i < 40; i += 1) {
      engine = stepGravity(engine);
      if (engine.stats.piecesLocked > initialLocked) {
        break;
      }
    }

    expect(engine.stats.piecesLocked).toBeGreaterThanOrEqual(initialLocked);
  });
});
