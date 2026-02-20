"use client";

import { useEffect, useRef, useState } from "react";

type ReactivationTimerProps = {
  seconds: number;
  onDone: () => void;
  onSkip: () => void;
};

export function ReactivationTimer({ seconds, onDone, onSkip }: ReactivationTimerProps) {
  const [remaining, setRemaining] = useState(() => seconds);
  const firedRef = useRef(false);
  const progress = Math.round(((seconds - remaining) / seconds) * 100);

  useEffect(() => {
    if (remaining <= 0) {
      if (!firedRef.current) {
        firedRef.current = true;
        onDone();
      }
      return;
    }

    const timerId = window.setTimeout(() => {
      setRemaining((prev) => prev - 1);
    }, 1000);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [remaining, onDone]);

  return (
    <div className="card column">
      <p className="help">
        ここは「短い思い出し」の工程です。出来事を少しだけ思い浮かべ、詳細を追わないまま次へ進みます。
      </p>
      <p className="timer-value">{remaining}</p>
      <p className="help">秒</p>
      <div className="timer-progress" aria-hidden="true">
        <div className="timer-progress-fill" style={{ width: `${progress}%` }} />
      </div>
      <p className="help">つらくなったら右上の「中断」を押してください。</p>
      <div className="row">
        <button type="button" className="btn-outline" onClick={onSkip}>
          次へ進む（スキップ）
        </button>
      </div>
    </div>
  );
}
