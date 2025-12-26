import { z } from "zod";

export const MatchupVoteSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  matchupKey: z.string().min(1),
  eventType: z.literal("vote"),
  
  // Celebrity info
  celebAId: z.string().uuid(),
  celebBId: z.string().uuid(),
  celebAName: z.string().min(1),
  celebBName: z.string().min(1),
  
  // Vote & Elo
  winner: z.enum(["A", "B"]),
  kFactor: z.number().int().min(1).max(64),
  
  // Before & after Elo
  celebAEloBefore: z.number(),
  celebBEloBefore: z.number(),
  celebAEloAfter: z.number(),
  celebBEloAfter: z.number(),
  
  // Analytics
  clientIp: z.string().min(1),
});

export type MatchupVote = z.infer<typeof MatchupVoteSchema>;

export const MatchupSkipSchema = z.object({
  id: z.string().uuid(),
  timestamp: z.string().datetime(),
  matchupKey: z.string().min(1),
  eventType: z.literal("skip"),
  
  // Celebrity info
  celebAId: z.string().uuid(),
  celebBId: z.string().uuid(),
  celebAName: z.string().min(1),
  celebBName: z.string().min(1),
  
  // Analytics
  clientIp: z.string().min(1),
});

export type MatchupSkip = z.infer<typeof MatchupSkipSchema>;

export const MatchupSchema = z.discriminatedUnion("eventType", [
  MatchupVoteSchema,
  MatchupSkipSchema,
]);

export type Matchup = z.infer<typeof MatchupSchema>;
