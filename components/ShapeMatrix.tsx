"use client";

type ShapeMatrixProps = {
  matrix: number[][];
};

export function ShapeMatrix({ matrix }: ShapeMatrixProps) {
  return (
    <div
      className="mini-shape"
      style={{
        gridTemplateColumns: `repeat(${matrix[0]?.length ?? 0}, 1fr)`
      }}
    >
      {matrix.flatMap((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <div
            key={`${rowIndex}-${colIndex}`}
            className={`mini-cell ${cell === 1 ? "on" : ""}`}
            aria-hidden="true"
          />
        ))
      )}
    </div>
  );
}
