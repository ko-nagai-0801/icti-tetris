"use client";

import { useId, type ReactNode } from "react";

type SessionShellProps = {
  title: string;
  stepLabel: string;
  onCancel: () => void;
  children: ReactNode;
};

export function SessionShell({ title, stepLabel, onCancel, children }: SessionShellProps) {
  const titleId = useId();

  const handleCancel = (): void => {
    const approved = window.confirm("セッションを中断してホームに戻りますか？このセッション内容は保存されません。");
    if (approved) {
      onCancel();
    }
  };

  return (
    <section className="session-shell" aria-labelledby={titleId}>
      <header className="session-shell-header">
        <div>
          <h2 id={titleId} className="page-title">
            {title}
          </h2>
          <p className="session-step" aria-live="polite">
            {stepLabel}
          </p>
        </div>
        <button type="button" className="btn-danger" onClick={handleCancel}>
          中断
        </button>
      </header>
      <div className="session-content">{children}</div>
    </section>
  );
}
