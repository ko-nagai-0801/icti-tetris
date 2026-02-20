"use client";

import type { ReactNode } from "react";

type SessionShellProps = {
  title: string;
  stepLabel: string;
  onCancel: () => void;
  children: ReactNode;
};

export function SessionShell({ title, stepLabel, onCancel, children }: SessionShellProps) {
  const handleCancel = (): void => {
    const approved = window.confirm("セッションを中断してホームに戻りますか？このセッション内容は保存されません。");
    if (approved) {
      onCancel();
    }
  };

  return (
    <section className="session-shell">
      <header className="session-shell-header">
        <div>
          <h2 className="page-title">{title}</h2>
          <p className="session-step">{stepLabel}</p>
        </div>
        <button type="button" className="btn-danger" onClick={handleCancel}>
          中断
        </button>
      </header>
      <div className="session-content">{children}</div>
    </section>
  );
}
