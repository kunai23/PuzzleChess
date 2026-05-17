import { useState, useCallback } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Puzzle } from '../data/puzzles';

type PieceDropArgs = {
  piece: { pieceType: string; isSparePiece: boolean; position: string };
  sourceSquare: string;
  targetSquare: string | null;
};
import { usePuzzle } from '../hooks/usePuzzle';

interface Props {
  puzzle: Puzzle;
  onSolved: (wrong: number) => void;
}

export default function PuzzleBoard({ puzzle, onSolved }: Props) {
  const { game, status, lastMove, wrongAttempts, makeMove, reset, hint } = usePuzzle(puzzle);
  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);

  const onDrop = useCallback(
    ({ piece, sourceSquare, targetSquare }: PieceDropArgs) => {
      if (!targetSquare) return false;
      const pieceType = piece.pieceType;
      const isPromo = pieceType?.slice(1) === 'P' && (targetSquare[1] === '8' || targetSquare[1] === '1');
      const result = makeMove(sourceSquare, targetSquare, isPromo ? 'q' : undefined);
      if (result) setHintSquare(null);
      return result;
    },
    [makeMove]
  );

  const handleSolvedClick = () => {
    onSolved(wrongAttempts + (hintUsed ? 1 : 0));
  };

  const handleHint = () => {
    const h = hint();
    if (h) {
      setHintSquare(h.from);
      setHintUsed(true);
    }
  };

  const handleReset = () => {
    reset();
    setHintSquare(null);
    setHintUsed(false);
  };

  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255,214,0,0.4)' };
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255,214,0,0.4)' };
  }
  if (hintSquare) {
    squareStyles[hintSquare] = { backgroundColor: 'rgba(0,180,255,0.55)' };
  }

  const boardStyle: React.CSSProperties = {
    borderRadius: '8px',
    boxShadow:
      status === 'incorrect'
        ? '0 0 0 4px #ef4444'
        : status === 'solved'
        ? '0 0 0 4px #22c55e'
        : '0 4px 24px rgba(0,0,0,0.4)',
  };

  return (
    <div className="puzzle-board-container">
      <div className={`board-wrapper ${status === 'incorrect' ? 'shake' : ''}`}>
        <Chessboard
          options={{
            position: game.fen(),
            boardOrientation: puzzle.playerColor === 'w' ? 'white' : 'black',
            squareStyles,
            boardStyle,
            animationDurationInMs: 200,
            allowDragging: status === 'playing',
            onPieceDrop: onDrop,
          }}
        />
      </div>

      <div className="board-controls">
        {status === 'solved' ? (
          <button className="btn btn-success" onClick={handleSolvedClick}>
            Puzzle suivant →
          </button>
        ) : (
          <>
            <button className="btn btn-hint" onClick={handleHint}>
              💡 Indice
            </button>
            <button className="btn btn-reset" onClick={handleReset}>
              ↺ Réinitialiser
            </button>
          </>
        )}
      </div>

      {status === 'incorrect' && (
        <p className="status-msg incorrect">Ce n'est pas le bon coup, essayez encore !</p>
      )}
      {status === 'solved' && (
        <p className="status-msg correct">Excellent ! Puzzle résolu !</p>
      )}
    </div>
  );
}
