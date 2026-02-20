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
  const [correctCount, setCorrectCount] = useState(0);
  const [feedback, setFeedback] = useState<AnswerFeedback>("idle");
  const [revealed, setRevealed] = useState(false);

  const question = questions[index];

  if (!question) {
    return (
      <div className="card">
        <p>問題が見つかりませんでした。</p>
      </div>
    );
  }

  const handleAnswer = (): void => {
    if (!selected || revealed) {
      return;
    }

    const isCorrect = selected === question.correctOptionId;
    const answer: RotationAnswer = {
      questionId: question.id,
      isCorrect,
      answeredAt: new Date().toISOString()
    };

    setAnswers((prev) => [...prev, answer]);
    if (isCorrect) {
      setCorrectCount((prev) => prev + 1);
    }
    setFeedback(isCorrect ? "correct" : "incorrect");
    setRevealed(true);
  };

  const handleNext = (): void => {
    if (!revealed) {
      return;
    }

    const isLast = index === questions.length - 1;
    if (isLast) {
      onComplete(answers, correctCount);
      return;
    }

    setIndex((prev) => prev + 1);
    setSelected("");
    setFeedback("idle");
    setRevealed(false);
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

      <div className="rotation-target-wrap">
        <div className="column" style={{ minWidth: 140 }}>
          <strong>基準</strong>
          <ShapeMatrix matrix={question.base} />
        </div>
        <div className="rotation-arrow">→</div>
        <div className="column" style={{ minWidth: 140 }}>
          <strong>目標の向き</strong>
          <ShapeMatrix matrix={question.targetMatrix} />
        </div>
      </div>

      <div className="rotation-options">
        {question.options.map((option) => {
          const isActive = selected === option.id;
          const disabled = revealed;
          return (
            <button
              key={option.id}
              type="button"
              className={`rotation-option ${isActive ? "active" : ""}`}
              onClick={() => setSelected(option.id)}
              disabled={disabled}
              data-testid={`rotation-option-${option.label.toLowerCase()}`}
              aria-label={`選択肢 ${option.label}`}
            >
              <strong>{option.label}</strong>
              <ShapeMatrix matrix={option.matrix} />
            </button>
          );
        })}
      </div>

      <div className="row">
        {!revealed ? (
          <button
            type="button"
            className="btn-primary"
            onClick={handleAnswer}
            disabled={!selected}
            data-testid="rotation-submit-button"
          >
            判定する
          </button>
        ) : (
          <button type="button" className="btn-primary" onClick={handleNext} data-testid="rotation-next-button">
            {index === questions.length - 1 ? "結果を確定" : "次の問題へ"}
          </button>
        )}

        {feedback !== "idle" ? <span>{feedback === "correct" ? "正解" : "不正解"}</span> : null}
      </div>

      {revealed ? <p className="help">解説: {question.explanation}</p> : null}
    </div>
  );
}
