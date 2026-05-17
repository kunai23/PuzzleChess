import type { Puzzle } from '../data/puzzles';

interface Props {
  puzzle: Puzzle;
  index: number;
  total: number;
  score: number;
}

const difficultyColor: Record<string, string> = {
  Débutant: '#22c55e',
  Intermédiaire: '#f59e0b',
  Avancé: '#ef4444',
};

export default function PuzzleInfo({ puzzle, index, total, score }: Props) {
  return (
    <div className="puzzle-info">
      <div className="puzzle-meta">
        <span className="puzzle-counter">{index + 1} / {total}</span>
        <span
          className="difficulty-badge"
          style={{ backgroundColor: difficultyColor[puzzle.difficulty] }}
        >
          {puzzle.difficulty}
        </span>
        <span className="theme-badge">{puzzle.theme}</span>
      </div>

      <h2 className="puzzle-title">{puzzle.title}</h2>
      <p className="puzzle-desc">{puzzle.description}</p>

      <div className="player-turn">
        <div
          className="turn-indicator"
          style={{ backgroundColor: puzzle.playerColor === 'w' ? '#fff' : '#1a1a1a' }}
        />
        <span>
          Les <strong>{puzzle.playerColor === 'w' ? 'Blancs' : 'Noirs'}</strong> jouent
        </span>
      </div>

      <div className="score-display">
        <span>Score : </span>
        <strong>{score} pts</strong>
      </div>
    </div>
  );
}
