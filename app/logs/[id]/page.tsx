"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/date";
import { useAppStore } from "@/lib/store";

export default function SessionDetailPage() {
  const router = useRouter();
  const params = useParams();
  const sessionIdRaw = params.id;
  const sessionId = Array.isArray(sessionIdRaw) ? sessionIdRaw[0] : sessionIdRaw;

  const session = useAppStore((state) => state.sessions.find((item) => item.id === sessionId));
  const deleteSession = useAppStore((state) => state.deleteSession);

  if (!session) {
    return (
      <main id="main-content" className="page">
        <div className="card column">
          <p>対象のセッションが見つかりませんでした。</p>
          <Link href="/logs" className="button btn-outline">
            記録へ戻る
          </Link>
        </div>
      </main>
    );
  }

  return (
    <main id="main-content" className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">セッション詳細</h1>
          <p className="page-subtitle">{formatDateTime(session.createdAt)}</p>
        </div>
        <Link href="/logs" className="button btn-outline">
          記録へ戻る
        </Link>
      </header>

      <section className="card">
        <h2>プロトコル</h2>
        <p>再活性化: {session.reactivationSec}秒</p>
        <p>回転課題: {session.rotation.correctCount}/{session.rotationQuestions} 正解</p>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>テトリス統計</h2>
        <p>プレイ時間: {session.tetris.durationSec}秒</p>
        <p>linesCleared: {session.tetris.linesCleared}</p>
        <p>rotationsUsed: {session.tetris.rotationsUsed}</p>
        <p>fitsAfterRotation: {session.tetris.fitsAfterRotation}</p>
        <p>piecesLocked: {session.tetris.piecesLocked}</p>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <h2>チェック結果</h2>
        <p>mood: {session.mood0to10}</p>
        <p>vividness: {session.vividness0to10}</p>
        <p>flashback: {typeof session.flashbackCount === "number" ? session.flashbackCount : "未入力"}</p>
      </section>

      <section className="card" style={{ marginTop: "1rem" }}>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            const approved = window.confirm("この記録を削除しますか？元に戻せません。");
            if (approved) {
              deleteSession(session.id);
              router.push("/logs");
            }
          }}
        >
          この記録を削除
        </button>
      </section>
    </main>
  );
}
