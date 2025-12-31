"use client";

import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Chip from "@mui/material/Chip";
import Tooltip from "@mui/material/Tooltip";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { type MatchupVote } from "@/types/matchup";
import { getRecentMatchups } from "@/app/actions/celebrities";
import { COLORS, GRADIENTS } from "@/lib/theme";

const PAGE_SIZE = 20;

export default function MatchupsPage() {
  const [matchups, setMatchups] = useState<MatchupVote[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetchMatchups = async () => {
      try {
        setLoading(true);
        const data = await getRecentMatchups();
        setMatchups(data);
        setPage(0);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load matchups");
      } finally {
        setLoading(false);
      }
    };

    fetchMatchups();
  }, []);

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatEloChange = (before: number, after: number) => {
    const change = after - before;
    const sign = change > 0 ? "+" : "";
    return `${sign}${change.toFixed(1)}`;
  };

  const startIdx = page * PAGE_SIZE;
  const endIdx = startIdx + PAGE_SIZE;
  const paginatedMatchups = matchups.slice(startIdx, endIdx);
  const hasNextPage = endIdx < matchups.length;

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4, display: "flex", justifyContent: "center" }}>
        <CircularProgress sx={{ color: COLORS.primary.main }} />
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Alert severity="error">{error}</Alert>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography 
          variant="h4" 
          component="h1" 
          sx={{ fontWeight: 700, mb: 1, color: "white" }}
        >
          Recent Matchups
        </Typography>
        <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
          <Typography variant="body2" sx={{ color: COLORS.text?.muted || "#999" }}>
            Latest voting results with ELO rating changes
          </Typography>
          <Typography variant="caption" sx={{ color: COLORS.text?.muted || "#666" }}>
            💾 Results are cached and refreshed every 5 minutes
          </Typography>
        </Box>
      </Box>

      {matchups.length === 0 ? (
        <Box
          sx={{
            p: 3,
            borderRadius: 2,
            background: GRADIENTS.card,
            border: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
            textAlign: "center",
          }}
        >
          <Typography color="textSecondary">No matchups found yet</Typography>
        </Box>
      ) : (
        <>
          {/* Desktop Table */}
          <Box sx={{ display: { xs: "none", md: "block" } }}>
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
                  Winner ELO
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
                  Loser ELO
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
              {paginatedMatchups.map((matchup, idx) => {
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
                      borderTop: idx > 0 ? `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.05)"}` : "none",
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
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: "grid", md: "none" }, gap: 2, gridTemplateColumns: "1fr" }}>
            {paginatedMatchups.map((matchup) => {
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

          {/* Pagination Controls */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              gap: 2,
              mt: 3,
              p: 2,
              borderRadius: 2,
              border: `1px solid ${COLORS.border?.light || "rgba(255,255,255,0.1)"}`,
              background: GRADIENTS.card,
            }}
          >
            <Button
              variant="outlined"
              onClick={() => setPage(page - 1)}
              disabled={page === 0}
              startIcon={<ChevronLeftIcon />}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                borderColor: COLORS.border?.light || "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": {
                  borderColor: COLORS.primary?.main,
                  backgroundColor: "rgba(29, 182, 168, 0.1)",
                },
                "&:disabled": {
                  borderColor: "rgba(255,255,255,0.1)",
                  color: COLORS.text?.muted || "#666",
                },
              }}
            >
              Previous
            </Button>

            <Typography sx={{ color: COLORS.text?.muted || "#999", fontSize: "0.9rem" }}>
              Page {page + 1} of {Math.ceil(matchups.length / PAGE_SIZE)}
            </Typography>

            <Button
              variant="outlined"
              onClick={() => setPage(page + 1)}
              disabled={!hasNextPage}
              endIcon={<ChevronRightIcon />}
              sx={{
                borderRadius: 1,
                textTransform: "none",
                borderColor: COLORS.border?.light || "rgba(255,255,255,0.2)",
                color: "white",
                "&:hover": {
                  borderColor: COLORS.primary?.main,
                  backgroundColor: "rgba(29, 182, 168, 0.1)",
                },
                "&:disabled": {
                  borderColor: "rgba(255,255,255,0.1)",
                  color: COLORS.text?.muted || "#666",
                },
              }}
            >
              Next
            </Button>
          </Box>
        </>
      )}
    </Container>
  );
}
