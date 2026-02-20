import type { SessionRecord } from "@/lib/types";

export type WeeklySummary = {
  weekStart: string;
  sessionCount: number;
  avgMood: number;
  avgVividness: number;
  avgFlashbackCount?: number;
};

const roundOne = (value: number): number => {
  return Math.round(value * 10) / 10;
};

export const formatDateTime = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }

  return new Intl.DateTimeFormat("ja-JP", {
    dateStyle: "medium",
    timeStyle: "short"
  }).format(date);
};

export const getWeekStart = (iso: string): string => {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "invalid";
  }

  const utc = new Date(Date.UTC(date.getFullYear(), date.getMonth(), date.getDate()));
  const day = utc.getUTCDay();
  const diff = day === 0 ? -6 : 1 - day;
  utc.setUTCDate(utc.getUTCDate() + diff);
  return utc.toISOString().slice(0, 10);
};

type WeekAccumulator = {
  count: number;
  moodSum: number;
  vividSum: number;
  flashSum: number;
  flashCount: number;
};

export const buildWeeklySummaries = (sessions: SessionRecord[]): WeeklySummary[] => {
  const map = new Map<string, WeekAccumulator>();

  sessions.forEach((session) => {
    const key = getWeekStart(session.createdAt);
    const current = map.get(key) ?? {
      count: 0,
      moodSum: 0,
      vividSum: 0,
      flashSum: 0,
      flashCount: 0
    };

    current.count += 1;
    current.moodSum += session.mood0to10;
    current.vividSum += session.vividness0to10;

    if (typeof session.flashbackCount === "number") {
      current.flashSum += session.flashbackCount;
      current.flashCount += 1;
    }

    map.set(key, current);
  });

  return [...map.entries()]
    .map(([weekStart, acc]): WeeklySummary => {
      return {
        weekStart,
        sessionCount: acc.count,
        avgMood: roundOne(acc.moodSum / acc.count),
        avgVividness: roundOne(acc.vividSum / acc.count),
        avgFlashbackCount: acc.flashCount > 0 ? roundOne(acc.flashSum / acc.flashCount) : undefined
      };
    })
    .sort((a, b) => b.weekStart.localeCompare(a.weekStart));
};
