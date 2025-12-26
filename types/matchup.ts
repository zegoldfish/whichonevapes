export interface MatchupVote {
  id: string; // UUID (partition key)
  timestamp: string; // ISO timestamp (sort key)
  matchupKey: string; // Normalized pair: sorted([celebAId, celebBId]).join('|')
  eventType: "vote";

  // Celebrity info
  celebAId: string;
  celebBId: string;
  celebAName: string; // Denormalized for easier reading
  celebBName: string;

  // Vote & Elo
  winner: "A" | "B";
  kFactor: number; // K value used

  // Before & after Elo
  celebAEloBefore: number;
  celebBEloBefore: number;
  celebAEloAfter: number;
  celebBEloAfter: number;

  // Analytics
  clientIp: string; // For user feedback/spam detection
}

export interface MatchupSkip {
  id: string; // UUID (partition key)
  timestamp: string; // ISO timestamp (sort key)
  matchupKey: string; // Normalized pair: sorted([celebAId, celebBId]).join('|')
  eventType: "skip";

  // Celebrity info
  celebAId: string;
  celebBId: string;
  celebAName: string; // Denormalized for easier reading
  celebBName: string;

  // Analytics
  clientIp: string; // For user feedback/spam detection
}

export type Matchup = MatchupVote | MatchupSkip;
