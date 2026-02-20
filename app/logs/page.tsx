"use client";

import Link from "next/link";
import { buildWeeklySummaries, formatDateTime } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import type { SessionRecord } from "@/lib/types";

type Point = {
  x: number;
  y: number;
};

const CHART_WIDTH = 640;
const CHART_HEIGHT = 220;
const CHART_PADDING_X = 44;
const CHART_PADDING_Y = 26;

const toCsvSafe = (value: string | number): string => {
  const text = String(value);
  if (text.includes(",") || text.includes("\n") || text.includes("\"")) {
    return `"${text.replaceAll("\"", "\"\"")}"`;
  }
  return text;
};

const formatDelta = (value: number): string => {
  if (value === 0) {
    return "±0";
  }
  return value > 0 ? `+${value}` : String(value);
};

const buildPath = (points: Point[]): string => {
  if (points.length === 0) {
    return "";
  }
  return points.map((point, index) => `${index === 0 ? "M" : "L"}${point.x} ${point.y}`).join(" ");
};

const buildSeriesPoints = (values: number[]): Point[] => {
  if (values.length === 0) {
    return [];
  }

  const chartInnerWidth = CHART_WIDTH - CHART_PADDING_X * 2;
  const chartInnerHeight = CHART_HEIGHT - CHART_PADDING_Y * 2;

  return values.map((value, index) => {
    const x = CHART_PADDING_X + (index * chartInnerWidth) / Math.max(1, values.length - 1);
    const y = CHART_PADDING_Y + ((10 - value) / 10) * chartInnerHeight;
    return { x, y };
  });
};

const buildCsv = (sessions: SessionRecord[]): string => {
  const headers = [
    "createdAt",
    "mood0to10",
    "vividness0to10",
    "flashbackCount",
    "durationSec",
    "linesCleared",
    "rotationsUsed",
    "fitsAfterRotation",
    "piecesLocked"
  ];

  const rows = sessions.map((session) => {
    return [
      session.createdAt,
      session.mood0to10,
      session.vividness0to10,
      session.flashbackCount ?? "",
      session.tetris.durationSec,
      session.tetris.linesCleared,
      session.tetris.rotationsUsed,
      session.tetris.fitsAfterRotation,
      session.tetris.piecesLocked
    ];
  });

  return [headers.join(","), ...rows.map((row) => row.map((cell) => toCsvSafe(cell)).join(","))].join("\n");
};

export default function LogsPage() {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);

  const weekly = buildWeeklySummaries(sessions);
  const weeklyAsc = [...weekly].reverse();

  const moodPoints = buildSeriesPoints(weeklyAsc.map((item) => item.avgMood));
  const vividPoints = buildSeriesPoints(weeklyAsc.map((item) => item.avgVividness));
  const chart = {
    moodPoints,
    vividPoints,
    moodPath: buildPath(moodPoints),
    vividPath: buildPath(vividPoints)
  };

  const handleExportJson = (): void => {
    const payload = JSON.stringify(
      {
        settings,
        sessions
      },
      null,
      2
    );

    if (typeof navigator !== "undefined" && navigator.clipboard) {
      void navigator.clipboard.writeText(payload);
    }

    const blob = new Blob([payload], { type: "application/json" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `icti-tetris-export-${Date.now()}.json`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  const handleExportCsv = (): void => {
    const csv = buildCsv(sessions);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    const url = window.URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `icti-tetris-sessions-${Date.now()}.csv`;
    anchor.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <main id="main-content" className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">記録</h1>
          <p className="page-subtitle">セッション一覧、週次推移、前回との差分を確認できます。</p>
        </div>
        <Link href="/" className="button btn-outline">
          ホームへ
        </Link>
      </header>

      <section className="card">
        <div className="row">
          <button
            type="button"
            className="btn-outline"
            onClick={handleExportJson}
            disabled={!hydrated || sessions.length === 0}
          >
            JSONエクスポート
          </button>
          <button
            type="button"
            className="btn-outline"
            onClick={handleExportCsv}
            disabled={!hydrated || sessions.length === 0}
          >
            CSVエクスポート
          </button>
        </div>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>週次推移グラフ（平均）</h2>
        {weeklyAsc.length === 0 ? <p className="help">表示するデータがありません。</p> : null}
        {weeklyAsc.length > 0 ? (
          <div className="trend-chart-wrap">
            <svg viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`} className="trend-chart" role="img" aria-label="週次推移">
              {[0, 2, 4, 6, 8, 10].map((tick) => {
                const y = CHART_PADDING_Y + ((10 - tick) / 10) * (CHART_HEIGHT - CHART_PADDING_Y * 2);
                return (
                  <g key={tick}>
                    <line x1={CHART_PADDING_X} y1={y} x2={CHART_WIDTH - CHART_PADDING_X} y2={y} stroke="#d8cfc0" strokeWidth="1" />
                    <text x={8} y={y + 4} fontSize="11" fill="#6b665e">
                      {tick}
                    </text>
                  </g>
                );
              })}

              {chart.moodPath ? <path d={chart.moodPath} fill="none" stroke="#2f6f5e" strokeWidth="3" /> : null}
              {chart.vividPath ? <path d={chart.vividPath} fill="none" stroke="#c36f2d" strokeWidth="3" /> : null}

              {chart.moodPoints.map((point, index) => (
                <circle key={`m-${index}`} cx={point.x} cy={point.y} r="4" fill="#2f6f5e" />
              ))}
              {chart.vividPoints.map((point, index) => (
                <circle key={`v-${index}`} cx={point.x} cy={point.y} r="4" fill="#c36f2d" />
              ))}
            </svg>

            <div className="row" style={{ gap: "1rem" }}>
              <span className="badge">緑: mood</span>
              <span className="badge">橙: vividness</span>
            </div>
          </div>
        ) : null}
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>セッション一覧（前回比較付き）</h2>
        {!hydrated ? <p className="help">読み込み中…</p> : null}
        {hydrated && sessions.length === 0 ? <p className="help">まだ記録がありません。</p> : null}
        <div className="list">
          {sessions.map((session, index) => {
            const previous = sessions[index + 1];
            const moodDelta = previous ? session.mood0to10 - previous.mood0to10 : null;
            const vividDelta = previous ? session.vividness0to10 - previous.vividness0to10 : null;
            const flashDelta =
              previous && typeof session.flashbackCount === "number" && typeof previous.flashbackCount === "number"
                ? session.flashbackCount - previous.flashbackCount
                : null;

            return (
              <Link key={session.id} href={`/logs/${session.id}`} className="list-item">
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{formatDateTime(session.createdAt)}</strong>
                  <span className="badge">詳細</span>
                </div>
                <p>
                  mood {session.mood0to10} / vividness {session.vividness0to10} / play {session.tetris.durationSec}s
                </p>
                {previous ? (
                  <div className="row" style={{ gap: "0.5rem" }}>
                    <span className="delta-badge">mood {formatDelta(moodDelta ?? 0)}</span>
                    <span className="delta-badge">vividness {formatDelta(vividDelta ?? 0)}</span>
                    <span className="delta-badge">
                      flashback {typeof flashDelta === "number" ? formatDelta(flashDelta) : "比較不可"}
                    </span>
                  </div>
                ) : (
                  <p className="help">比較対象となる前回セッションはありません。</p>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>週別集計（月曜始まり）</h2>
        {weekly.length === 0 ? <p className="help">集計データがありません。</p> : null}
        <div className="list">
          {weekly.map((summary) => (
            <div key={summary.weekStart} className="list-item">
              <strong>週開始: {summary.weekStart}</strong>
              <p>
                回数 {summary.sessionCount} / 平均mood {summary.avgMood} / 平均vividness {summary.avgVividness}
              </p>
              <p>
                平均flashback: {typeof summary.avgFlashbackCount === "number" ? summary.avgFlashbackCount : "入力なし"}
              </p>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
