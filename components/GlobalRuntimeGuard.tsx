"use client";

import { useEffect } from "react";
import { recordRuntimeIssue } from "@/lib/runtime-log";
import { useAppStore } from "@/lib/store";

const USER_MESSAGE = "予期しないエラーを検知しました。ページを再読み込みして再試行してください。";

const toErrorMessage = (value: unknown): string => {
  if (value instanceof Error) {
    return value.message || value.name;
  }
  if (typeof value === "string") {
    return value;
  }
  return "詳細不明";
};

export function GlobalRuntimeGuard() {
  const reportRuntimeError = useAppStore((state) => state.reportRuntimeError);

  useEffect(() => {
    const onError = (event: ErrorEvent): void => {
      const detail = event.message || toErrorMessage(event.error);
      recordRuntimeIssue("error", detail);
      console.error("[ICTI] runtime error", event.error ?? event.message);
      reportRuntimeError(USER_MESSAGE);
    };

    const onUnhandledRejection = (event: PromiseRejectionEvent): void => {
      const detail = toErrorMessage(event.reason);
      recordRuntimeIssue("unhandledrejection", detail);
      console.error("[ICTI] unhandled rejection", event.reason);
      reportRuntimeError(USER_MESSAGE);
    };

    window.addEventListener("error", onError);
    window.addEventListener("unhandledrejection", onUnhandledRejection);

    return () => {
      window.removeEventListener("error", onError);
      window.removeEventListener("unhandledrejection", onUnhandledRejection);
    };
  }, [reportRuntimeError]);

  return null;
}
