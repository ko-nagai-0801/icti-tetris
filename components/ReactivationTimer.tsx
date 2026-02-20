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
      <p className="help">&quot;少しだけ&quot; 思い浮かべます。詳細を掘らなくて大丈夫です。</p>
      <p className="timer-value">{remaining}</p>
      <p className="help">秒</p>
      <div className="row">
        <button type="button" className="btn-outline" onClick={onSkip}>
          早送り（スキップ）
        </button>
      </div>
    </div>
  );
}
