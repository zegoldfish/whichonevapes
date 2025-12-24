export type Winner = "A" | "B";

export function expectedScore(ratingA: number, ratingB: number): number {
  return 1 / (1 + Math.pow(10, (ratingB - ratingA) / 400));
}

export function updateElo(
  ratingA: number,
  ratingB: number,
  winner: Winner,
  k: number = 32
): { newA: number; newB: number } {
  const eA = expectedScore(ratingA, ratingB);
  const eB = expectedScore(ratingB, ratingA);
  const sA = winner === "A" ? 1 : 0;
  const sB = 1 - sA;

  const newA = Math.round(ratingA + k * (sA - eA));
  const newB = Math.round(ratingB + k * (sB - eB));

  return { newA, newB };
}

export function buildMatchDeltas(
  ratingA: number,
  ratingB: number,
  winner: Winner,
  k: number = 32
): {
  a: { newElo: number; winsDelta: number; matchesDelta: number };
  b: { newElo: number; winsDelta: number; matchesDelta: number };
} {
  const { newA, newB } = updateElo(ratingA, ratingB, winner, k);
  return {
    a: { newElo: newA, winsDelta: winner === "A" ? 1 : 0, matchesDelta: 1 },
    b: { newElo: newB, winsDelta: winner === "B" ? 1 : 0, matchesDelta: 1 },
  };
}
