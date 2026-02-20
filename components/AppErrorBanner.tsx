"use client";

import { useAppStore } from "@/lib/store";

export function AppErrorBanner() {
  const error = useAppStore((state) => state.lastError);
  const clearError = useAppStore((state) => state.clearError);

  if (!error) {
    return null;
  }

  return (
    <div className="error-banner" role="alert" aria-live="assertive">
      <span>{error}</span>
      <button type="button" className="btn-outline" onClick={clearError}>
        閉じる
      </button>
    </div>
  );
}
