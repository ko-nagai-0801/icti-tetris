export type RuntimeIssueKind = "error" | "unhandledrejection";

export type RuntimeIssue = {
  id: string;
  kind: RuntimeIssueKind;
  message: string;
  createdAt: string;
};

const STORAGE_KEY_RUNTIME_ISSUES = "icti-tetris-runtime-issues-v1";
const MAX_ISSUES = 50;

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const normalizeMessage = (message: string): string => {
  const compact = message.replaceAll(/\s+/g, " ").trim();
  if (compact.length <= 200) {
    return compact;
  }
  return `${compact.slice(0, 197)}...`;
};

const parseIssue = (value: unknown): RuntimeIssue | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { id, kind, message, createdAt } = value;
  if (
    !isString(id) ||
    (kind !== "error" && kind !== "unhandledrejection") ||
    !isString(message) ||
    !isString(createdAt)
  ) {
    return null;
  }

  return {
    id,
    kind,
    message: normalizeMessage(message),
    createdAt
  };
};

const createId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `runtime_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
};

export const loadRuntimeIssues = (): RuntimeIssue[] => {
  if (typeof window === "undefined") {
    return [];
  }

  let raw: string | null = null;
  try {
    raw = window.localStorage.getItem(STORAGE_KEY_RUNTIME_ISSUES);
  } catch {
    return [];
  }

  if (!raw) {
    return [];
  }

  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    if (!Array.isArray(parsedUnknown)) {
      return [];
    }
    return parsedUnknown
      .map((entry) => parseIssue(entry))
      .filter((entry): entry is RuntimeIssue => entry !== null)
      .slice(0, MAX_ISSUES);
  } catch {
    return [];
  }
};

const saveRuntimeIssues = (issues: RuntimeIssue[]): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.setItem(STORAGE_KEY_RUNTIME_ISSUES, JSON.stringify(issues.slice(0, MAX_ISSUES)));
  } catch {
    // Ignore write failures. Primary app flow must continue even when storage is unavailable.
  }
};

export const recordRuntimeIssue = (kind: RuntimeIssueKind, message: string): void => {
  if (typeof window === "undefined") {
    return;
  }

  const normalized = normalizeMessage(message);
  if (normalized.length === 0) {
    return;
  }

  const nextIssue: RuntimeIssue = {
    id: createId(),
    kind,
    message: normalized,
    createdAt: new Date().toISOString()
  };

  const current = loadRuntimeIssues();
  const deduped = current.filter((entry) => {
    return !(entry.kind === nextIssue.kind && entry.message === nextIssue.message);
  });
  saveRuntimeIssues([nextIssue, ...deduped].slice(0, MAX_ISSUES));
};

export const clearRuntimeIssues = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  try {
    window.localStorage.removeItem(STORAGE_KEY_RUNTIME_ISSUES);
  } catch {
    // Ignore clear failures.
  }
};
