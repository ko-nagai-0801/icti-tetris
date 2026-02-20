import { create } from "zustand";
import { loadPersistedStore, savePersistedStore } from "@/lib/persist";
import {
  DEFAULT_SETTINGS,
  type AppSettings,
  type CancelReason,
  type RotationAnswer,
  type SessionDraft,
  type SessionId,
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
  settings: AppSettings;
  sessions: SessionRecord[];
  sessionStatus: SessionStatus;
  activeDraft: SessionDraft | null;
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

const persist = (payload: SavePayload): void => {
  savePersistedStore(payload);
};

export const useAppStore = create<AppState>((set, get) => ({
  hydrated: false,
  settings: DEFAULT_SETTINGS,
  sessions: [],
  sessionStatus: "IDLE",
  activeDraft: null,

  hydrateFromStorage: () => {
    const loaded = loadPersistedStore();
    if (loaded) {
      set({
        settings: loaded.settings,
        sessions: loaded.sessions,
        hydrated: true
      });
      return;
    }
    set({ hydrated: true });
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

    set({
      sessionStatus: "INTRO",
      activeDraft: draft
    });
  },

  acceptTerms: () => {
    const current = get();
    if (current.sessionStatus !== "INTRO" || !current.activeDraft) {
      return;
    }
    set({ sessionStatus: "REACTIVATION" });
  },

  finishReactivation: () => {
    const current = get();
    if (current.sessionStatus !== "REACTIVATION" || !current.activeDraft) {
      return;
    }
    set({ sessionStatus: "ROTATION_TASK" });
  },

  setRotationResult: (answers, correctCount) => {
    const current = get();
    if (current.sessionStatus !== "ROTATION_TASK" || !current.activeDraft) {
      return;
    }

    set({
      activeDraft: {
        ...current.activeDraft,
        rotationAnswers: answers,
        rotationCorrectCount: Math.max(0, Math.floor(correctCount))
      },
      sessionStatus: "TETRIS_PLAY"
    });
  },

  setTetrisStats: (stats) => {
    const current = get();
    if (current.sessionStatus !== "TETRIS_PLAY" || !current.activeDraft) {
      return;
    }

    set({
      activeDraft: {
        ...current.activeDraft,
        tetris: stats
      },
      sessionStatus: "CHECKOUT"
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
    set({
      sessions,
      activeDraft: null,
      sessionStatus: "COMPLETED"
    });

    persist({
      settings: current.settings,
      sessions
    });
  },

  cancelSession: (reason = "user") => {
    void reason;
    set({
      sessionStatus: "CANCELLED",
      activeDraft: null
    });
  },

  discardSession: () => {
    set({
      sessionStatus: "IDLE",
      activeDraft: null
    });
  },

  updateReactivationSec: (seconds) => {
    const current = get();
    const settings: AppSettings = {
      ...current.settings,
      reactivationSec: seconds
    };
    set({ settings });
    persist({ settings, sessions: current.sessions });
  },

  updateEmergencyNote: (note) => {
    const current = get();
    const settings: AppSettings = {
      ...current.settings,
      emergencyNote: note
    };
    set({ settings });
    persist({ settings, sessions: current.sessions });
  },

  clearAllData: () => {
    set({
      settings: DEFAULT_SETTINGS,
      sessions: [],
      activeDraft: null,
      sessionStatus: "IDLE"
    });
    persist({ settings: DEFAULT_SETTINGS, sessions: [] });
  },

  deleteSession: (id) => {
    const current = get();
    const sessions = current.sessions.filter((session) => session.id !== id);
    set({ sessions });
    persist({ settings: current.settings, sessions });
  }
}));
