"use client";

import { useState, useEffect, Suspense } from "react";
import Container from "@mui/material/Container";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import Stack from "@mui/material/Stack";
import Snackbar from "@mui/material/Snackbar";
import { type Celebrity } from "@/types/celebrity";
import { voteBetweenCelebrities, getRandomCelebrityPair } from "./actions/celebrities";
import GameCardSkeleton from "./components/GameCardSkeleton";
import { VoteCard } from "./components/VoteCard";
import { COLORS } from "@/lib/theme";

function HomeContent() {
  const [pair, setPair] = useState<{ a: Celebrity; b: Celebrity } | null>(null);
  const [prefetchedPair, setPrefetchedPair] = useState<{ a: Celebrity; b: Celebrity } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);
  const [voteFeedback, setVoteFeedback] = useState<"A" | "B" | null>(null);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);
  const [lastLatencyMs, setLastLatencyMs] = useState<number | null>(null);
  const [lastVote, setLastVote] = useState<{
    winner: "A" | "B";
    winnerName: string;
  } | null>(null);

  const prefetchNextPair = async () => {
    try {
      const nextPair = await getRandomCelebrityPair();
      setPrefetchedPair(nextPair);
    } catch (err) {
      console.error("Failed to prefetch next pair:", err);
      setPrefetchedPair(null);
    }
  };

  // Fetch random pair (use prefetched if available)
  const fetchPair = async () => {
    const start = performance.now();
    setLoading(true);
    setError(null);
    try {
      // Use prefetched pair if available
      if (prefetchedPair) {
        setPair(prefetchedPair);
        setPrefetchedPair(null);
        // Start prefetching the next one
        prefetchNextPair();
      } else {
        const pair = await getRandomCelebrityPair();
        setPair(pair);
        // Start prefetching the next one
        prefetchNextPair();
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load celebrity pair"
      );
      setPair(null);
    } finally {
      setLastLatencyMs(Math.round(performance.now() - start));
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPair();
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handleKeyPress = (e: KeyboardEvent) => {
      if (!pair || voting || loading) return;
      
      if (e.key === "ArrowLeft") {
        e.preventDefault();
        handleVote("A");
      } else if (e.key === "ArrowRight") {
        e.preventDefault();
        handleVote("B");
      } else if (e.key === " ") {
        e.preventDefault();
        fetchPair();
      }
    };

    window.addEventListener("keydown", handleKeyPress);
    return () => window.removeEventListener("keydown", handleKeyPress);
  }, [pair, voting, loading]);

  const handleVote = async (winner: "A" | "B") => {
    if (!pair) return;
    setVoting(true);
    const voteContext = {
      winner,
      winnerName: winner === "A" ? pair.a.name : pair.b.name,
    };
    // Show quick feedback animation before swapping cards
    setVoteFeedback(winner);
    await new Promise((r) => setTimeout(r, 180));
    
    // Save vote request to run in background
    const votePromise = voteBetweenCelebrities({
      celebAId: pair.a.id,
      celebBId: pair.b.id,
      winner,
    });

    try {
      // If we have a prefetched pair, show it immediately
      if (prefetchedPair) {
        setPair(prefetchedPair);
        setPrefetchedPair(null);
        // Start prefetching the next one while vote is being recorded
        prefetchNextPair();
        // Wait for vote to complete in background
        await votePromise;
      } else {
        // No prefetched pair, wait for vote then fetch
        await votePromise;
        await fetchPair();
      }
      setLastVote(voteContext);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record vote");
      // On error, try to fetch a new pair
      await fetchPair();
    } finally {
      setVoting(false);
      setVoteFeedback(null);
    }
  };

  // Swipe gesture handlers
  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd || voting || !pair) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe) {
      handleVote("B"); // Swipe left votes for right card
    } else if (isRightSwipe) {
      handleVote("A"); // Swipe right votes for left card
    }
  };

  // Compute status indicator configuration based on current state
  const statusConfig = loading
    ? { color: COLORS.warning.main, text: "Fetching pair..." }
    : prefetchedPair
    ? { color: COLORS.primary.main, text: "Next pair cached" }
    : { color: COLORS.accent.main, text: "Prefetching next pair" };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 4, md: 6 }, display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ textAlign: "center", display: "grid", gap: 1 }}>
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2.5rem", md: "3.25rem" },
              background: "linear-gradient(135deg, #1DB6A8 0%, #EF476F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            Which One Vapes?
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(248, 249, 250, 0.78)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Pick the celebrity more likely to vape.
          </Typography>
          <Stack direction="row" justifyContent="center" spacing={2} sx={{ mt: 2 }}>
            <Button
              variant="outlined"
              onClick={fetchPair}
              sx={{
                px: 3,
                py: 1.25,
                borderRadius: 3,
                borderColor: "rgba(248,249,250,0.22)",
                color: "var(--text)",
                background: "rgba(255,255,255,0.04)",
                textTransform: "none",
                fontWeight: 700,
                letterSpacing: "0.01em",
                "&:hover": {
                  borderColor: "rgba(248,249,250,0.4)",
                  background: "rgba(255,255,255,0.08)",
                },
              }}
            >
              Skip / New Pair
            </Button>
          </Stack>
        </Box>

        <Box
          sx={{
            textAlign: "center",
            display: "flex",
            justifyContent: "center",
          }}
        >
          <Box
            sx={{
              px: 2.5,
              py: 0.75,
              borderRadius: 999,
              background: "rgba(255,255,255,0.06)",
              color: "rgba(248,249,250,0.75)",
              fontSize: "0.9rem",
              display: "flex",
              gap: 1,
              alignItems: "center",
              border: "1px solid rgba(255,255,255,0.08)",
            }}
          >
            <Typography component="span" sx={{ display: { xs: "none", md: "inline" } }}>
              Use ← → to vote, space to skip.
            </Typography>
            <Typography component="span" sx={{ display: { xs: "inline", md: "none" } }}>
              Swipe left or right to vote.
            </Typography>
          </Box>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 1 }}>
            {error}
          </Alert>
        )}

        <Box
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
          sx={{
            display: "grid",
            gap: { xs: 3, md: 4 },
            gridTemplateColumns: { xs: "1fr", md: "repeat(2, minmax(0, 1fr))" },
            alignItems: "stretch",
            justifyItems: "center",
            minHeight: "62vh",
            paddingBottom: 2,
          }}
        >
          {loading || !pair ? (
            <GameCardSkeleton position="left" />
          ) : (
            <VoteCard
              key={pair.a.id}
              celebrity={pair.a}
              onVote={() => handleVote("A")}
              isVoting={voting}
              position="left"
              voteState={
                voteFeedback === "A" ? "winner" : voteFeedback === "B" ? "loser" : null
              }
            />
          )}

          {loading || !pair ? (
            <GameCardSkeleton position="right" />
          ) : (
            <VoteCard
              key={pair.b.id}
              celebrity={pair.b}
              onVote={() => handleVote("B")}
              isVoting={voting}
              position="right"
              voteState={
                voteFeedback === "B" ? "winner" : voteFeedback === "A" ? "loser" : null
              }
            />
          )}
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center" }}>
          <Box
            sx={{
              px: 1.75,
              py: 0.6,
              borderRadius: 999,
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(255,255,255,0.08)",
              fontSize: "0.85rem",
              color: "rgba(248,249,250,0.75)",
              display: "flex",
              gap: 1,
              alignItems: "center",
            }}
          >
            <Box
              sx={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: statusConfig.color,
                boxShadow: prefetchedPair ? `0 0 12px ${COLORS.primary.main}99` : "none",
              }}
            />
            <Typography component="span">
              {statusConfig.text}
            </Typography>
            {lastLatencyMs !== null && !loading && (
              <Typography component="span" sx={{ color: "rgba(248,249,250,0.55)" }}>
                · {lastLatencyMs}ms
              </Typography>
            )}
          </Box>
        </Box>

        <Snackbar
          open={!!lastVote}
          autoHideDuration={3200}
          onClose={(_, reason) => {
            if (reason === "clickaway") return;
            setLastVote(null);
          }}
          anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
          message={lastVote ? `Voted for ${lastVote.winnerName}` : ""}
          sx={{
            "& .MuiSnackbarContent-root": {
              background: "rgba(12, 18, 32, 0.9)",
              color: "var(--text)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 12px 30px rgba(0,0,0,0.45)",
              borderRadius: 2,
              fontWeight: 700,
              letterSpacing: "0.01em",
            },
          }}
        />
      </Box>
    </Container>
  );
}

export default function Home() {
  return (
    <Suspense fallback={
      <Container maxWidth="lg">
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "100vh" }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <HomeContent />
    </Suspense>
  );
}
