"use client";

import { useEffect, useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Button from "@mui/material/Button";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import { type MatchupVote } from "@/types/matchup";
import { getRecentMatchups } from "@/app/actions/celebrities";
import { COLORS, GRADIENTS } from "@/lib/theme";
import { MatchupsDesktopTable } from "@/app/components/MatchupsDesktopTable";
import { MatchupsMobileCards } from "@/app/components/MatchupsMobileCards";

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
          <Box sx={{ display: { xs: "none", sm: "block" } }}>
            <MatchupsDesktopTable
              matchups={paginatedMatchups}
              formatDate={formatDate}
              formatEloChange={formatEloChange}
            />
          </Box>

          {/* Mobile Cards */}
          <Box sx={{ display: { xs: "block", sm: "none" } }}>
            <MatchupsMobileCards
              matchups={paginatedMatchups}
              formatDate={formatDate}
              formatEloChange={formatEloChange}
            />
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
