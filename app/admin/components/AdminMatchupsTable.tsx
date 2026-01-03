"use client";

import { Box, Button, Typography, CircularProgress } from "@mui/material";
import { MatchupVote } from "@/types/matchup";
import { COLORS } from "@/lib/theme";
import { useState } from "react";

interface AdminMatchupsTableProps {
  matchups: MatchupVote[];
  onTweet: (matchup: MatchupVote) => Promise<void>;
}

export default function AdminMatchupsTable({ matchups, onTweet }: AdminMatchupsTableProps) {
  const [tweetingId, setTweetingId] = useState<string | null>(null);

  const handleTweet = async (matchup: MatchupVote) => {
    setTweetingId(matchup.id);
    try {
      await onTweet(matchup);
    } finally {
      setTweetingId(null);
    }
  };
  return (
    <Box>
      <Typography variant="h6" sx={{ mb: 2, fontWeight: 600 }}>
        Recent Matchups
      </Typography>
      <Box
        sx={{
          borderRadius: 1,
          border: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
          overflow: "hidden",
        }}
      >
        {/* Table Header */}
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "150px 1fr 1fr 150px",
            gap: 0,
            p: 2,
            borderBottom: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
            backgroundColor: "rgba(0,0,0,0.2)",
          }}
        >
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
            Time
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
            Winner
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
            Loser
          </Typography>
          <Typography variant="caption" sx={{ fontWeight: 600, textTransform: "uppercase", fontSize: "0.75rem" }}>
            Actions
          </Typography>
        </Box>

        {/* Table Rows */}
        {matchups.length === 0 ? (
          <Box sx={{ p: 2, textAlign: "center" }}>
            <Typography variant="body2" sx={{ color: COLORS.text?.muted || "#999" }}>
              No matchups found
            </Typography>
          </Box>
        ) : (
          matchups.map((matchup, idx) => {
            const isWinnerA = matchup.winner === "A";
            const winner = isWinnerA ? matchup.celebAName : matchup.celebBName;
            const loser = isWinnerA ? matchup.celebBName : matchup.celebAName;

            return (
              <Box
                key={matchup.id}
                sx={{
                  display: "grid",
                  gridTemplateColumns: "150px 1fr 1fr 150px",
                  gap: 0,
                  p: 2,
                  borderTop: idx > 0 ? `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.05)"}` : "none",
                  alignItems: "center",
                }}
              >
                <Typography variant="body2" sx={{ color: COLORS.text?.muted || "#999", fontSize: "0.85rem" }}>
                  {new Date(matchup.timestamp).toLocaleString()}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: COLORS.primary?.main || "#1DB6A8" }}>
                  {winner}
                </Typography>
                <Typography sx={{ fontWeight: 500, color: COLORS.accent?.light || "#F5647D" }}>
                  {loser}
                </Typography>
                <Button
                  size="small"
                  variant="outlined"
                  onClick={() => handleTweet(matchup)}
                  disabled={tweetingId === matchup.id}
                  sx={{
                    fontSize: "0.75rem",
                    textTransform: "none",
                    borderColor: COLORS.primary?.main || "#1DB6A8",
                    color: COLORS.primary?.main || "#1DB6A8",
                    "&:hover": {
                      backgroundColor: "rgba(29, 182, 168, 0.1)",
                    },
                  }}
                >
                  {tweetingId === matchup.id ? <CircularProgress size={16} sx={{ mr: 1 }} /> : "Tweet Poll"}
                </Button>
              </Box>
            );
          })
        )}
      </Box>
    </Box>
  );
}
