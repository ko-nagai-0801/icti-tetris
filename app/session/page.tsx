"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ReactivationTimer } from "@/components/ReactivationTimer";
import { RotationTask } from "@/components/RotationTask";
import { SessionCheck } from "@/components/SessionCheck";
import { SessionShell } from "@/components/SessionShell";
import { TetrisCanvas } from "@/components/TetrisCanvas";
import { useAppStore } from "@/lib/store";
import { SESSION_PROGRESS_STATUSES } from "@/lib/types";

const resolveTetrisTargetSec = (defaultSec: number): number => {
  const raw = process.env.NEXT_PUBLIC_TETRIS_TARGET_SEC;
  if (!raw) {
    return defaultSec;
  }
  const parsed = Number(raw);
  if (!Number.isFinite(parsed)) {
    return defaultSec;
  }
  return Math.max(60, Math.floor(parsed));
};

export default function SessionPage() {
  const router = useRouter();
  const hydrated = useAppStore((state) => state.hydrated);
  const status = useAppStore((state) => state.sessionStatus);
  const draft = useAppStore((state) => state.activeDraft);

  const acceptTerms = useAppStore((state) => state.acceptTerms);
  const finishReactivation = useAppStore((state) => state.finishReactivation);
  const setRotationResult = useAppStore((state) => state.setRotationResult);
  const setTetrisStats = useAppStore((state) => state.setTetrisStats);
  const saveSessionCheck = useAppStore((state) => state.saveSessionCheck);
  const cancelSession = useAppStore((state) => state.cancelSession);
  const discardSession = useAppStore((state) => state.discardSession);

  const [introChecks, setIntroChecks] = useState({
    okToStop: false,
    dontDig: false,
    askHelp: false
  });

  const isInProgress = Boolean(draft) && SESSION_PROGRESS_STATUSES.some((step) => step === status);

  useEffect(() => {
    if (!hydrated) {
      return;
    }

    if (status === "COMPLETED" || status === "CANCELLED") {
      discardSession();
      router.replace("/");
      return;
    }

    if (!draft && status === "IDLE") {
      router.replace("/");
    }
  }, [discardSession, draft, hydrated, router, status]);

  useEffect(() => {
    if (!isInProgress) {
      return;
    }

    const confirmLeave = (): boolean => {
      return window.confirm("セッションの途中です。中断してホームに戻りますか？");
    };

    const onBeforeUnload = (event: BeforeUnloadEvent): void => {
      event.preventDefault();
      event.returnValue = "";
    };

    const onPopState = (): void => {
      if (confirmLeave()) {
        cancelSession("user");
        router.push("/");
        return;
      }
      window.history.pushState(null, "", window.location.href);
    };

    window.history.pushState(null, "", window.location.href);
    window.addEventListener("beforeunload", onBeforeUnload);
    window.addEventListener("popstate", onPopState);

    return () => {
      window.removeEventListener("beforeunload", onBeforeUnload);
      window.removeEventListener("popstate", onPopState);
    };
  }, [cancelSession, isInProgress, router]);

  const tetrisTargetSec = useMemo(() => {
    if (!draft) {
      return 1200;
    }
    return resolveTetrisTargetSec(draft.tetrisTargetSec);
  }, [draft]);

  const handleCancel = (): void => {
    cancelSession("user");
    router.push("/");
  };

  const handleSkipReactivation = (): void => {
    const approved = window.confirm("短い思い出しをスキップして、回転ミニ課題へ進みますか？");
    if (approved) {
      finishReactivation();
    }
  };

  if (!hydrated) {
    return (
      <main className="page">
        <div className="card">読み込み中…</div>
      </main>
    );
  }

  if (!draft) {
    return (
      <main className="page">
        <div className="card column">
          <p>進行中のセッションがありません。</p>
          <button type="button" className="btn-primary" onClick={() => router.push("/")}>
            ホームへ戻る
          </button>
        </div>
      </main>
    );
  }

  if (status === "INTRO") {
    const allChecked = introChecks.okToStop && introChecks.dontDig && introChecks.askHelp;
    const checkedCount = Number(introChecks.okToStop) + Number(introChecks.dontDig) + Number(introChecks.askHelp);

    return (
      <main className="page">
        <SessionShell title="セッション導入" stepLabel="1 / 5: 注意事項" onCancel={handleCancel}>
          <div className="card">
            <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.6rem" }}>
              <span className="badge">確認済み {checkedCount} / 3</span>
              <button
                type="button"
                className="btn-outline"
                onClick={() =>
                  setIntroChecks({
                    okToStop: !allChecked,
                    dontDig: !allChecked,
                    askHelp: !allChecked
                  })
                }
              >
                {allChecked ? "すべて解除" : "すべてチェック"}
              </button>
            </div>
            <div className="check-list">
              <label className="check-item" htmlFor="check-stop">
                <input
                  id="check-stop"
                  type="checkbox"
                  checked={introChecks.okToStop}
                  onChange={(event) =>
                    setIntroChecks((prev) => ({
                      ...prev,
                      okToStop: event.target.checked
                    }))
                  }
                />
                中断しても大丈夫
              </label>
              <label className="check-item" htmlFor="check-dig">
                <input
                  id="check-dig"
                  type="checkbox"
                  checked={introChecks.dontDig}
                  onChange={(event) =>
                    setIntroChecks((prev) => ({
                      ...prev,
                      dontDig: event.target.checked
                    }))
                  }
                />
                詳細に思い出しすぎない
              </label>
              <label className="check-item" htmlFor="check-help">
                <input
                  id="check-help"
                  type="checkbox"
                  checked={introChecks.askHelp}
                  onChange={(event) =>
                    setIntroChecks((prev) => ({
                      ...prev,
                      askHelp: event.target.checked
                    }))
                  }
                />
                つらければ止めて相談する
              </label>
            </div>
            <div className="row" style={{ marginTop: "1rem" }}>
              <button type="button" className="btn-primary" onClick={acceptTerms} disabled={!allChecked}>
                開始
              </button>
            </div>
          </div>
        </SessionShell>
      </main>
    );
  }

  if (status === "REACTIVATION") {
    return (
      <main className="page">
        <SessionShell title="短い思い出し（再活性化）" stepLabel="2 / 5: 20〜40秒の準備" onCancel={handleCancel}>
          <ReactivationTimer
            key={draft.reactivationSec}
            seconds={draft.reactivationSec}
            onDone={finishReactivation}
            onSkip={handleSkipReactivation}
          />
        </SessionShell>
      </main>
    );
  }

  if (status === "ROTATION_TASK") {
    return (
      <main className="page">
        <SessionShell title="回転ミニ課題" stepLabel="3 / 5: 3問" onCancel={handleCancel}>
          <RotationTask questionCount={draft.rotationQuestions} onComplete={setRotationResult} />
        </SessionShell>
      </main>
    );
  }

  if (status === "TETRIS_PLAY") {
    return (
      <main className="page">
        <SessionShell title="テトリス" stepLabel="4 / 5: 約20分" onCancel={handleCancel}>
          <TetrisCanvas
            targetSec={tetrisTargetSec}
            onFinish={(stats) => {
              setTetrisStats(stats);
            }}
          />
        </SessionShell>
      </main>
    );
  }

  if (status === "CHECKOUT") {
    return (
      <main className="page">
        <SessionShell title="セッション後チェック" stepLabel="5 / 5: 記録" onCancel={handleCancel}>
          <SessionCheck
            onSave={(input) => {
              saveSessionCheck(input);
              router.push("/");
            }}
            onDiscard={() => {
              discardSession();
              router.push("/");
            }}
          />
        </SessionShell>
      </main>
    );
  }

  return (
    <main className="page">
      <div className="card">状態の読み込み中です。</div>
    </main>
  );
}
