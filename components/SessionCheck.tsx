"use client";

import { useMemo, useState } from "react";

type SessionCheckInput = {
  mood0to10: number;
  vividness0to10: number;
  flashbackCount?: number;
};

type SessionCheckProps = {
  onSave: (input: SessionCheckInput) => void;
  onDiscard: () => void;
};

export function SessionCheck({ onSave, onDiscard }: SessionCheckProps) {
  const [mood, setMood] = useState(5);
  const [vividness, setVividness] = useState(5);
  const [flashbackRaw, setFlashbackRaw] = useState("");

  const parsedFlashback = useMemo((): number | undefined => {
    if (flashbackRaw.trim() === "") {
      return undefined;
    }
    const numeric = Number(flashbackRaw);
    if (!Number.isFinite(numeric)) {
      return undefined;
    }
    return Math.max(0, Math.min(20, Math.round(numeric)));
  }, [flashbackRaw]);

  const handleSave = (): void => {
    onSave({
      mood0to10: mood,
      vividness0to10: vividness,
      flashbackCount: parsedFlashback
    });
  };

  return (
    <div className="card column">
      <h3>セッション後チェック</h3>

      <label htmlFor="mood">気分: {mood}</label>
      <input
        id="mood"
        type="range"
        min={0}
        max={10}
        step={1}
        value={mood}
        onChange={(event) => setMood(Number(event.target.value))}
        data-testid="checkout-mood-slider"
      />

      <label htmlFor="vividness">記憶の鮮明さ: {vividness}</label>
      <input
        id="vividness"
        type="range"
        min={0}
        max={10}
        step={1}
        value={vividness}
        onChange={(event) => setVividness(Number(event.target.value))}
        data-testid="checkout-vividness-slider"
      />

      <label htmlFor="flashback">今日のフラッシュバック回数（任意: 0-20）</label>
      <input
        id="flashback"
        type="number"
        inputMode="numeric"
        min={0}
        max={20}
        placeholder="未入力でもOK"
        value={flashbackRaw}
        onChange={(event) => setFlashbackRaw(event.target.value)}
        data-testid="checkout-flashback-input"
      />

      <div className="row">
        <button type="button" className="btn-primary" onClick={handleSave} data-testid="checkout-save-button">
          保存して完了
        </button>
        <button type="button" className="btn-outline" onClick={onDiscard}>
          破棄してホームへ
        </button>
      </div>
    </div>
  );
}
