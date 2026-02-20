import {
  SESSION_PROGRESS_STATUSES,
  type AppSettings,
  type AppStore,
  type RotationAnswer,
  type SessionDraft,
  type SessionProgressStatus,
  type SessionRecord,
  type TetrisStats
} from "@/lib/types";

const STORAGE_KEY = "icti-tetris-store-v1";
const STORAGE_KEY_RUNTIME = "icti-tetris-runtime-v1";

export type PersistedStore = Pick<AppStore, "settings" | "sessions">;

export type PersistedRuntime = {
  sessionStatus: SessionProgressStatus;
  activeDraft: SessionDraft;
  updatedAt: string;
};

const isRecord = (value: unknown): value is Record<string, unknown> => {
  return typeof value === "object" && value !== null;
};

const isFiniteNumber = (value: unknown): value is number => {
  return typeof value === "number" && Number.isFinite(value);
};

const isString = (value: unknown): value is string => {
  return typeof value === "string";
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const parseRotationAnswer = (value: unknown): RotationAnswer | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { questionId, isCorrect, answeredAt } = value;
  if (!isString(questionId) || typeof isCorrect !== "boolean" || !isString(answeredAt)) {
    return null;
  }

  return {
    questionId,
    isCorrect,
    answeredAt
  };
};

const parseTetrisStats = (value: unknown): TetrisStats | null => {
  if (!isRecord(value)) {
    return null;
  }

  const {
    startedAt,
    endedAt,
    durationSec,
    linesCleared,
    rotationsUsed,
    fitsAfterRotation,
    piecesLocked
  } = value;

  if (
    !isString(startedAt) ||
    !isString(endedAt) ||
    !isFiniteNumber(durationSec) ||
    !isFiniteNumber(linesCleared) ||
    !isFiniteNumber(rotationsUsed) ||
    !isFiniteNumber(fitsAfterRotation) ||
    !isFiniteNumber(piecesLocked)
  ) {
    return null;
  }

  return {
    startedAt,
    endedAt,
    durationSec: Math.max(0, Math.floor(durationSec)),
    linesCleared: Math.max(0, Math.floor(linesCleared)),
    rotationsUsed: Math.max(0, Math.floor(rotationsUsed)),
    fitsAfterRotation: Math.max(0, Math.floor(fitsAfterRotation)),
    piecesLocked: Math.max(0, Math.floor(piecesLocked))
  };
};

const parseSessionRecord = (value: unknown): SessionRecord | null => {
  if (!isRecord(value)) {
    return null;
  }

  const {
    id,
    createdAt,
    protocolVersion,
    reactivationSec,
    rotationQuestions,
    tetrisTargetSec,
    mood0to10,
    vividness0to10,
    flashbackCount,
    rotation,
    tetris
  } = value;

  if (
    !isString(id) ||
    !isString(createdAt) ||
    protocolVersion !== "v1" ||
    !isFiniteNumber(reactivationSec) ||
    !isFiniteNumber(rotationQuestions) ||
    !isFiniteNumber(tetrisTargetSec) ||
    !isFiniteNumber(mood0to10) ||
    !isFiniteNumber(vividness0to10) ||
    !isRecord(rotation)
  ) {
    return null;
  }

  const answersRaw = rotation.answers;
  const correctCountRaw = rotation.correctCount;

  if (!Array.isArray(answersRaw) || !isFiniteNumber(correctCountRaw)) {
    return null;
  }

  const answers: RotationAnswer[] = answersRaw
    .map((entry) => parseRotationAnswer(entry))
    .filter((entry): entry is RotationAnswer => entry !== null);

  const parsedTetris = parseTetrisStats(tetris);
  if (!parsedTetris) {
    return null;
  }

  return {
    id,
    createdAt,
    protocolVersion: "v1",
    reactivationSec: Math.floor(reactivationSec),
    rotationQuestions: Math.max(1, Math.floor(rotationQuestions)),
    tetrisTargetSec: Math.max(60, Math.floor(tetrisTargetSec)),
    mood0to10: clamp(Math.round(mood0to10), 0, 10),
    vividness0to10: clamp(Math.round(vividness0to10), 0, 10),
    flashbackCount: isFiniteNumber(flashbackCount) ? clamp(Math.round(flashbackCount), 0, 20) : undefined,
    rotation: {
      answers,
      correctCount: Math.max(0, Math.floor(correctCountRaw))
    },
    tetris: parsedTetris
  };
};

const parseSettings = (value: unknown): AppSettings | null => {
  if (!isRecord(value)) {
    return null;
  }

  const { protocolVersion, reactivationSec, tetrisTargetMin, emergencyNote } = value;

  if (
    protocolVersion !== "v1" ||
    (reactivationSec !== 20 && reactivationSec !== 30 && reactivationSec !== 40) ||
    tetrisTargetMin !== 20 ||
    !isString(emergencyNote)
  ) {
    return null;
  }

  return {
    protocolVersion,
    reactivationSec,
    tetrisTargetMin,
    emergencyNote
  };
};

const parseSessionDraft = (value: unknown): SessionDraft | null => {
  if (!isRecord(value)) {
    return null;
  }

  const {
    id,
    createdAt,
    reactivationSec,
    rotationQuestions,
    tetrisTargetSec,
    rotationAnswers,
    rotationCorrectCount,
    tetris
  } = value;

  if (
    !isString(id) ||
    !isString(createdAt) ||
    !isFiniteNumber(reactivationSec) ||
    !isFiniteNumber(rotationQuestions) ||
    !isFiniteNumber(tetrisTargetSec) ||
    !Array.isArray(rotationAnswers) ||
    !isFiniteNumber(rotationCorrectCount)
  ) {
    return null;
  }

  const answers: RotationAnswer[] = rotationAnswers
    .map((entry) => parseRotationAnswer(entry))
    .filter((entry): entry is RotationAnswer => entry !== null);

  let parsedTetris: TetrisStats | undefined;
  if (typeof tetris !== "undefined") {
    const maybeTetris = parseTetrisStats(tetris);
    if (!maybeTetris) {
      return null;
    }
    parsedTetris = maybeTetris;
  }

  return {
    id,
    createdAt,
    reactivationSec: Math.floor(reactivationSec),
    rotationQuestions: Math.max(1, Math.floor(rotationQuestions)),
    tetrisTargetSec: Math.max(60, Math.floor(tetrisTargetSec)),
    rotationAnswers: answers,
    rotationCorrectCount: Math.max(0, Math.floor(rotationCorrectCount)),
    tetris: parsedTetris
  };
};

const parseSessionProgressStatus = (value: unknown): SessionProgressStatus | null => {
  if (!isString(value)) {
    return null;
  }

  return SESSION_PROGRESS_STATUSES.includes(value as SessionProgressStatus)
    ? (value as SessionProgressStatus)
    : null;
};

export const loadPersistedStore = (): PersistedStore | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    if (!isRecord(parsedUnknown)) {
      return null;
    }

    const settings = parseSettings(parsedUnknown.settings);
    const sessionsRaw = parsedUnknown.sessions;
    if (!settings || !Array.isArray(sessionsRaw)) {
      return null;
    }

    const sessions: SessionRecord[] = sessionsRaw
      .map((entry) => parseSessionRecord(entry))
      .filter((entry): entry is SessionRecord => entry !== null);

    return {
      settings,
      sessions
    };
  } catch {
    return null;
  }
};

export const savePersistedStore = (store: PersistedStore): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store));
};

export const loadPersistedRuntime = (): PersistedRuntime | null => {
  if (typeof window === "undefined") {
    return null;
  }

  const raw = window.localStorage.getItem(STORAGE_KEY_RUNTIME);
  if (!raw) {
    return null;
  }

  try {
    const parsedUnknown: unknown = JSON.parse(raw);
    if (!isRecord(parsedUnknown)) {
      return null;
    }

    const status = parseSessionProgressStatus(parsedUnknown.sessionStatus);
    const draft = parseSessionDraft(parsedUnknown.activeDraft);
    const updatedAt = parsedUnknown.updatedAt;

    if (!status || !draft || !isString(updatedAt)) {
      return null;
    }

    return {
      sessionStatus: status,
      activeDraft: draft,
      updatedAt
    };
  } catch {
    return null;
  }
};

export const savePersistedRuntime = (runtime: PersistedRuntime | null): void => {
  if (typeof window === "undefined") {
    return;
  }

  if (!runtime) {
    window.localStorage.removeItem(STORAGE_KEY_RUNTIME);
    return;
  }

  window.localStorage.setItem(STORAGE_KEY_RUNTIME, JSON.stringify(runtime));
};

export const clearPersistedRuntime = (): void => {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(STORAGE_KEY_RUNTIME);
};
