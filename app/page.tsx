"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { useAppStore } from "@/lib/store";

export default function HomePage() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const sessions = useAppStore((state) => state.sessions);
  const sessionStatus = useAppStore((state) => state.sessionStatus);
  const startSession = useAppStore((state) => state.startSession);

  const latest = sessions[0];

  const handleStart = (): void => {
    startSession();
    router.push("/session");
  };

  const canStart = hydrated && sessionStatus !== "INTRO" && sessionStatus !== "REACTIVATION";

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">ICTI手順 テトリス＋プロトコル</h1>
          <p className="page-subtitle">短い再活性化 → 回転課題 → テトリス20分をガイドします。</p>
        </div>
      </header>

      <section className="card">
        <p className="disclaimer">これは医療の代替ではありません。つらさが強い場合は中断し、必要に応じて専門家へ相談してください。</p>
      </section>

      <section className="grid two" style={{ marginTop: "1rem" }}>
        <div className="card column">
          <h2>今日のセッション</h2>
          <button type="button" className="btn-primary" onClick={handleStart} disabled={!canStart}>
            セッション開始
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
