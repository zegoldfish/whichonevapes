"use client";

import { useState, useEffect } from "react";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid";
import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import CircularProgress from "@mui/material/CircularProgress";
import Alert from "@mui/material/Alert";
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
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <h1>Which One Vapes</h1>
        <h2 style={{ color: "var(--secondary)", marginBottom: 2 }}>
          Decide which one is more likely to vape
        </h2>

        <Box sx={{ display: "flex", gap: 2, mb: 4 }}>
          <Button variant="outlined" onClick={fetchPair}>
            Load New Pair
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
            spacing={4}
            justifyContent="center"
            alignItems="stretch"
            sx={{ minHeight: "60vh" }}
          >
            <Grid size={{ xs: 12, sm: 6 }}>
              <EnrichedGameCard
                key={pair.a.id}
                celebrity={pair.a}
                onVote={() => handleVote("A")}
                isVoting={voting}
                position="left"
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
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
