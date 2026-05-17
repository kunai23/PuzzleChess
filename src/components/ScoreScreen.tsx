interface Props {
  score: number;
  total: number;
  onRestart: () => void;
}

export default function ScoreScreen({ score, total, onRestart }: Props) {
  const maxScore = total * 10;
  const percent = Math.round((score / maxScore) * 100);

  const [emoji, message] =
    percent >= 90 ? ['🏆', 'Performance de Grand Maître !']
    : percent >= 70 ? ['⭐', 'Très bon travail !']
    : percent >= 50 ? ['💪', 'Continuez à pratiquer !']
    : ['📚', 'La pratique mène à la perfection !'];

  return (
    <div className="score-screen">
      <div className="score-card">
        <div className="score-emoji">{emoji}</div>
        <h2>Session terminée !</h2>
        <p className="score-message">{message}</p>

        <div className="score-stats">
          <div className="stat">
            <span className="stat-value">{score}</span>
            <span className="stat-label">Points</span>
          </div>
          <div className="stat">
            <span className="stat-value">{total}</span>
            <span className="stat-label">Puzzles</span>
          </div>
          <div className="stat">
            <span className="stat-value">{percent}%</span>
            <span className="stat-label">Précision</span>
          </div>
        </div>

        <div className="score-bar-container">
          <div className="score-bar" style={{ width: `${percent}%` }} />
        </div>

        <button className="btn btn-success" style={{ marginTop: '2rem' }} onClick={onRestart}>
          Rejouer
        </button>
      </div>
    </div>
  );
}
