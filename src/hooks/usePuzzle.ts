import { useState, useCallback, useRef, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Puzzle } from '../data/puzzles';
import { fetchPuzzleSetup } from '../services/lichessApi';

export type PuzzleStatus = 'playing' | 'correct' | 'incorrect' | 'solved';

export function usePuzzle(puzzle: Puzzle, onOpponentMove?: () => void) {
  // Always start at the puzzle position (player's turn, after opponent's setup move).
  const [game, setGame] = useState(() => new Chess(puzzle.fen));
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  // Initialise lastMove from setupMove if already known, so the setup squares
  // are highlighted in yellow from the very first render.
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(
    puzzle.setupMove
      ? { from: puzzle.setupMove.slice(0, 2), to: puzzle.setupMove.slice(2, 4) }
      : null
  );
  const [wrongAttempts, setWrongAttempts] = useState(0);
  const highlightApplied = useRef(!!puzzle.setupMove);

  // If the puzzle doesn't have setupMove yet, lazily fetch it and apply as
  // the initial lastMove highlight (only if the player hasn't moved yet).
  useEffect(() => {
    if (highlightApplied.current) return;
    let cancelled = false;
    fetchPuzzleSetup(puzzle.id).then((setup) => {
      if (cancelled || !setup) return;
      highlightApplied.current = true;
      // Only set if the player hasn't moved yet (lastMove still null).
      setLastMove((prev) => prev === null ? { from: setup.setupFrom, to: setup.setupTo } : prev);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, [puzzle.id]);

  const reset = useCallback(() => {
    setGame(new Chess(puzzle.fen));
    setSolutionIndex(0);
    setStatus('playing');
    setLastMove(null);
    setWrongAttempts(0);
    highlightApplied.current = false;
  }, [puzzle.fen]);

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (status !== 'playing') return false;

      const expectedUci = puzzle.solution[solutionIndex];
      const expectedFrom = expectedUci.slice(0, 2);
      const expectedTo = expectedUci.slice(2, 4);
      const expectedPromo = expectedUci.slice(4) || undefined;

      const promoChoice = promotion || expectedPromo || 'q';
      const isCorrect =
        from === expectedFrom &&
        to === expectedTo &&
        (!expectedPromo || promoChoice === expectedPromo);

      if (!isCorrect) {
        setWrongAttempts((n) => n + 1);
        setStatus('incorrect');
        setTimeout(() => setStatus('playing'), 800);
        return false;
      }

      const newGame = new Chess(game.fen());
      const moveResult = newGame.move({ from, to, promotion: promoChoice });
      if (!moveResult) return false;

      setGame(newGame);
      setLastMove({ from, to });

      const nextIndex = solutionIndex + 1;

      if (nextIndex >= puzzle.solution.length) {
        setStatus('solved');
        setSolutionIndex(nextIndex);
        return true;
      }

      const opponentUci = puzzle.solution[nextIndex];
      const oppFrom = opponentUci.slice(0, 2);
      const oppTo = opponentUci.slice(2, 4);
      const oppPromo = opponentUci.slice(4) || undefined;

      setTimeout(() => {
        const afterOpponent = new Chess(newGame.fen());
        afterOpponent.move({ from: oppFrom, to: oppTo, promotion: oppPromo || 'q' });
        setGame(afterOpponent);
        setLastMove({ from: oppFrom, to: oppTo });
        const afterOppIndex = nextIndex + 1;
        setSolutionIndex(afterOppIndex);
        setStatus(afterOppIndex >= puzzle.solution.length ? 'solved' : 'playing');
        onOpponentMove?.();
      }, 500);

      setSolutionIndex(nextIndex);
      return true;
    },
    [game, puzzle.solution, solutionIndex, status, onOpponentMove]
  );

  const hint = useCallback(() => {
    if (solutionIndex < puzzle.solution.length) {
      const uci = puzzle.solution[solutionIndex];
      return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
    }
    return null;
  }, [puzzle.solution, solutionIndex]);

  return { game, status, lastMove, wrongAttempts, makeMove, reset, hint };
}
