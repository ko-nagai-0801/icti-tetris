export type ProtocolVersion = "v1";
export type SessionId = string;

export type RotationAnswer = {
  questionId: string;
  isCorrect: boolean;
  answeredAt: string;
};

export type TetrisStats = {
  startedAt: string;
  endedAt: string;
  durationSec: number;
  linesCleared: number;
  rotationsUsed: number;
  fitsAfterRotation: number;
  piecesLocked: number;
};

export type SessionRecord = {
  id: SessionId;
  createdAt: string;
  protocolVersion: ProtocolVersion;
  reactivationSec: number;
  rotationQuestions: number;
  tetrisTargetSec: number;
  mood0to10: number;
  vividness0to10: number;
  flashbackCount?: number;
  rotation: {
    answers: RotationAnswer[];
    correctCount: number;
  };
  tetris: TetrisStats;
  cancelled?: boolean;
  cancelReason?: "user" | "timeout" | "error";
};

export type AppSettings = {
  protocolVersion: ProtocolVersion;
  reactivationSec: 20 | 30 | 40;
  tetrisTargetMin: 20;
  emergencyNote: string;
};

export type AppStore = {
  settings: AppSettings;
  sessions: SessionRecord[];
};

export type SessionStatus =
  | "IDLE"
  | "INTRO"
  | "REACTIVATION"
  | "ROTATION_TASK"
  | "TETRIS_PLAY"
  | "CHECKOUT"
  | "COMPLETED"
  | "CANCELLED";

export type CancelReason = "user" | "timeout" | "error";

export const SESSION_PROGRESS_STATUSES = [
  "INTRO",
  "REACTIVATION",
  "ROTATION_TASK",
  "TETRIS_PLAY",
  "CHECKOUT"
] as const;

export type SessionProgressStatus = (typeof SESSION_PROGRESS_STATUSES)[number];

export type SessionDraft = {
  id: SessionId;
  createdAt: string;
  reactivationSec: number;
  rotationQuestions: number;
  tetrisTargetSec: number;
  rotationAnswers: RotationAnswer[];
  rotationCorrectCount: number;
  tetris?: TetrisStats;
};

export const DEFAULT_SETTINGS: AppSettings = {
  protocolVersion: "v1",
  reactivationSec: 30,
  tetrisTargetMin: 20,
  emergencyNote: ""
};
