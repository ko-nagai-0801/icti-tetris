"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { clearRuntimeIssues, loadRuntimeIssues, type RuntimeIssue } from "@/lib/runtime-log";
import { useAppStore } from "@/lib/store";

export default function SettingsPage() {
  const settings = useAppStore((state) => state.settings);
  const updateReactivationSec = useAppStore((state) => state.updateReactivationSec);
  const updateEmergencyNote = useAppStore((state) => state.updateEmergencyNote);
  const clearAllData = useAppStore((state) => state.clearAllData);

  const [emergencyDraft, setEmergencyDraft] = useState(settings.emergencyNote);
  const [runtimeIssues, setRuntimeIssues] = useState<RuntimeIssue[]>(() => loadRuntimeIssues());
  const [copyStatus, setCopyStatus] = useState<string | null>(null);

  const runtimeIssuePreview = useMemo((): string => {
    const first = runtimeIssues[0];
    if (!first) {
      return "未記録";
    }
    const dt = new Date(first.createdAt);
    return `${dt.toLocaleString("ja-JP")} / ${first.kind}`;
  }, [runtimeIssues]);

  const copyRuntimeIssues = async (): Promise<void> => {
    if (runtimeIssues.length === 0) {
      setCopyStatus("ログはありません。");
      return;
    }

    const payload = JSON.stringify(runtimeIssues, null, 2);
    try {
      if (typeof navigator !== "undefined" && navigator.clipboard) {
        await navigator.clipboard.writeText(payload);
        setCopyStatus("技術ログをコピーしました。");
        return;
      }
    } catch {
      setCopyStatus("コピーに失敗しました。ブラウザの権限設定を確認してください。");
      return;
    }

    setCopyStatus("このブラウザではクリップボードが利用できません。");
  };

  const resetRuntimeIssues = (): void => {
    clearRuntimeIssues();
    setRuntimeIssues([]);
    setCopyStatus("技術ログを削除しました。");
  };

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
        <h2>技術ログ（任意）</h2>
        <p className="help">実行時エラーの簡易ログです。問い合わせ時にコピーして共有できます。</p>
        <p className="help">件数: {runtimeIssues.length} / 最新: {runtimeIssuePreview}</p>
        <div className="row">
          <button type="button" className="btn-outline" onClick={() => void copyRuntimeIssues()}>
            ログをコピー
          </button>
          <button type="button" className="btn-outline" onClick={resetRuntimeIssues}>
            ログを削除
          </button>
          <button type="button" className="btn-outline" onClick={() => setRuntimeIssues(loadRuntimeIssues())}>
            再読み込み
          </button>
        </div>
        {copyStatus ? <p className="help">{copyStatus}</p> : null}
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
