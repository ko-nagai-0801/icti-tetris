"use client";

import { useMemo, useState } from "react";
import { getRotationQuestions } from "@/lib/rotationQuestions";
import { type RotationAnswer } from "@/lib/types";
import { ShapeMatrix } from "@/components/ShapeMatrix";

type RotationTaskProps = {
  questionCount: number;
  onComplete: (answers: RotationAnswer[], correctCount: number) => void;
};

type AnswerFeedback = "idle" | "correct" | "incorrect";

export function RotationTask({ questionCount, onComplete }: RotationTaskProps) {
  const questions = useMemo(() => getRotationQuestions(questionCount), [questionCount]);
  const [index, setIndex] = useState(0);
  const [selected, setSelected] = useState<string>("");
  const [answers, setAnswers] = useState<RotationAnswer[]>([]);
  const [feedback, setFeedback] = useState<AnswerFeedback>("idle");

  const question = questions[index];

  if (!question) {
    return (
      <div className="card">
        <p>問題が見つかりませんでした。</p>
      </div>
    );
  }

  const handleAnswer = (): void => {
    if (!selected) {
      return;
    }

    const isCorrect = selected === question.correctOptionId;
    const answer: RotationAnswer = {
      questionId: question.id,
      isCorrect,
      answeredAt: new Date().toISOString()
    };

    const nextAnswers = [...answers, answer];
    setAnswers(nextAnswers);
    setFeedback(isCorrect ? "correct" : "incorrect");

    const isLast = index === questions.length - 1;
    if (isLast) {
      const correctCount = nextAnswers.filter((entry) => entry.isCorrect).length;
      window.setTimeout(() => {
        onComplete(nextAnswers, correctCount);
      }, 250);
      return;
    }

    window.setTimeout(() => {
      setIndex((prev) => prev + 1);
      setSelected("");
      setFeedback("idle");
    }, 380);
  };

  return (
    <div className="card column">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h3 style={{ margin: 0 }}>{question.title}</h3>
        <span className="badge">
          {index + 1}/{questions.length}
        </span>
      </div>

      <p className="help">指示: {question.targetLabel}</p>

      <div className="row" style={{ alignItems: "flex-start" }}>
        <div className="column" style={{ minWidth: 140 }}>
          <strong>基準の形</strong>
          <ShapeMatrix matrix={question.base} />
        </div>
      </div>

      <div className="rotation-options">
        {question.options.map((option) => {
          const isActive = selected === option.id;
          return (
            <button
              key={option.id}
              type="button"
              className={`rotation-option ${isActive ? "active" : ""}`}
              onClick={() => setSelected(option.id)}
            >
              <strong>{option.label}</strong>
              <ShapeMatrix matrix={option.matrix} />
            </button>
          );
        })}
      </div>

      <div className="row">
        <button type="button" className="btn-primary" onClick={handleAnswer} disabled={!selected}>
          {index === questions.length - 1 ? "回答して終了" : "回答する"}
        </button>
        {feedback !== "idle" ? <span>{feedback === "correct" ? "正解" : "不正解"}</span> : null}
      </div>
    </div>
  );
}
