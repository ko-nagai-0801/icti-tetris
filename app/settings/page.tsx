"use client";

import Link from "next/link";
import { useState } from "react";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const updateReactivationSec = useAppStore((state) => state.updateReactivationSec);
  const updateEmergencyNote = useAppStore((state) => state.updateEmergencyNote);
  const clearAllData = useAppStore((state) => state.clearAllData);

  const [emergencyDraft, setEmergencyDraft] = useState(settings.emergencyNote);
  return (
    <main id="main-content" className="page">
      <header className="page-header">
        <div>
          <h1 className="page-title">設定</h1>
          <p className="page-subtitle">MVPではテトリス時間は20分固定です。</p>
        </div>
        <Link href="/" className="button btn-outline">
          ホームへ
        </Link>
      </header>

      <section className="card column">
        <h2>再活性化秒数</h2>
        <fieldset className="settings-fieldset">
          <legend className="help">短い思い出しの時間</legend>
          <div className="row">
          {[20, 30, 40].map((seconds) => (
            <label key={seconds} className="check-item">
              <input
                type="radio"
                name="reactivationSec"
                checked={settings.reactivationSec === seconds}
                onChange={() => updateReactivationSec(seconds as 20 | 30 | 40)}
                data-testid={`settings-reactivation-${seconds}`}
              />
              {seconds}秒
            </label>
          ))}
          </div>
        </fieldset>
      </section>

      <section className="card column" style={{ marginTop: "1rem" }}>
        <h2>緊急連絡メモ</h2>
        <textarea
          rows={5}
          placeholder="連絡先・相談先をメモ"
          value={emergencyDraft}
          onChange={(event) => setEmergencyDraft(event.target.value)}
        />
        <div className="row">
          <button type="button" className="btn-primary" onClick={() => updateEmergencyNote(emergencyDraft)}>
            保存
          </button>
        </div>
      </section>

      <section className="card column" style={{ marginTop: "1rem" }}>
        <h2>データ削除</h2>
        <p className="help">設定・セッション記録をすべて削除します。</p>
        <button
          type="button"
          className="btn-danger"
          onClick={() => {
            const approved = window.confirm("全データを削除します。よろしいですか？");
            if (approved) {
              clearAllData();
            }
          }}
        >
          全データ削除
        </button>
      </section>
    </main>
  );
}
