import { useState, useEffect } from 'react';
import { puzzles, extraPuzzleMeta } from './data/puzzles';
import type { Puzzle, PuzzleMeta } from './data/puzzles';
import { fetchPuzzleById } from './services/lichessApi';
import PuzzleBoard from './components/PuzzleBoard';
import PuzzleInfo from './components/PuzzleInfo';
import ScoreScreen from './components/ScoreScreen';
import ThemeFilter from './components/ThemeFilter';
import TrainingMode from './components/TrainingMode';
import './App.css';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Full session pool: local puzzles + extra IDs (fetched from API when reached)
const fullPool: PuzzleMeta[] = [
  ...puzzles,
  ...extraPuzzleMeta,
];

function buildSession(theme: string): PuzzleMeta[] {
  const pool = theme === 'Tous' ? fullPool : fullPool.filter((p) => p.theme === theme);
  return shuffle(pool.length > 0 ? pool : fullPool);
}

type AppMode = 'session' | 'training';

export default function App() {
  const [mode, setMode] = useState<AppMode>('session');
  const [activeTheme, setActiveTheme] = useState('Tous');
  const [trainingTheme, setTrainingTheme] = useState('Fourchette');

  // Session state
  const [session, setSession] = useState<PuzzleMeta[]>(() => buildSession('Tous'));
  const [currentIndex, setCurrentIndex] = useState(0);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);

  // The currently-active puzzle (full data, loaded from cache/API)
  const [activePuzzle, setActivePuzzle] = useState<Puzzle | null>(null);
  const [loadingPuzzle, setLoadingPuzzle] = useState(true);
  const [boardKey, setBoardKey] = useState(0);

  // Load full puzzle data whenever index or session changes.
  // The sync setState calls are intentional resets before an async fetch.
  /* eslint-disable react-hooks/set-state-in-effect */
  useEffect(() => {
    if (mode !== 'session' || finished) return;
    const meta = session[currentIndex];
    let cancelled = false;
    setActivePuzzle(null);
    setLoadingPuzzle(true);

    fetchPuzzleById(meta.id).then((puzzle) => {
      if (!cancelled) { setActivePuzzle(puzzle); setLoadingPuzzle(false); }
    }).catch(() => {
      if (!cancelled) {
        const local = puzzles.find((p) => p.id === meta.id) ?? null;
        setActivePuzzle(local);
        setLoadingPuzzle(false);
      }
    });
    return () => { cancelled = true; };
  }, [session, currentIndex, mode, finished]);
  /* eslint-enable react-hooks/set-state-in-effect */

  const handleThemeChange = (theme: string) => {
    setActiveTheme(theme);
    setSession(buildSession(theme));
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setBoardKey((k) => k + 1);
  };

  const handleSolved = (wrongAttempts: number) => {
    const points = Math.max(0, 10 - wrongAttempts * 3);
    setScore((s) => s + points);
    if (currentIndex + 1 >= session.length) {
      setFinished(true);
    } else {
      setCurrentIndex((i) => i + 1);
      setBoardKey((k) => k + 1);
    }
  };

  const handleRestart = () => {
    setSession(buildSession(activeTheme));
    setCurrentIndex(0);
    setScore(0);
    setFinished(false);
    setBoardKey((k) => k + 1);
  };

  const startTraining = (theme: string) => {
    setTrainingTheme(theme);
    setMode('training');
  };

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-inner">
          <div className="logo">
            <span className="logo-icon">♟</span>
            <span className="logo-text">PuzzleChess</span>
          </div>
          <nav className="header-nav">
            {mode === 'session' ? (
              <>
                <span className="nav-score">Score : {score} pts</span>
                <button
                  className="btn btn-training-toggle"
                  onClick={() => startTraining(activeTheme === 'Tous' ? 'Fourchette' : activeTheme)}
                >
                  ∞ Entraînement
                </button>
              </>
            ) : (
              <button className="btn btn-training-toggle" onClick={() => setMode('session')}>
                ← Session
              </button>
            )}
          </nav>
        </div>
      </header>

      <main className="main">
        {mode === 'training' ? (
          <TrainingMode key={trainingTheme} theme={trainingTheme} onBack={() => setMode('session')} />
        ) : finished ? (
          <ScoreScreen score={score} total={session.length} onRestart={handleRestart} />
        ) : (
          <>
            <ThemeFilter active={activeTheme} onChange={handleThemeChange} />
            <div className="game-layout">
              <aside className="sidebar">
                {activePuzzle && (
                  <>
                    <PuzzleInfo
                      puzzle={activePuzzle}
                      index={currentIndex}
                      total={session.length}
                      score={score}
                    />
                    <div className="progress-bar-container">
                      <div
                        className="progress-bar"
                        style={{ width: `${(currentIndex / session.length) * 100}%` }}
                      />
                    </div>
                    <p className="progress-label">
                      {currentIndex} / {session.length} puzzles complétés
                    </p>
                    <button
                      className="btn btn-training-sidebar"
                      onClick={() => startTraining(activeTheme === 'Tous' ? 'Fourchette' : activeTheme)}
                    >
                      ∞ Entraîner ce thème
                    </button>
                  </>
                )}
              </aside>

              <section className="board-section">
                {loadingPuzzle || !activePuzzle ? (
                  <div className="training-loading">
                    <div className="spinner" />
                    <p>Chargement du puzzle…</p>
                  </div>
                ) : (
                  <PuzzleBoard key={boardKey} puzzle={activePuzzle} onSolved={handleSolved} />
                )}
              </section>
            </div>
          </>
        )}
      </main>
    </div>
  );
}
