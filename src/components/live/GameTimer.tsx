'use client';

import { useEffect, useState } from 'react';
import { formatDuration } from '@/lib/helpers';

/**
 * Counts up from the spectator gameStartTime (epoch ms). During champ select /
 * loading the API reports gameStartTime = 0, so we fall back to gameLength.
 */
export function GameTimer({
  startTime,
  fallbackSeconds = 0,
}: {
  startTime?: number;
  fallbackSeconds?: number;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, []);

  const seconds =
    startTime && startTime > 0 ? Math.floor((now - startTime) / 1000) : fallbackSeconds;

  return (
    <span className="font-mono text-lg font-semibold tabular text-gold">
      {formatDuration(Math.max(0, seconds))}
    </span>
  );
}

export default GameTimer;
