import { useState, useEffect, useCallback, useRef } from 'react';
import type { Puzzle } from '../data/puzzles';
import { TRAINING_BANK } from '../data/trainingBank';
import { fetchPuzzleById } from '../services/lichessApi';
import PuzzleBoard from './PuzzleBoard';
import PuzzleInfo from './PuzzleInfo';

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

interface Props {
  theme: string;
  onBack: () => void;
}

export default function TrainingMode({ theme, onBack }: Props) {
  const [puzzle, setPuzzle] = useState<Puzzle | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [count, setCount] = useState(0);
  const [boardKey, setBoardKey] = useState(0);

  const queueRef = useRef<string[]>([]);
  const idxRef = useRef(0);

  const getNextId = useCallback(() => {
    const ids = TRAINING_BANK[theme] ?? [];
    if (ids.length === 0) return null;
    if (idxRef.current >= queueRef.current.length) {
      queueRef.current = shuffle([...ids]);
      idxRef.current = 0;
    }
    return queueRef.current[idxRef.current++];
  }, [theme]);

  const loadNext = useCallback(async () => {
    const id = getNextId();
    if (!id) {
      setError(`Aucun puzzle pour le thème "${theme}".`);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const p = await fetchPuzzleById(id);
      setPuzzle(p);
      setCount((n) => n + 1);
      setBoardKey((k) => k + 1);
    } catch {
      setError('Impossible de charger le puzzle. Vérifiez votre connexion.');
    } finally {
      setLoading(false);
    }
  }, [getNextId, theme]);

  // Load first puzzle on mount (App.tsx remounts via key={theme} on theme change)
  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadNext(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (error && !puzzle) {
    return (
      <div className="training-error">
        <p className="training-error-msg">{error}</p>
        <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'center' }}>
          <button className="btn btn-reset" onClick={loadNext}>Réessayer</button>
          <button className="btn btn-reset" onClick={onBack}>← Retour</button>
        </div>
      </div>
    );
  }

  if (loading && !puzzle) {
    return (
      <div className="training-loading">
        <div className="spinner" />
        <p>Chargement depuis Lichess…</p>
      </div>
    );
  }

  if (!puzzle) return null;

  return (
    <div className="game-layout">
      <aside className="sidebar">
        <div className="training-header">
          <button className="btn btn-back" onClick={onBack}>← Session</button>
          <div className="training-meta">
            <span className="training-theme-tag">{theme}</span>
            <span className="training-count">#{count}</span>
          </div>
        </div>
        <PuzzleInfo puzzle={puzzle} index={count - 1} total={-1} score={-1} />
        <p className="training-hint">Mode entraînement — pas de score, puzzles infinis</p>
      </aside>

      <section className="board-section">
        {loading ? (
          <div className="training-loading">
            <div className="spinner" />
            <p>Chargement…</p>
          </div>
        ) : (
          <PuzzleBoard key={boardKey} puzzle={puzzle} onSolved={loadNext} />
        )}
      </section>
    </div>
  );
}
