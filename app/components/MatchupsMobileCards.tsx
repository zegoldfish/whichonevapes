"use client";

import { Box, Typography, Chip, Tooltip } from "@mui/material";
import { type MatchupVote } from "@/types/matchup";
import { COLORS, GRADIENTS } from "@/lib/theme";

interface MatchupsMobileCardsProps {
  matchups: MatchupVote[];
  formatDate: (timestamp: string) => string;
  formatEloChange: (before: number, after: number) => string;
}

export function MatchupsMobileCards({
  matchups,
  formatDate,
  formatEloChange,
}: MatchupsMobileCardsProps) {
  return (
    <Box sx={{ display: "grid", gap: 2, gridTemplateColumns: "1fr" }}>
      {matchups.map((matchup) => {
        const isWinnerA = matchup.winner === "A";
        const winnerName = isWinnerA ? matchup.celebAName : matchup.celebBName;
        const loserName = isWinnerA ? matchup.celebBName : matchup.celebAName;
        const winnerEloBefore = isWinnerA ? matchup.celebAEloBefore : matchup.celebBEloBefore;
        const winnerEloAfter = isWinnerA ? matchup.celebAEloAfter : matchup.celebBEloAfter;
        const loserEloBefore = isWinnerA ? matchup.celebBEloBefore : matchup.celebAEloBefore;
        const loserEloAfter = isWinnerA ? matchup.celebBEloAfter : matchup.celebAEloAfter;
        const eloChangeWinner = winnerEloAfter - winnerEloBefore;
        const eloChangeLoser = loserEloAfter - loserEloBefore;

        return (
          <Box
            key={matchup.id}
            sx={{
              p: 2.5,
              borderRadius: 2,
              background: GRADIENTS.card,
              border: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
              display: "grid",
              gap: 2,
            }}
          >
            {/* Time */}
            <Box>
              <Typography
                variant="caption"
                sx={{
                  color: COLORS.text?.muted || "#999",
                  textTransform: "uppercase",
                  fontSize: "0.7rem",
                  letterSpacing: "0.05em",
                }}
              >
                Time
              </Typography>
              <Typography
                variant="body2"
                sx={{
                  color: "white",
                  fontWeight: 500,
                  mt: 0.5,
                }}
              >
                {formatDate(matchup.timestamp)}
              </Typography>
            </Box>

            {/* Winner vs Loser */}
            <Box sx={{ display: "grid", gap: 1.5 }}>
              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.primary?.main || "#1DB6A8",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  Winner
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 600,
                      color: COLORS.primary?.main || "#1DB6A8",
                      fontSize: "0.95rem",
                    }}
                  >
                    {winnerName}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text?.muted || "#999",
                        fontSize: "0.8rem",
                      }}
                    >
                      {winnerEloBefore.toFixed(0)}
                    </Typography>
                    <Chip
                      label={formatEloChange(winnerEloBefore, winnerEloAfter)}
                      size="small"
                      sx={{
                        height: 20,
                        backgroundColor:
                          eloChangeWinner >= 0
                            ? "rgba(15, 177, 122, 0.2)"
                            : "rgba(239, 71, 111, 0.2)",
                        color:
                          eloChangeWinner >= 0
                            ? COLORS.primary?.dark || "#0FB17A"
                            : COLORS.accent?.main || "#EF476F",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        border: `1px solid ${
                          eloChangeWinner >= 0
                            ? "rgba(15, 177, 122, 0.4)"
                            : "rgba(239, 71, 111, 0.4)"
                        }`,
                      }}
                    />
                  </Box>
                </Box>
              </Box>

              <Box>
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.accent?.light || "#F5647D",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    fontWeight: 600,
                  }}
                >
                  Loser
                </Typography>
                <Box sx={{ display: "flex", alignItems: "center", gap: 1, mt: 0.5 }}>
                  <Typography
                    sx={{
                      fontWeight: 500,
                      color: COLORS.accent?.light || "#F5647D",
                      fontSize: "0.95rem",
                    }}
                  >
                    {loserName}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text?.muted || "#999",
                        fontSize: "0.8rem",
                      }}
                    >
                      {loserEloBefore.toFixed(0)}
                    </Typography>
                    <Chip
                      label={formatEloChange(loserEloBefore, loserEloAfter)}
                      size="small"
                      sx={{
                        height: 20,
                        backgroundColor:
                          eloChangeLoser <= 0
                            ? "rgba(239, 71, 111, 0.2)"
                            : "rgba(15, 177, 122, 0.2)",
                        color:
                          eloChangeLoser <= 0
                            ? COLORS.accent?.main || "#EF476F"
                            : COLORS.primary?.dark || "#0FB17A",
                        fontWeight: 600,
                        fontSize: "0.7rem",
                        border: `1px solid ${
                          eloChangeLoser <= 0
                            ? "rgba(239, 71, 111, 0.4)"
                            : "rgba(15, 177, 122, 0.4)"
                        }`,
                      }}
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            {/* K-factor */}
            <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <Tooltip title="K-Factor: Controls how much ELO points change per match. Higher K means larger rating swings.">
                <Typography
                  variant="caption"
                  sx={{
                    color: COLORS.text?.muted || "#999",
                    textTransform: "uppercase",
                    fontSize: "0.7rem",
                    letterSpacing: "0.05em",
                    cursor: "help",
                  }}
                >
                  K-Factor
                </Typography>
              </Tooltip>
              <Typography
                sx={{
                  fontWeight: 600,
                  color: COLORS.text?.muted || "#999",
                  fontSize: "0.9rem",
                }}
              >
                {matchup.kFactor}
              </Typography>
            </Box>
          </Box>
        );
      })}
    </Box>
  );
}
