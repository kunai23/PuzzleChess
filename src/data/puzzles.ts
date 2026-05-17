export interface Puzzle {
  id: string;
  title: string;
  description: string;
  fen: string;
  solution: string[];
  difficulty: 'Débutant' | 'Intermédiaire' | 'Avancé';
  theme: string;
  playerColor: 'w' | 'b';
  rating: number;
  lichessId: string;
}

// Puzzles issus de la base Lichess (https://database.lichess.org/#puzzles)
// Format : FEN après le premier coup auto-joué, solution = coups restants
export const puzzles: Puzzle[] = [
  {
    id: 'NtFPE',
    lichessId: 'NtFPE',
    title: 'Sacrifice et Fourchette',
    description: 'Les Blancs jouent et gagnent du matériel décisivement en 2 coups.',
    fen: '3qkbnr/3b1ppp/p7/1p1pPB2/5BQ1/8/1P3PPP/2R3K1 w k - 2 19',
    solution: ['f5d7', 'd8d7', 'c1c8'],
    difficulty: 'Débutant',
    theme: 'Combinaison',
    playerColor: 'w',
    rating: 1314,
  },
  {
    id: 'mJDcO',
    lichessId: 'mJDcO',
    title: 'Mat en 2 — Finale',
    description: 'Les Noirs jouent et font mat en 2 coups.',
    fen: '5rk1/p1Q3pp/8/3p4/3q1R2/8/P1P3PP/R6K b - - 0 21',
    solution: ['d4a1', 'f4f1', 'a1f1'],
    difficulty: 'Débutant',
    theme: 'Mat en 2',
    playerColor: 'b',
    rating: 1321,
  },
  {
    id: 'f2p5F',
    lichessId: 'f2p5F',
    title: 'Fourchette en Finale',
    description: 'Les Noirs jouent et gagnent du matériel avec une fourchette.',
    fen: '5r2/p3R2p/6p1/3B2k1/2p2b2/2P2P2/P5P1/1q2QK2 b - - 2 39',
    solution: ['b1d3', 'f1f2', 'd3d5'],
    difficulty: 'Débutant',
    theme: 'Fourchette',
    playerColor: 'b',
    rating: 1385,
  },
  {
    id: 'LDIfb',
    lichessId: 'LDIfb',
    title: 'Contre-attaque Sicilienne',
    description: 'Les Blancs jouent et récupèrent la pièce perdue avec une fourchette.',
    fen: 'rnbqkb1r/pp2pp1p/3p2p1/2p5/4n3/2P2N1P/PP1PBPP1/RNBQK2R w KQkq - 0 6',
    solution: ['d1a4', 'b8c6', 'a4e4'],
    difficulty: 'Intermédiaire',
    theme: 'Fourchette',
    playerColor: 'w',
    rating: 1472,
  },
  {
    id: 'u7Cp7',
    lichessId: 'u7Cp7',
    title: 'Coup Décisif',
    description: 'Les Blancs jouent et gagnent du matériel décisivement.',
    fen: 'rn2k2r/ppp1ppb1/7p/3pN1p1/3P4/qP2P1P1/P1PNQPP1/R3K2R w KQkq - 1 13',
    solution: ['e2b5', 'c7c6', 'b5b7'],
    difficulty: 'Intermédiaire',
    theme: 'Attaque décisive',
    playerColor: 'w',
    rating: 1480,
  },
  {
    id: 'tewjc',
    lichessId: 'tewjc',
    title: 'Attaque à la Découverte',
    description: 'Les Noirs jouent et gagnent du matériel grâce à une attaque à la découverte.',
    fen: 'r5k1/Rp3p1p/2b2qp1/3pr3/8/4P2P/2PN1PP1/Q3K2R b K - 0 19',
    solution: ['e5e3', 'f2e3', 'f6a1', 'a7a1', 'a8a1'],
    difficulty: 'Intermédiaire',
    theme: 'Attaque découverte',
    playerColor: 'b',
    rating: 1493,
  },
  {
    id: 'CAYyS',
    lichessId: 'CAYyS',
    title: 'Mat de Finale',
    description: 'Les Blancs jouent et font mat en 2 coups.',
    fen: '3r4/2p1pp1p/pp6/1kp1N3/4bP2/1PK3P1/P1P4P/8 w - - 3 25',
    solution: ['a2a4', 'b5a5', 'e5c4'],
    difficulty: 'Intermédiaire',
    theme: 'Mat en 2',
    playerColor: 'w',
    rating: 1515,
  },
  {
    id: 'CIamA',
    lichessId: 'CIamA',
    title: 'Fourchette Longue',
    description: 'Les Blancs jouent et gagnent du matériel avec une série de coups précis.',
    fen: 'rnbqk2r/ppp2ppp/5n2/4p3/1b6/2N1P1P1/PP1P1PBP/R1BQK1NR w KQkq - 1 7',
    solution: ['d1a4', 'b8c6', 'g2c6', 'b7c6', 'a4b4'],
    difficulty: 'Avancé',
    theme: 'Fourchette',
    playerColor: 'w',
    rating: 1523,
  },
  {
    id: 'Soy9h',
    lichessId: 'Soy9h',
    title: 'Attaque Découverte Longue',
    description: 'Les Blancs jouent et gagnent du matériel avec une attaque à la découverte.',
    fen: 'r3k3/pp2npp1/3p4/3q4/1P6/PQ2P3/1B1K1p2/2R2B1r w q - 0 27',
    solution: ['b3d5', 'e7d5', 'f1b5', 'e8e7', 'c1h1'],
    difficulty: 'Avancé',
    theme: 'Attaque découverte',
    playerColor: 'w',
    rating: 1582,
  },
  {
    id: '0kDWS',
    lichessId: '0kDWS',
    title: 'Clouage Décisif',
    description: 'Les Blancs jouent et gagnent grâce à un clouage en finale.',
    fen: '1r6/1PN5/3p4/3nkpp1/1R6/P7/K1P5/8 w - - 1 50',
    solution: ['b4b5', 'b8b7', 'b5b7'],
    difficulty: 'Avancé',
    theme: 'Clouage',
    playerColor: 'w',
    rating: 1947,
  },
];
