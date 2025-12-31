"use client";

import { Box, Typography, Chip, Tooltip, IconButton } from "@mui/material";
import LocalFireDepartmentIcon from "@mui/icons-material/LocalFireDepartment";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import TodayIcon from "@mui/icons-material/Today";
import RestartAltIcon from "@mui/icons-material/RestartAlt";
import { COLORS } from "@/lib/theme";

interface VoteStreakDisplayProps {
  totalVotes: number;
  currentStreak: number;
  longestStreak: number;
  votesToday: number;
  onReset?: () => void;
}

export function VoteStreakDisplay({
  totalVotes,
  currentStreak,
  longestStreak,
  votesToday,
  onReset,
}: VoteStreakDisplayProps) {
  const getStreakColor = (streak: number): string => {
    if (streak >= 100) return "#EF476F";
    if (streak >= 50) return "#FF9F1C";
    if (streak >= 25) return "#FFD166";
    if (streak >= 10) return COLORS.primary.main;
    if (streak >= 5) return "#06D6A0";
    return "rgba(248, 249, 250, 0.65)";
  };

  const getStreakEmoji = (streak: number): string => {
    if (streak >= 100) return "🔥";
    if (streak >= 50) return "⚡";
    if (streak >= 25) return "✨";
    if (streak >= 10) return "🌟";
    if (streak >= 5) return "💫";
    return "🎯";
  };

  const formatNumber = (num: number): string => {
    if (num >= 1000) return `${(num / 1000).toFixed(1)}k`;
    return num.toString();
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: "row",
        flexWrap: "wrap",
        justifyContent: "center",
        alignItems: "center",
        gap: 1.5,
        px: 2,
        py: 1.5,
        background: "rgba(255,255,255,0.04)",
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        maxWidth: "fit-content",
        mx: "auto",
      }}
    >
      {/* Total Votes */}
      <Tooltip title="Total votes cast" arrow>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background: "rgba(29, 182, 168, 0.1)",
            border: "1px solid rgba(29, 182, 168, 0.2)",
          }}
        >
          <EmojiEventsIcon sx={{ fontSize: 20, color: COLORS.primary.main }} />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "rgba(248, 249, 250, 0.65)", display: "block", lineHeight: 1 }}
            >
              Total
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: COLORS.primary.main, fontWeight: 800, lineHeight: 1.2 }}
            >
              {formatNumber(totalVotes)}
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      {/* Current Streak */}
      <Tooltip
        title={
          currentStreak > 0
            ? `You've voted ${currentStreak} ${currentStreak === 1 ? "day" : "days"} in a row!`
            : "Vote today to start a streak!"
        }
        arrow
      >
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background:
              currentStreak > 0
                ? `${getStreakColor(currentStreak)}15`
                : "rgba(255,255,255,0.04)",
            border: `1px solid ${
              currentStreak > 0 ? `${getStreakColor(currentStreak)}30` : "rgba(255,255,255,0.08)"
            }`,
            animation: currentStreak >= 10 ? "pulse 2s ease-in-out infinite" : "none",
            "@keyframes pulse": {
              "0%, 100%": {
                boxShadow: `0 0 0 0 ${getStreakColor(currentStreak)}00`,
              },
              "50%": {
                boxShadow: `0 0 12px 4px ${getStreakColor(currentStreak)}40`,
              },
            },
          }}
        >
          <LocalFireDepartmentIcon
            sx={{ fontSize: 20, color: getStreakColor(currentStreak) }}
          />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "rgba(248, 249, 250, 0.65)", display: "block", lineHeight: 1 }}
            >
              Streak
            </Typography>
            <Typography
              variant="h6"
              sx={{
                color: getStreakColor(currentStreak),
                fontWeight: 800,
                lineHeight: 1.2,
                display: "flex",
                alignItems: "center",
                gap: 0.5,
              }}
            >
              {currentStreak}
              {currentStreak >= 5 && (
                <span style={{ fontSize: "0.85em" }}>{getStreakEmoji(currentStreak)}</span>
              )}
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      {/* Today's Votes */}
      <Tooltip title="Votes cast today" arrow>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 0.75,
            px: 1.5,
            py: 1,
            borderRadius: 2,
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
          }}
        >
          <TodayIcon sx={{ fontSize: 20, color: "rgba(248, 249, 250, 0.65)" }} />
          <Box>
            <Typography
              variant="caption"
              sx={{ color: "rgba(248, 249, 250, 0.65)", display: "block", lineHeight: 1 }}
            >
              Today
            </Typography>
            <Typography
              variant="h6"
              sx={{ color: "rgba(248, 249, 250, 0.85)", fontWeight: 800, lineHeight: 1.2 }}
            >
              {votesToday}
            </Typography>
          </Box>
        </Box>
      </Tooltip>

      {/* Longest Streak Badge */}
      {longestStreak > 0 && (
        <Chip
          label={`Best: ${longestStreak} 🏆`}
          size="small"
          sx={{
            fontWeight: 700,
            background: "rgba(255, 215, 0, 0.15)",
            color: "#FFD700",
            border: "1px solid rgba(255, 215, 0, 0.3)",
          }}
        />
      )}

      {/* Reset Button */}
      {onReset && totalVotes > 0 && (
        <Tooltip title="Reset all stats" arrow>
          <IconButton
            size="small"
            onClick={onReset}
            sx={{
              color: "rgba(248, 249, 250, 0.4)",
              "&:hover": {
                color: "rgba(239, 71, 111, 0.8)",
                background: "rgba(239, 71, 111, 0.1)",
              },
            }}
          >
            <RestartAltIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      )}
    </Box>
  );
}
