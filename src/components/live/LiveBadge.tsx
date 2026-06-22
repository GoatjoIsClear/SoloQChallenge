export function LiveBadge() {
  return (
    <span className="inline-flex items-center gap-2 rounded-md bg-[#ff1717] px-2 py-1 text-[11px] font-bold uppercase tracking-[0.2em] text-white shadow-[0_0_18px_rgba(255,23,23,.5)]">
      <span className="size-1.5 animate-pulse rounded-full bg-white" />
      Live
    </span>
  );
}

export default LiveBadge;
