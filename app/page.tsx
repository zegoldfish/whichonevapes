"use client";

import { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
import Typography from "@mui/material/Typography";
import { EnrichedGameCard } from "./components/EnrichedGameCard";
import { type Celebrity } from "@/types/celebrity";
import { voteBetweenCelebrities, getRandomCelebrityPair } from "./actions/celebrities";

export default function Home() {
  const [pair, setPair] = useState<{ a: Celebrity; b: Celebrity } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [voting, setVoting] = useState(false);

  // Fetch random pair
  const fetchPair = async () => {
    setLoading(true);
    setError(null);
    try {
      const pair = await getRandomCelebrityPair();
      setPair(pair);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load celebrity pair"
      );
      setPair(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPair();
  }, []);

  const handleVote = async (winner: "A" | "B") => {
    if (!pair) return;
    setVoting(true);
    try {
      await voteBetweenCelebrities({
        celebAId: pair.a.id,
        celebBId: pair.b.id,
        winner,
      });
      // Fetch next pair
      await fetchPair();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record vote");
    } finally {
      setVoting(false);
    }
  };

  return (
    <Container maxWidth="lg">
      <Box sx={{ py: 6 }}>
        <Box
          sx={{
            textAlign: "center",
            mb: 6,
            animation: "fadeIn 0.8s ease-out",
            "@keyframes fadeIn": {
              from: { opacity: 0, transform: "translateY(-20px)" },
              to: { opacity: 1, transform: "translateY(0)" },
            },
          }}
        >
          <Typography
            variant="h2"
            sx={{
              fontWeight: 800,
              fontSize: { xs: "2.5rem", md: "3.5rem" },
              background: "linear-gradient(135deg, #7B2CBF 0%, #C71585 50%, #FF006E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              mb: 2,
              letterSpacing: "-0.02em",
              textShadow: "0 0 30px rgba(123, 44, 191, 0.5)",
            }}
          >
            Which One Vapes?
          </Typography>
          <Typography
            variant="h5"
            sx={{
              color: "rgba(248, 249, 250, 0.8)",
              fontWeight: 300,
              fontSize: { xs: "1rem", md: "1.25rem" },
              letterSpacing: "0.05em",
            }}
          >
            Decide which celebrity is more likely to vape
          </Typography>
        </Box>

        <Box sx={{ display: "flex", justifyContent: "center", gap: 2, mb: 4 }}>
          <Button
            variant="outlined"
            onClick={fetchPair}
            sx={{
              borderColor: "rgba(123, 44, 191, 0.5)",
              color: "var(--text)",
              borderRadius: 2,
              px: 3,
              py: 1.5,
              backdropFilter: "blur(10px)",
              background: "rgba(255, 255, 255, 0.03)",
              transition: "all 0.3s ease",
              "&:hover": {
                borderColor: "var(--primary)",
                background: "rgba(123, 44, 191, 0.1)",
                transform: "translateY(-2px)",
                boxShadow: "0 8px 20px rgba(123, 44, 191, 0.3)",
              },
            }}
          >
            New Pair
          </Button>
        </Box>

        {error && (
          <Alert severity="error" sx={{ mb: 4 }}>
            {error}
          </Alert>
        )}

        {loading ? (
          <Box sx={{ display: "flex", justifyContent: "center", py: 10 }}>
            <CircularProgress />
          </Box>
        ) : pair ? (
          <Grid
            container
            spacing={{ xs: 3, md: 6 }}
            justifyContent="center"
            alignItems="stretch"
            sx={{
              minHeight: "60vh",
              animation: "slideUp 0.6s ease-out",
              "@keyframes slideUp": {
                from: { opacity: 0, transform: "translateY(30px)" },
                to: { opacity: 1, transform: "translateY(0)" },
              },
            }}
          >
            <Grid size={{ xs: 12, md: 6 }}>
              <EnrichedGameCard
                key={pair.a.id}
                celebrity={pair.a}
                onVote={() => handleVote("A")}
                isVoting={voting}
                position="left"
              />
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
              <EnrichedGameCard
                key={pair.b.id}
                celebrity={pair.b}
                onVote={() => handleVote("B")}
                isVoting={voting}
                position="right"
              />
            </Grid>
          </Grid>
        ) : null}
      </Box>
    </Container>
  );
}
