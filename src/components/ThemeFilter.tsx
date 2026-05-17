import { puzzles } from '../data/puzzles';

const ALL_THEMES = ['Tous', ...Array.from(new Set(puzzles.map((p) => p.theme))).sort()];

interface Props {
  active: string;
  onChange: (theme: string) => void;
}

export default function ThemeFilter({ active, onChange }: Props) {
  return (
    <div className="theme-filter">
      {ALL_THEMES.map((theme) => (
        <button
          key={theme}
          className={`theme-chip${active === theme ? ' active' : ''}`}
          onClick={() => onChange(theme)}
        >
          {theme}
        </button>
      ))}
    </div>
  );
}
