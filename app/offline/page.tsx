import Link from "next/link";

export default function OfflinePage() {
  return (
    <main id="main-content" className="page">
      <section className="card column">
        <h1 className="page-title">オフラインです</h1>
        <p className="help">通信が復旧したら再読み込みしてください。保存済みの記録は端末内に残っています。</p>
        <Link href="/" className="button btn-outline">
          ホームへ戻る
        </Link>
      </section>
    </main>
  );
}
