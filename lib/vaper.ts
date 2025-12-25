export function getVaperLikelihood(yesVotes: number = 0, noVotes: number = 0) {
  const totalVotes = yesVotes + noVotes;
  const percentage = totalVotes > 0 ? (yesVotes / totalVotes) * 100 : 0;
  const isLikelyVaper = totalVotes >= 10 && percentage >= 60;

  return { isLikelyVaper, percentage, totalVotes };
}
