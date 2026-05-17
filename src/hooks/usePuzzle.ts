import { useState, useCallback, useEffect } from 'react';
import { Chess } from 'chess.js';
import type { Puzzle } from '../data/puzzles';
import { fetchPuzzleSetup } from '../services/lichessApi';

export type PuzzleStatus = 'playing' | 'correct' | 'incorrect' | 'solved';

export function usePuzzle(puzzle: Puzzle, onOpponentMove?: () => void) {
  // Start at initialFen if known, otherwise at the post-setup position
  const [game, setGame] = useState(() => new Chess(puzzle.initialFen ?? puzzle.fen));
  const [solutionIndex, setSolutionIndex] = useState(0);
  const [status, setStatus] = useState<PuzzleStatus>('playing');
  const [lastMove, setLastMove] = useState<{ from: string; to: string } | null>(null);
  const [wrongAttempts, setWrongAttempts] = useState(0);
  // false = setup animation in progress; player cannot move
  const [interactive, setInteractive] = useState(!!(puzzle.initialFen == null && puzzle.setupMove == null));

  // Animate the opponent's setup move, then unlock interaction.
  useEffect(() => {
    let cancelled = false;
    const timers: ReturnType<typeof setTimeout>[] = [];

    function animate(initialFen: string, setupFrom: string, setupTo: string, setupPromo?: string) {
      setGame(new Chess(initialFen));
      setLastMove(null);

      const t1 = setTimeout(() => {
        if (cancelled) return;
        const g = new Chess(initialFen);
        g.move({ from: setupFrom, to: setupTo, promotion: setupPromo || 'q' });
        setGame(g);
        setLastMove({ from: setupFrom, to: setupTo });

        const t2 = setTimeout(() => {
          if (!cancelled) setInteractive(true);
        }, 350);
        timers.push(t2);
      }, 700);
      timers.push(t1);
    }

    if (puzzle.initialFen && puzzle.setupMove) {
      // Data already available (API-fetched puzzle)
      const uci = puzzle.setupMove;
      animate(puzzle.initialFen, uci.slice(0, 2), uci.slice(2, 4), uci.slice(4) || undefined);
    } else {
      // Local puzzle — fetch setup data lazily from Lichess API
      fetchPuzzleSetup(puzzle.id).then((setup) => {
        if (cancelled) return;
        if (setup) {
          animate(setup.initialFen, setup.setupFrom, setup.setupTo, setup.setupPromo);
        } else {
          // API unavailable, skip animation and enable play immediately
          setInteractive(true);
        }
      }).catch(() => {
        if (!cancelled) setInteractive(true);
      });
    }

    return () => {
      cancelled = true;
      timers.forEach(clearTimeout);
    };
    // Re-run only when the puzzle itself changes (key-based remount handles this)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [puzzle.id]);

  const reset = useCallback(() => {
    setGame(new Chess(puzzle.fen));
    setSolutionIndex(0);
    setStatus('playing');
    setLastMove(null);
    setWrongAttempts(0);
    setInteractive(true); // after reset, skip setup animation
  }, [puzzle.fen]);

  const makeMove = useCallback(
    (from: string, to: string, promotion?: string) => {
      if (!interactive || status !== 'playing') return false;

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

      // Play opponent's response
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
    [interactive, game, puzzle.solution, solutionIndex, status, onOpponentMove]
  );

  const hint = useCallback(() => {
    if (solutionIndex < puzzle.solution.length) {
      const uci = puzzle.solution[solutionIndex];
      return { from: uci.slice(0, 2), to: uci.slice(2, 4) };
    }
    return null;
  }, [puzzle.solution, solutionIndex]);

  return { game, status, lastMove, wrongAttempts, interactive, makeMove, reset, hint };
}
