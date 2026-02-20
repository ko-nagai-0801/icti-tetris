"use client";

type ShapeMatrixProps = {
  matrix: number[][];
};

const trimMatrix = (matrix: number[][]): number[][] => {
  let minRow = matrix.length;
  let maxRow = -1;
  let minCol = matrix[0]?.length ?? 0;
  let maxCol = -1;

  for (let row = 0; row < matrix.length; row += 1) {
    for (let col = 0; col < matrix[row].length; col += 1) {
      if (matrix[row][col] === 1) {
        minRow = Math.min(minRow, row);
        maxRow = Math.max(maxRow, row);
        minCol = Math.min(minCol, col);
        maxCol = Math.max(maxCol, col);
      }
    }
  }

  if (maxRow === -1) {
    return matrix;
  }

  return matrix.slice(minRow, maxRow + 1).map((row) => row.slice(minCol, maxCol + 1));
};

export function ShapeMatrix({ matrix }: ShapeMatrixProps) {
  const trimmed = trimMatrix(matrix);

  return (
    <div
      className="mini-shape"
      style={{
        gridTemplateColumns: `repeat(${trimmed[0]?.length ?? 0}, 1fr)`
      }}
    >
      {trimmed.flatMap((row, rowIndex) =>
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
