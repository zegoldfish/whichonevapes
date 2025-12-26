export function wilsonLowerBound(positive: number, total: number, z: number = 1.96): number {
  if (total <= 0) return 0;
  const pHat = positive / total;
  const z2 = z * z;
  const denom = 1 + z2 / total;
  const center = pHat + z2 / (2 * total);
  const margin = z * Math.sqrt((pHat * (1 - pHat) + z2 / (4 * total)) / total);
  const lower = (center - margin) / denom;
  return Math.max(0, Math.min(1, lower));
}

export function daysSince(dateIso?: string): number | null {
  if (!dateIso) return null;
  const then = new Date(dateIso).getTime();
  if (Number.isNaN(then)) return null;
  const now = Date.now();
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(0, Math.floor((now - then) / msPerDay));
}

export function matchesPerDay(matches: number = 0, createdAtIso?: string): number | null {
  if (!createdAtIso) return null;
  const days = daysSince(createdAtIso);
  if (days === null || days <= 0) return matches; // if very recent, just return matches
  return matches / days;
}

export function eloPercentileFromRank(rank: number, totalCount: number): number | null {
  if (!totalCount || totalCount <= 0 || !rank || rank <= 0) return null;
  const percentile = (1 - (rank - 1) / totalCount) * 100;
  return Math.max(0, Math.min(100, percentile));
}
