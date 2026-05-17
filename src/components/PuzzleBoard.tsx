import { useState, useCallback, useEffect, useRef } from 'react';
import { Chessboard } from 'react-chessboard';
import type { Puzzle } from '../data/puzzles';
import { usePuzzle } from '../hooks/usePuzzle';
import { useSound } from '../hooks/useSound';
import PuzzleAnalysis from './PuzzleAnalysis';

type PieceDropArgs = {
  piece: { pieceType: string; isSparePiece: boolean; position: string };
  sourceSquare: string;
  targetSquare: string | null;
};

type SquareClickArgs = {
  piece: { pieceType: string; color: string } | null;
  square: string;
};

interface Props {
  puzzle: Puzzle;
  onSolved: (wrong: number) => void;
}

export default function PuzzleBoard({ puzzle, onSolved }: Props) {
  const sounds = useSound();

  const { game, status, lastMove, wrongAttempts, makeMove, reset, hint } = usePuzzle(
    puzzle,
    () => sounds.playMove()
  );

  const [hintSquare, setHintSquare] = useState<string | null>(null);
  const [hintUsed, setHintUsed] = useState(false);
  const [selectedSquare, setSelectedSquare] = useState<string | null>(null);
  const [legalMoveSquares, setLegalMoveSquares] = useState<string[]>([]);
  const [flashCorrect, setFlashCorrect] = useState(false);
  const [rightClickedSquares, setRightClickedSquares] = useState<Set<string>>(new Set());
  const [showAnalysis, setShowAnalysis] = useState(false);

  // Play solved chord once when status transitions to 'solved'
  const prevStatusRef = useRef(status);
  useEffect(() => {
    if (status === 'solved' && prevStatusRef.current !== 'solved') {
      sounds.playSolved();
    }
    prevStatusRef.current = status;
  }, [status, sounds]);

  const clearSelection = () => {
    setSelectedSquare(null);
    setLegalMoveSquares([]);
  };

  const tryMove = useCallback(
    (from: string, to: string) => {
      const isPromo =
        game.get(from as never)?.type === 'p' &&
        (to[1] === '8' || to[1] === '1');
      const result = makeMove(from, to, isPromo ? 'q' : undefined);
      if (result) {
        sounds.playCorrect();
        setHintSquare(null);
        setFlashCorrect(true);
        setTimeout(() => setFlashCorrect(false), 600);
      } else {
        sounds.playWrong();
      }
      clearSelection();
      return result;
    },
    [makeMove, game, sounds]
  );

  const onDrop = useCallback(
    ({ sourceSquare, targetSquare }: PieceDropArgs) => {
      if (!targetSquare || sourceSquare === targetSquare) return false;
      return tryMove(sourceSquare, targetSquare);
    },
    [tryMove]
  );

  const onSquareRightClick = useCallback(({ square }: { square: string }) => {
    setRightClickedSquares((prev) => {
      const next = new Set(prev);
      if (next.has(square)) next.delete(square);
      else next.add(square);
      return next;
    });
  }, []);

  const onSquareClick = useCallback(
    ({ square, piece }: SquareClickArgs) => {
      setRightClickedSquares(new Set());
      if (status !== 'playing') return;

      if (selectedSquare) {
        if (legalMoveSquares.includes(square)) {
          tryMove(selectedSquare, square);
          return;
        }
        if (square === selectedSquare) {
          clearSelection();
          return;
        }
      }

      const playerTurn = puzzle.playerColor === 'w' ? 'w' : 'b';
      if (piece && piece.color === playerTurn) {
        const moves = game.moves({ square: square as never, verbose: true });
        const targets = (moves as Array<{ to: string }>).map((m) => m.to);
        setSelectedSquare(square);
        setLegalMoveSquares(targets);
      } else {
        clearSelection();
      }
    },
    [status, selectedSquare, legalMoveSquares, tryMove, game, puzzle.playerColor]
  );

  const handleSolvedClick = () => onSolved(wrongAttempts + (hintUsed ? 1 : 0));

  const handleHint = () => {
    const h = hint();
    if (h) { setHintSquare(h.from); setHintUsed(true); }
  };

  const handleReset = () => {
    reset();
    setHintSquare(null);
    setHintUsed(false);
    clearSelection();
    setRightClickedSquares(new Set());
    setShowAnalysis(false);
  };

  // Build square styles
  const squareStyles: Record<string, React.CSSProperties> = {};

  if (lastMove) {
    squareStyles[lastMove.from] = { backgroundColor: 'rgba(255, 214, 0, 0.35)' };
    squareStyles[lastMove.to] = { backgroundColor: 'rgba(255, 214, 0, 0.35)' };
  }
  if (selectedSquare) {
    squareStyles[selectedSquare] = { backgroundColor: 'rgba(100, 160, 255, 0.55)' };
  }
  legalMoveSquares.forEach((sq) => {
    const hasCapture = game.get(sq as never);
    squareStyles[sq] = hasCapture
      ? { backgroundColor: 'rgba(255, 80, 80, 0.35)', borderRadius: '50%' }
      : { background: 'radial-gradient(circle, rgba(100,200,100,0.65) 28%, transparent 30%)', borderRadius: '50%' };
  });
  rightClickedSquares.forEach((sq) => {
    squareStyles[sq] = { ...squareStyles[sq], backgroundColor: 'rgba(220, 50, 50, 0.55)', borderRadius: '4px' };
  });
  if (hintSquare) {
    squareStyles[hintSquare] = { backgroundColor: 'rgba(0, 180, 255, 0.55)', animation: 'pulse-hint 1s ease infinite' };
  }

  const boardStyle: React.CSSProperties = {
    borderRadius: '8px',
    boxShadow:
      status === 'incorrect'
        ? '0 0 0 4px #ef4444'
        : status === 'solved' || flashCorrect
        ? '0 0 0 4px #22c55e'
        : '0 4px 24px rgba(0,0,0,0.4)',
    transition: 'box-shadow 0.25s ease',
  };

  return (
    <div className="puzzle-board-container">
      <div
        className={[
          'board-wrapper',
          status === 'incorrect' ? 'shake' : '',
          status === 'solved' ? 'solved-glow' : '',
        ].join(' ')}
      >
        <Chessboard
          options={{
            position: game.fen(),
            boardOrientation: puzzle.playerColor === 'w' ? 'white' : 'black',
            squareStyles,
            boardStyle,
            animationDurationInMs: 180,
            allowDragging: status === 'playing',
            onPieceDrop: onDrop,
            onSquareClick: onSquareClick as never,
            onSquareRightClick: onSquareRightClick as never,
          }}
        />
      </div>

      <div className="board-controls">
        {status === 'solved' ? (
          <>
            <button className="btn btn-success" onClick={handleSolvedClick}>
              Puzzle suivant →
            </button>
            <button
              className={`btn btn-analysis${showAnalysis ? ' btn-analysis-active' : ''}`}
              onClick={() => setShowAnalysis((v) => !v)}
            >
              🔍 {showAnalysis ? 'Masquer' : 'Analyser'}
            </button>
          </>
        ) : (
          <>
            <button className="btn btn-hint" onClick={handleHint} disabled={!!hintSquare}>
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
        <p className="status-msg correct">🎉 Excellent ! Puzzle résolu !</p>
      )}

      {showAnalysis && status === 'solved' && <PuzzleAnalysis puzzle={puzzle} />}
    </div>
  );
}
