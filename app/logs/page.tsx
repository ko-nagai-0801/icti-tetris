"use client";

import Link from "next/link";
import { buildWeeklySummaries, formatDateTime } from "@/lib/date";
import { useAppStore } from "@/lib/store";

export default function LogsPage() {
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const settings = useAppStore((state) => state.settings);

  const weekly = buildWeeklySummaries(sessions);

  const handleExport = (): void => {
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

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">記録</h1>
          <p className="page-subtitle">セッション一覧と週別の簡易集計</p>
        </div>
        <Link href="/" className="button btn-outline">
          ホームへ
        </Link>
      </header>

      <section className="card">
        <button type="button" className="btn-outline" onClick={handleExport} disabled={!hydrated || sessions.length === 0}>
          JSONエクスポート
        </button>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>セッション一覧</h2>
        {!hydrated ? <p className="help">読み込み中…</p> : null}
        {hydrated && sessions.length === 0 ? <p className="help">まだ記録がありません。</p> : null}
        <div className="list">
          {sessions.map((session) => (
            <Link key={session.id} href={`/logs/${session.id}`} className="list-item">
              <div className="row" style={{ justifyContent: "space-between" }}>
                <strong>{formatDateTime(session.createdAt)}</strong>
                <span className="badge">詳細</span>
              </div>
              <p>
                mood {session.mood0to10} / vividness {session.vividness0to10} / play {session.tetris.durationSec}s
              </p>
            </Link>
          ))}
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
