export function WinRateBar({ winRate }: { winRate: number }) {
  const tone =
    winRate >= 55 ? 'text-win' : winRate < 45 ? 'text-loss' : 'text-ink';
  const barColor =
    winRate >= 55
      ? 'from-win/70 to-win'
      : winRate < 45
      ? 'from-loss/70 to-loss'
      : 'from-ice/60 to-ice';

  return (
    <div className="flex items-center gap-2">
      <div className="h-1.5 w-20 overflow-hidden rounded-full bg-void/70">
        <div
          className={`h-full rounded-full bg-gradient-to-r ${barColor} transition-[width] duration-500`}
          style={{ width: `${Math.max(0, Math.min(100, winRate))}%` }}
        />
      </div>
      <span className={`w-9 text-right font-mono text-sm font-semibold tabular ${tone}`}>
        {winRate}%
      </span>
    </div>
  );
}
