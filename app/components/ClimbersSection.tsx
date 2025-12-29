"use client";

import { Box, Container, Typography, Skeleton, Card, Chip } from "@mui/material";
import TrendingUpIcon from "@mui/icons-material/TrendingUp";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import Link from "next/link";
import { COLORS, GRADIENTS } from "@/lib/theme";
import { event as gaEvent } from "@/lib/gtag";

interface Climber {
  id: string;
  name: string;
  elo: number;
  eloGain: number;
  rank: number;
  wins: number;
  matches: number;
  confirmedVaper: boolean;
  confirmedVaperYesVotes: number;
  confirmedVaperNoVotes: number;
}

interface ClimbersSectionProps {
  climbers: Climber[] | null;
  isLoading?: boolean;
}

export default function ClimbersSection({ climbers, isLoading = false }: ClimbersSectionProps) {
  if (isLoading) {
    return (
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h5"
          sx={{
            fontWeight: 800,
            fontSize: "1.5rem",
            letterSpacing: "-0.01em",
            mb: 2,
            display: "flex",
            alignItems: "center",
            gap: 1,
          }}
        >
          <TrendingUpIcon sx={{ color: COLORS.primary.light }} />
          Rising Stars
        </Typography>
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
            gap: 2,
          }}
        >
          {Array.from({ length: 5 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              height={120}
              sx={{
                borderRadius: 2,
                background: "rgba(255,255,255,0.05)",
              }}
            />
          ))}
        </Box>
      </Box>
    );
  }

  if (!climbers || climbers.length === 0) {
    return null;
  }

  return (
    <Box sx={{ mb: 4 }}>
      <Typography
        variant="h5"
        sx={{
          fontWeight: 800,
          fontSize: "1.5rem",
          letterSpacing: "-0.01em",
          mb: 2,
          display: "flex",
          alignItems: "center",
          gap: 1,
          color: "var(--text)",
        }}
      >
        <TrendingUpIcon sx={{ color: COLORS.primary.light }} />
        Rising Stars (Last 24h)
      </Typography>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(5, 1fr)" },
          gap: 2,
        }}
      >
        {climbers.map((climber, index) => {
          const winRate = climber.matches > 0 ? ((climber.wins / climber.matches) * 100).toFixed(0) : "0";

          return (
            <Link
              key={climber.id}
              href={`/celeb/${climber.id}`}
              onClick={() =>
                gaEvent({
                  action: "rankings_climber_click",
                  category: "rankings",
                  label: `celebrityId:${climber.id}|rank:${climber.rank}|eloGain:${climber.eloGain}`,
                })
              }
              style={{ textDecoration: "none" }}
            >
              <Card
                sx={{
                  p: 2,
                  height: "100%",
                  background: GRADIENTS.card,
                  border: `1px solid ${COLORS.border.light}`,
                  boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  display: "grid",
                  gridTemplateRows: "auto 1fr auto",
                  gap: 1.5,
                  "&:hover": {
                    transform: "translateY(-4px)",
                    borderColor: COLORS.primary.light,
                    boxShadow: `0 16px 40px rgba(29,182,168,0.25)`,
                  },
                }}
              >
                {/* Position and badges */}
                <Box
                  sx={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    gap: 1,
                    flexWrap: "wrap",
                  }}
                >
                  <Typography
                    variant="caption"
                    sx={{
                      fontWeight: 800,
                      color: COLORS.primary.light,
                      textTransform: "uppercase",
                      letterSpacing: "0.08em",
                    }}
                  >
                    #{climber.rank}
                  </Typography>
                  {climber.confirmedVaper && (
                    <Chip
                      icon={<CheckCircleIcon sx={{ color: "#0b0d14" }} />}
                      label="Vaper"
                      size="small"
                      sx={{
                        background: GRADIENTS.confirmedVaper,
                        color: "#0b0d14",
                        fontWeight: 800,
                        height: 24,
                      }}
                    />
                  )}
                  <Box
                    sx={{
                      display: "flex",
                      alignItems: "center",
                      gap: 0.5,
                      px: 1,
                      py: 0.5,
                      borderRadius: 1,
                      background: "rgba(29, 182, 168, 0.15)",
                      marginLeft: "auto",
                    }}
                  >
                    <TrendingUpIcon
                      sx={{
                        fontSize: 14,
                        color: COLORS.primary.light,
                      }}
                    />
                    <Typography
                      variant="caption"
                      sx={{
                        fontWeight: 800,
                        color: COLORS.primary.light,
                      }}
                    >
                      +{climber.eloGain.toFixed(0)}
                    </Typography>
                  </Box>
                </Box>

                {/* Name */}
                <Typography
                  sx={{
                    fontWeight: 800,
                    fontSize: "1.05rem",
                    color: "var(--text)",
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    display: "-webkit-box",
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: "vertical",
                  }}
                >
                  {climber.name}
                </Typography>

                {/* Stats grid */}
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: "1fr 1fr",
                    gap: 1,
                    fontSize: "0.8rem",
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 700,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      Elo
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text)",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {climber.elo.toFixed(0)}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 700,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      Win Rate
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text)",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {winRate}%
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 700,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      Wins
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text)",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {climber.wins}
                    </Typography>
                  </Box>

                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        color: COLORS.text.muted,
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        fontWeight: 700,
                        display: "block",
                        mb: 0.25,
                      }}
                    >
                      Matches
                    </Typography>
                    <Typography
                      sx={{
                        color: "var(--text)",
                        fontWeight: 800,
                        fontSize: "0.95rem",
                      }}
                    >
                      {climber.matches}
                    </Typography>
                  </Box>
                </Box>
              </Card>
            </Link>
          );
        })}
      </Box>
    </Box>
  );
}
