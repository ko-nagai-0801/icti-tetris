"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { InstallPrompt } from "@/components/InstallPrompt";
import { formatDateTime } from "@/lib/date";
import { useAppStore } from "@/lib/store";
import { SESSION_PROGRESS_STATUSES } from "@/lib/types";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const sessionStatus = useAppStore((state) => state.sessionStatus);
  const activeDraft = useAppStore((state) => state.activeDraft);
  const startSession = useAppStore((state) => state.startSession);
  const discardSession = useAppStore((state) => state.discardSession);

  const latest = sessions[0];
  const hasInProgress = Boolean(activeDraft) && SESSION_PROGRESS_STATUSES.some((step) => step === sessionStatus);

  const handleStart = (): void => {
    if (hasInProgress) {
      const approved = window.confirm("進行中のセッションがあります。破棄して新しく開始しますか？");
      if (!approved) {
        return;
      }
      discardSession();
    }
    startSession();
    router.push("/session");
  };

  const canStart = hydrated;

  return (
    <main id="main-content" className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">ICTI手順 テトリス＋プロトコル</h1>
          <p className="page-subtitle">短い再活性化 → 回転課題 → テトリス20分をガイドします。</p>
        </div>
      </header>

      <section className="card">
        <p className="disclaimer">これは医療の代替ではありません。つらさが強い場合は中断し、必要に応じて専門家へ相談してください。</p>
      </section>

      <section style={{ marginTop: "1rem" }}>
        <InstallPrompt />
      </section>

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="card column">
          <h2>今日のセッション</h2>
          {hasInProgress && activeDraft ? (
            <div className="card" style={{ borderStyle: "dashed" }}>
              <p className="help">途中のセッションがあります（開始: {formatDateTime(activeDraft.createdAt)}）</p>
              <button type="button" className="btn-outline" onClick={() => router.push("/session")}>
                セッション再開
              </button>
            </div>
          ) : null}
          <button
            type="button"
            className="btn-primary"
            onClick={handleStart}
            disabled={!canStart}
            data-testid="home-start-session-button"
          >
            {hasInProgress ? "新規セッション開始（途中分を破棄）" : "セッション開始"}
          </button>
          {!hydrated ? <p className="help">データを読み込み中です…</p> : null}
        </div>

        <div className="card column">
          <h2>直近の結果</h2>
          {latest ? (
            <>
              <p>{formatDateTime(latest.createdAt)}</p>
              <p>
                気分 {latest.mood0to10} / 鮮明さ {latest.vividness0to10}
              </p>
            </>
          ) : (
            <p className="help">まだ記録がありません。</p>
          )}
        </div>
      </section>

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <Link href="/logs" className="button btn-outline">
          記録を見る
        </Link>
        <Link href="/safety" className="button btn-outline">
          中断・相談
        </Link>
        <Link href="/settings" className="button btn-outline">
          設定
        </Link>
      </section>
    </main>
  );
}
