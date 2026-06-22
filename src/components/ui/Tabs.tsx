'use client';

export type TabOption = { key: string | number; label: string };

export function Tabs({
  options,
  value,
  onChange,
}: {
  options: TabOption[];
  value: string | number;
  onChange: (key: string | number) => void;
}) {
  return (
    <div className="flex gap-2 overflow-x-auto pb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
      {options.map((opt) => {
        const active = opt.key === value;
        return (
          <button
            key={opt.key}
            type="button"
            onClick={() => onChange(opt.key)}
            className={`shrink-0 rounded-lg border px-3 py-2 text-sm font-medium transition-colors duration-150
              ${
                active
                  ? 'border-gold/50 bg-gold/10 text-gold'
                  : 'border-steel/70 bg-midnight/50 text-muted hover:border-steel hover:text-ink'
              }`}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}
