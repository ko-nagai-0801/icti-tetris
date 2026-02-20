import { create } from "zustand";
import {
  clearPersistedRuntime,
  loadPersistedRuntime,
  loadPersistedStore,
  savePersistedRuntime,
  savePersistedStore,
  type PersistWriteResult
} from "@/lib/persist";
import {
  SESSION_PROGRESS_STATUSES,
  DEFAULT_SETTINGS,
  type AppSettings,
  type CancelReason,
  type RotationAnswer,
  type SessionDraft,
  type SessionId,
  type SessionProgressStatus,
  type SessionRecord,
  type SessionStatus,
  type TetrisStats
} from "@/lib/types";

type SavePayload = {
  settings: AppSettings;
  sessions: SessionRecord[];
};

type SessionCheckInput = {
  mood0to10: number;
  vividness0to10: number;
  flashbackCount?: number;
};

type AppState = {
  hydrated: boolean;
  lastError: string | null;
  settings: AppSettings;
  sessions: SessionRecord[];
  sessionStatus: SessionStatus;
  activeDraft: SessionDraft | null;
  clearError: () => void;
  reportRuntimeError: (message: string) => void;
  hydrateFromStorage: () => void;
  startSession: () => void;
  acceptTerms: () => void;
  finishReactivation: () => void;
  setRotationResult: (answers: RotationAnswer[], correctCount: number) => void;
  setTetrisStats: (stats: TetrisStats) => void;
  saveSessionCheck: (input: SessionCheckInput) => void;
  cancelSession: (reason?: CancelReason) => void;
  discardSession: () => void;
  updateReactivationSec: (seconds: 20 | 30 | 40) => void;
  updateEmergencyNote: (note: string) => void;
  clearAllData: () => void;
  deleteSession: (id: SessionId) => void;
};

const clamp = (value: number, min: number, max: number): number => {
  return Math.max(min, Math.min(max, value));
};

const createSessionId = (): string => {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `sess_${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
};

const toError = (result: PersistWriteResult): string | null => {
  return result.ok ? null : result.error;
};

const mergeErrors = (...errors: Array<string | null>): string | null => {
  return errors.find((entry): entry is string => typeof entry === "string" && entry.length > 0) ?? null;
};

const persistStore = (payload: SavePayload): PersistWriteResult => {
  return savePersistedStore(payload);
};

const isSessionProgressStatus = (status: SessionStatus): status is SessionProgressStatus => {
  return SESSION_PROGRESS_STATUSES.some((step) => step === status);
};

const persistRuntime = (sessionStatus: SessionStatus, activeDraft: SessionDraft | null): PersistWriteResult => {
  if (!activeDraft || !isSessionProgressStatus(sessionStatus)) {
    return clearPersistedRuntime();
  }

  return savePersistedRuntime({
    sessionStatus,
    activeDraft,
    updatedAt: new Date().toISOString()
  });
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  lastError: null,
  settings: DEFAULT_SETTINGS,
  sessions: [],
  sessionStatus: "IDLE",
  activeDraft: null,

  clearError: () => {
    set({ lastError: null });
  },

  reportRuntimeError: (message) => {
    const normalized = message.trim();
    if (normalized.length === 0) {
      return;
    }
    set((state) => ({
      lastError: state.lastError === normalized ? state.lastError : normalized
    }));
  },

  hydrateFromStorage: () => {
    const loaded = loadPersistedStore();
    const runtime = loadPersistedRuntime();
    set({
      settings: loaded?.settings ?? DEFAULT_SETTINGS,
      sessions: loaded?.sessions ?? [],
      sessionStatus: runtime?.sessionStatus ?? "IDLE",
      activeDraft: runtime?.activeDraft ?? null,
      lastError: null,
      hydrated: true
    });
  },

  startSession: () => {
    const settings = get().settings;
    const draft: SessionDraft = {
      id: createSessionId(),
      createdAt: new Date().toISOString(),
      reactivationSec: settings.reactivationSec,
      rotationQuestions: 3,
      tetrisTargetSec: settings.tetrisTargetMin * 60,
      rotationAnswers: [],
      rotationCorrectCount: 0
    };

    const runtimeResult = persistRuntime("INTRO", draft);
    set({
      sessionStatus: "INTRO",
      activeDraft: draft,
      lastError: toError(runtimeResult)
    });
  },

  acceptTerms: () => {
    const current = get();
    if (current.sessionStatus !== "INTRO" || !current.activeDraft) {
      return;
    }

    const runtimeResult = persistRuntime("REACTIVATION", current.activeDraft);
    set({
      sessionStatus: "REACTIVATION",
      lastError: toError(runtimeResult)
    });
  },

  finishReactivation: () => {
    const current = get();
    if (current.sessionStatus !== "REACTIVATION" || !current.activeDraft) {
      return;
    }

    const runtimeResult = persistRuntime("ROTATION_TASK", current.activeDraft);
    set({
      sessionStatus: "ROTATION_TASK",
      lastError: toError(runtimeResult)
    });
  },

  setRotationResult: (answers, correctCount) => {
    const current = get();
    if (current.sessionStatus !== "ROTATION_TASK" || !current.activeDraft) {
      return;
    }

    const nextDraft: SessionDraft = {
      ...current.activeDraft,
      rotationAnswers: answers,
      rotationCorrectCount: Math.max(0, Math.floor(correctCount))
    };

    const runtimeResult = persistRuntime("TETRIS_PLAY", nextDraft);
    set({
      activeDraft: nextDraft,
      sessionStatus: "TETRIS_PLAY",
      lastError: toError(runtimeResult)
    });
  },

  setTetrisStats: (stats) => {
    const current = get();
    if (current.sessionStatus !== "TETRIS_PLAY" || !current.activeDraft) {
      return;
    }

    const nextDraft: SessionDraft = {
      ...current.activeDraft,
      tetris: stats
    };

    const runtimeResult = persistRuntime("CHECKOUT", nextDraft);
    set({
      activeDraft: nextDraft,
      sessionStatus: "CHECKOUT",
      lastError: toError(runtimeResult)
    });
  },

  saveSessionCheck: (input) => {
    const current = get();
    if (!current.activeDraft || !current.activeDraft.tetris) {
      return;
    }

    const record: SessionRecord = {
      id: current.activeDraft.id,
      createdAt: current.activeDraft.createdAt,
      protocolVersion: "v1",
      reactivationSec: current.activeDraft.reactivationSec,
      rotationQuestions: current.activeDraft.rotationQuestions,
      tetrisTargetSec: current.activeDraft.tetrisTargetSec,
      rotation: {
        answers: current.activeDraft.rotationAnswers,
        correctCount: current.activeDraft.rotationCorrectCount
      },
      tetris: current.activeDraft.tetris,
      mood0to10: clamp(Math.round(input.mood0to10), 0, 10),
      vividness0to10: clamp(Math.round(input.vividness0to10), 0, 10),
      flashbackCount:
        typeof input.flashbackCount === "number"
          ? clamp(Math.round(input.flashbackCount), 0, 20)
          : undefined
    };

    const sessions = [record, ...current.sessions];
    const saveResult = persistStore({ settings: current.settings, sessions });
    const clearRuntimeResult = clearPersistedRuntime();

    set({
      sessions,
      activeDraft: null,
      sessionStatus: "COMPLETED",
      lastError: mergeErrors(toError(saveResult), toError(clearRuntimeResult))
    });
  },

  cancelSession: (reason = "user") => {
    void reason;
    const clearResult = clearPersistedRuntime();
    set({
      sessionStatus: "CANCELLED",
      activeDraft: null,
      lastError: toError(clearResult)
    });
  },

  discardSession: () => {
    const clearResult = clearPersistedRuntime();
    set({
      sessionStatus: "IDLE",
      activeDraft: null,
      lastError: toError(clearResult)
    });
  },

  updateReactivationSec: (seconds) => {
    const current = get();
    const settings: AppSettings = {
      ...current.settings,
      reactivationSec: seconds
    };
    const saveResult = persistStore({ settings, sessions: current.sessions });

    set({
      settings,
      lastError: toError(saveResult)
    });
  },

  updateEmergencyNote: (note) => {
    const current = get();
    const settings: AppSettings = {
      ...current.settings,
      emergencyNote: note
    };
    const saveResult = persistStore({ settings, sessions: current.sessions });

    set({
      settings,
      lastError: toError(saveResult)
    });
  },

  clearAllData: () => {
    const saveResult = persistStore({ settings: DEFAULT_SETTINGS, sessions: [] });
    const clearRuntimeResult = clearPersistedRuntime();

    set({
      settings: DEFAULT_SETTINGS,
      sessions: [],
      activeDraft: null,
      sessionStatus: "IDLE",
      lastError: mergeErrors(toError(saveResult), toError(clearRuntimeResult))
    });
  },

  deleteSession: (id) => {
    const current = get();
    const sessions = current.sessions.filter((session) => session.id !== id);
    const saveResult = persistStore({ settings: current.settings, sessions });

    set({
      sessions,
      lastError: toError(saveResult)
    });
  }
}));
