import { Chess } from 'chess.js';
import type { Puzzle } from '../data/puzzles';
import { puzzles as localPuzzles } from '../data/puzzles';

interface LichessResponse {
  game: { pgn: string };
  puzzle: {
    id: string;
    rating: number;
    initialPly: number;
    solution: string[];
    themes: string[];
  };
}

const THEME_FR: Record<string, string> = {
  fork:             'Fourchette',
  pin:              'Clouage',
  mateIn2:          'Mat en 2',
  mateIn3:          'Mat en 3',
  mateIn4:          'Mat en 4',
  mate:             'Mat',
  promotion:        'Promotion',
  discoveredAttack: 'Attaque découverte',
  sacrifice:        'Sacrifice',
  hangingPiece:     'Gain de matériel',
  attraction:       'Attraction',
  deflection:       'Déviation',
  skewer:           'Enfilade',
  crushing:         'Combinaison',
};

function toDifficulty(rating: number): Puzzle['difficulty'] {
  if (rating < 1400) return 'Débutant';
  if (rating < 1600) return 'Intermédiaire';
  return 'Avancé';
}

// Pre-populate with local puzzles so known IDs are returned instantly
const cache = new Map<string, Puzzle>(localPuzzles.map((p) => [p.id, p]));

export async function fetchPuzzleById(id: string): Promise<Puzzle> {
  if (cache.has(id)) return cache.get(id)!;

  const res = await fetch(`https://lichess.org/api/puzzle/${id}`);
  if (!res.ok) throw new Error(`Lichess HTTP ${res.status}`);

  const data: LichessResponse = await res.json();

  // Replay game PGN to initialPly to get the puzzle start FEN
  const chess = new Chess();
  chess.loadPgn(data.game.pgn);
  const history = chess.history({ verbose: true });
  chess.reset();
  for (let i = 0; i < data.puzzle.initialPly && i < history.length; i++) {
    chess.move(history[i]);
  }

  const fen = chess.fen();
  const playerColor = chess.turn() as 'w' | 'b';
  const frenchTheme =
    data.puzzle.themes.map((t) => THEME_FR[t]).find((t) => !!t) ?? 'Tactique';

  const puzzle: Puzzle = {
    id: data.puzzle.id,
    lichessId: data.puzzle.id,
    rating: data.puzzle.rating,
    title: 'Entraînement',
    description: `${playerColor === 'w' ? 'Les Blancs' : 'Les Noirs'} jouent et gagnent.`,
    fen,
    solution: data.puzzle.solution,
    difficulty: toDifficulty(data.puzzle.rating),
    theme: frenchTheme,
    playerColor,
  };

  cache.set(id, puzzle);
  return puzzle;
}
