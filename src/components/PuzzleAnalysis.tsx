import { useState, useMemo } from 'react';
import { Chess } from 'chess.js';
import { Chessboard } from 'react-chessboard';
import type { Puzzle } from '../data/puzzles';

interface Props {
  puzzle: Puzzle;
}

function formatUci(uci: string) {
  const from = uci.slice(0, 2);
  const to = uci.slice(2, 4);
  const promo = uci.length > 4 ? `=${uci[4].toUpperCase()}` : '';
  return `${from} → ${to}${promo}`;
}

export default function PuzzleAnalysis({ puzzle }: Props) {
  const [step, setStep] = useState(0);

  const positions = useMemo(() => {
    const chess = new Chess(puzzle.fen);
    const fens: string[] = [chess.fen()];
    for (const uci of puzzle.solution) {
      chess.move({ from: uci.slice(0, 2), to: uci.slice(2, 4), promotion: uci.slice(4) || undefined });
      fens.push(chess.fen());
    }
    return fens;
  }, [puzzle]);

  const lastUci = step > 0 ? puzzle.solution[step - 1] : null;
  const squareStyles: Record<string, React.CSSProperties> = {};
  if (lastUci) {
    squareStyles[lastUci.slice(0, 2)] = { backgroundColor: 'rgba(255, 214, 0, 0.35)' };
    squareStyles[lastUci.slice(2, 4)] = { backgroundColor: 'rgba(255, 214, 0, 0.35)' };
  }

  const total = puzzle.solution.length;

  return (
    <div className="analysis-panel">
      <h3 className="analysis-title">🔍 Analyse de la solution</h3>
      <div className="analysis-layout">
        <div className="analysis-board-wrap">
          <Chessboard
            options={{
              position: positions[step],
              boardOrientation: puzzle.playerColor === 'w' ? 'white' : 'black',
              squareStyles,
              allowDragging: false,
              animationDurationInMs: 200,
            }}
          />
        </div>

        <div className="analysis-sidebar">
          <div className="move-list">
            <div
              className={`move-item${step === 0 ? ' active' : ''}`}
              onClick={() => setStep(0)}
            >
              Position initiale
            </div>
            {puzzle.solution.map((uci, i) => {
              const isPlayer = i % 2 === 0;
              return (
                <div
                  key={i}
                  className={`move-item${step === i + 1 ? ' active' : ''}${isPlayer ? ' player-move' : ' opp-move'}`}
                  onClick={() => setStep(i + 1)}
                >
                  <span className="move-num">{Math.floor(i / 2) + 1}{i % 2 === 0 ? '.' : '…'}</span>
                  <span className="move-uci">{formatUci(uci)}</span>
                  <span className={`move-badge ${isPlayer ? 'badge-player' : 'badge-opp'}`}>
                    {isPlayer ? 'Vous' : 'Adversaire'}
                  </span>
                </div>
              );
            })}
          </div>

          <div className="analysis-nav">
            <button
              className="btn btn-nav"
              onClick={() => setStep((s) => Math.max(0, s - 1))}
              disabled={step === 0}
            >
              ← Précédent
            </button>
            <span className="step-counter">{step} / {total}</span>
            <button
              className="btn btn-nav"
              onClick={() => setStep((s) => Math.min(total, s + 1))}
              disabled={step === total}
            >
              Suivant →
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
