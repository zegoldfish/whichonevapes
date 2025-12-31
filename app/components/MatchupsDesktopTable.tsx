"use client";

import { Box, Typography, Chip, Tooltip } from "@mui/material";
import { type MatchupVote } from "@/types/matchup";
import { COLORS, GRADIENTS } from "@/lib/theme";

interface MatchupsDesktopTableProps {
  matchups: MatchupVote[];
  formatDate: (timestamp: string) => string;
  formatEloChange: (before: number, after: number) => string;
}

export function MatchupsDesktopTable({
  matchups,
  formatDate,
  formatEloChange,
}: MatchupsDesktopTableProps) {
  return (
    <Box
      sx={{
        borderRadius: 2,
        background: GRADIENTS.card,
        border: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
        overflow: "hidden",
      }}
    >
      {/* Table Header */}
      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 80px",
          gap: 0,
          p: 2,
          borderBottom: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
          backgroundColor: "rgba(0,0,0,0.2)",
        }}
      >
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Time
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Winner
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Winner Elo
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Loser
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
          }}
        >
          Loser Elo
        </Typography>
        <Typography
          variant="caption"
          sx={{
            fontWeight: 600,
            color: COLORS.text?.muted || "#999",
            textTransform: "uppercase",
            fontSize: "0.75rem",
            letterSpacing: "0.05em",
            textAlign: "right",
          }}
        >
          <Tooltip title="K-Factor: Controls how much ELO points change per match. Higher K means larger rating swings.">
            <span>K</span>
          </Tooltip>
        </Typography>
      </Box>

      {/* Table Rows */}
      {matchups.map((matchup, idx) => {
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
              display: "grid",
              gridTemplateColumns: "120px 1fr 1fr 1fr 1fr 80px",
              gap: 0,
              p: 2,
              borderTop:
                idx > 0
                  ? `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.05)"}`
                  : "none",
              alignItems: "center",
              transition: "backgroundColor 0.2s ease",
              "&:hover": {
                backgroundColor: "rgba(255,255,255,0.02)",
              },
            }}
          >
            {/* Time */}
            <Typography
              variant="body2"
              sx={{
                color: COLORS.text?.muted || "#999",
                fontSize: "0.85rem",
              }}
            >
              {formatDate(matchup.timestamp)}
            </Typography>

            {/* Winner Name */}
            <Typography
              sx={{
                fontWeight: 600,
                color: COLORS.primary?.main || "#1DB6A8",
                fontSize: "0.95rem",
              }}
            >
              {winnerName}
            </Typography>

            {/* Winner ELO */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.text?.muted || "#999",
                  fontSize: "0.85rem",
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
                  fontSize: "0.75rem",
                  border: `1px solid ${
                    eloChangeWinner >= 0
                      ? "rgba(15, 177, 122, 0.4)"
                      : "rgba(239, 71, 111, 0.4)"
                  }`,
                }}
              />
            </Box>

            {/* Loser Name */}
            <Typography
              sx={{
                fontWeight: 500,
                color: COLORS.accent?.light || "#F5647D",
                fontSize: "0.95rem",
              }}
            >
              {loserName}
            </Typography>

            {/* Loser ELO */}
            <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
              <Typography
                variant="body2"
                sx={{
                  color: COLORS.text?.muted || "#999",
                  fontSize: "0.85rem",
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
                  fontSize: "0.75rem",
                  border: `1px solid ${
                    eloChangeLoser <= 0
                      ? "rgba(239, 71, 111, 0.4)"
                      : "rgba(15, 177, 122, 0.4)"
                  }`,
                }}
              />
            </Box>

            {/* K-factor */}
            <Typography
              variant="body2"
              sx={{
                color: COLORS.text?.muted || "#999",
                fontSize: "0.85rem",
                textAlign: "right",
              }}
            >
              {matchup.kFactor}
            </Typography>
          </Box>
        );
      })}
    </Box>
  );
}
