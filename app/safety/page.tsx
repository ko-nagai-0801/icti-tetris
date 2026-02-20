"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function SafetyPage() {
  const emergencyNote = useAppStore((state) => state.settings.emergencyNote);
  const updateEmergencyNote = useAppStore((state) => state.updateEmergencyNote);
  const [draft, setDraft] = useState(emergencyNote);

  return (
    <main className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">中断・相談</h1>
          <p className="page-subtitle">つらさが強いときは無理をしないでください。</p>
        </div>
        <Link href="/" className="button btn-outline">
          ホームへ
        </Link>
      </header>

      <section className="card column">
        <p className="disclaimer">このアプリは医療行為の代替ではありません。必要に応じて専門家へ相談してください。</p>
        <h2>つらい時の行動例</h2>
        <ul>
          <li>ゆっくり呼吸する</li>
          <li>水を飲む</li>
          <li>信頼できる人へ連絡する</li>
          <li>休息を優先する</li>
        </ul>
      </section>

      <section className="card column" style={{ marginTop: "1rem" }}>
        <h2>緊急連絡メモ</h2>
        <textarea
          rows={6}
          value={draft}
          onChange={(event) => setDraft(event.target.value)}
          placeholder="主治医・家族・友人などの連絡先メモ"
        />
        <div className="row">
          <button type="button" className="btn-primary" onClick={() => updateEmergencyNote(draft)}>
            メモ保存
          </button>
        </div>
      </section>
    </main>
  );
}
