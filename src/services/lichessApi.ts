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

export interface SetupData {
  initialFen: string;
  setupFrom: string;
  setupTo: string;
  setupPromo?: string;
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

// Cache for raw Lichess API responses (shared between fetchPuzzleById + fetchPuzzleSetup)
const rawCache = new Map<string, LichessResponse>();
// Cache for processed Puzzle objects
const puzzleCache = new Map<string, Puzzle>(localPuzzles.map((p) => [p.id, p]));
// Cache for setup data (populated by API, also used to decorate local puzzles)
const setupCache = new Map<string, SetupData>();

async function fetchRaw(id: string): Promise<LichessResponse> {
  if (rawCache.has(id)) return rawCache.get(id)!;
  const res = await fetch(`https://lichess.org/api/puzzle/${id}`);
  if (!res.ok) throw new Error(`Lichess HTTP ${res.status}`);
  const data: LichessResponse = await res.json();
  rawCache.set(id, data);
  return data;
}

function parseSetup(data: LichessResponse): SetupData | null {
  if (data.puzzle.initialPly < 1) return null;
  const chess = new Chess();
  chess.loadPgn(data.game.pgn);
  const history = chess.history({ verbose: true });

  // Replay to ply BEFORE the setup move
  chess.reset();
  for (let i = 0; i < data.puzzle.initialPly - 1 && i < history.length; i++) {
    chess.move(history[i]);
  }
  const initialFen = chess.fen();

  const move = history[data.puzzle.initialPly - 1];
  if (!move) return null;

  return { initialFen, setupFrom: move.from, setupTo: move.to, setupPromo: move.promotion };
}

export async function fetchPuzzleById(id: string): Promise<Puzzle> {
  if (puzzleCache.has(id)) {
    // Enrich local puzzle with setup data if already fetched
    const p = puzzleCache.get(id)!;
    if (!p.initialFen && setupCache.has(id)) {
      const s = setupCache.get(id)!;
      return { ...p, initialFen: s.initialFen, setupMove: `${s.setupFrom}${s.setupTo}${s.setupPromo ?? ''}` };
    }
    return p;
  }

  const data = await fetchRaw(id);

  // Replay to initialPly to get the puzzle position (after setup move)
  const chess = new Chess();
  chess.loadPgn(data.game.pgn);
  const history = chess.history({ verbose: true });
  chess.reset();
  for (let i = 0; i < data.puzzle.initialPly && i < history.length; i++) {
    chess.move(history[i]);
  }

  const fen = chess.fen();
  const playerColor = chess.turn() as 'w' | 'b';
  const frenchTheme = data.puzzle.themes.map((t) => THEME_FR[t]).find((t) => !!t) ?? 'Tactique';

  const setup = parseSetup(data);
  if (setup) setupCache.set(id, setup);

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
    initialFen: setup?.initialFen,
    setupMove: setup ? `${setup.setupFrom}${setup.setupTo}${setup.setupPromo ?? ''}` : undefined,
  };

  puzzleCache.set(id, puzzle);
  return puzzle;
}

// Lazily fetch only setup data (initialFen + setupMove) for a puzzle.
// Used by usePuzzle to enrich local session puzzles with setup animation.
export async function fetchPuzzleSetup(id: string): Promise<SetupData | null> {
  if (setupCache.has(id)) return setupCache.get(id)!;
  try {
    const data = await fetchRaw(id);
    const setup = parseSetup(data);
    if (setup) setupCache.set(id, setup);
    return setup;
  } catch {
    return null;
  }
}
