import { describe, expect, it } from "vitest";
import { buildWeeklySummaries, getWeekStart } from "../../lib/date";
import type { SessionRecord } from "../../lib/types";

const createSession = (createdAt: string, mood: number, vividness: number, flashbackCount?: number): SessionRecord => {
  return {
    id: `id-${createdAt}`,
    createdAt,
    protocolVersion: "v1",
    reactivationSec: 30,
    rotationQuestions: 3,
    tetrisTargetSec: 1200,
    mood0to10: mood,
    vividness0to10: vividness,
    flashbackCount,
    rotation: {
      answers: [],
      correctCount: 0
    },
    tetris: {
      startedAt: createdAt,
      endedAt: createdAt,
      durationSec: 120,
      linesCleared: 5,
      rotationsUsed: 9,
      fitsAfterRotation: 3,
      piecesLocked: 15
    }
  };
};

describe("date helpers", () => {
  it("calculates Monday as week start", () => {
    expect(getWeekStart("2026-02-22T09:00:00.000Z")).toBe("2026-02-16");
    expect(getWeekStart("2026-02-23T09:00:00.000Z")).toBe("2026-02-23");
  });

  it("builds weekly summaries with averages", () => {
    const sessions: SessionRecord[] = [
      createSession("2026-02-24T09:00:00.000Z", 7, 5, 3),
      createSession("2026-02-23T09:00:00.000Z", 5, 4, 1),
      createSession("2026-02-18T09:00:00.000Z", 3, 6)
    ];

    const summaries = buildWeeklySummaries(sessions);

    expect(summaries).toHaveLength(2);
    expect(summaries[0]?.weekStart).toBe("2026-02-23");
    expect(summaries[0]?.sessionCount).toBe(2);
    expect(summaries[0]?.avgMood).toBe(6);
    expect(summaries[0]?.avgVividness).toBe(4.5);
    expect(summaries[0]?.avgFlashbackCount).toBe(2);
  });
});
