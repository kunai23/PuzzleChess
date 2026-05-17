import { useState } from 'react';
import { puzzles } from './data/puzzles';
import PuzzleBoard from './components/PuzzleBoard';
import PuzzleInfo from './components/PuzzleInfo';
import ScoreScreen from './components/ScoreScreen';
import './App.css';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export default function App() {
  const [session, setSession] = useState(() => shuffle(puzzles));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [key, setKey] = useState(0);

  const handleSolved = (wrongAttempts: number) => {
    const points = Math.max(0, 10 - wrongAttempts * 3);
    setScore((s) => s + points);

    if (currentIndex + 1 >= session.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setKey((k) => k + 1);
    }
  };

  const handleRestart = () => {
    setSession(shuffle(puzzles));
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setKey((k) => k + 1);
  };

  const puzzle = session[currentIndex];

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">♟</span>
            <span className="logo-text">PuzzleChess</span>
          </div>
          <nav className="header-nav">
            <span className="nav-score">Score : {score} pts</span>
          </nav>
        </div>
      </header>

      <main className="main">
        {finished ? (
          <ScoreScreen score={score} total={session.length} onRestart={handleRestart} />
        ) : (
          <div className="game-layout">
            <aside className="sidebar">
              <PuzzleInfo
                puzzle={puzzle}
                index={currentIndex}
                total={session.length}
                score={score}
              />
              <div className="progress-bar-container">
                <div
                  className="progress-bar"
                  style={{ width: `${((currentIndex) / session.length) * 100}%` }}
                />
              </div>
              <p className="progress-label">
                {currentIndex} / {session.length} puzzles complétés
              </p>
            </aside>

            <section className="board-section">
              <PuzzleBoard key={key} puzzle={puzzle} onSolved={handleSolved} />
            </section>
          </div>
        )}
      </main>
    </div>
  );
}
