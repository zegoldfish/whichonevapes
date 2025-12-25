import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import Divider from "@mui/material/Divider";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemText from "@mui/material/ListItemText";

export const metadata: Metadata = {
  title: "About | Which One Vapes",
  description: "How the game works and how Elo rankings are calculated.",
};

export default function AboutPage() {
  return (
    <Container maxWidth="md">
      <Box sx={{ py: { xs: 5, md: 8 }, display: "flex", flexDirection: "column", gap: 4 }}>
        <Box
          sx={{
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(123,44,191,0.15), rgba(255,0,110,0.08))",
            borderRadius: 4,
            p: { xs: 3, md: 4 },
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 10px 40px rgba(0,0,0,0.25)",
          }}
        >
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              mb: 2,
              background: "linear-gradient(135deg, #7B2CBF 0%, #FF006E 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            Which One Vapes
          </Typography>
        </Box>

        <Grid container spacing={3}>
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 2, color: "rgba(248,249,250,0.95)" }}
              >
                How the game works
              </Typography>
              <List dense sx={{ color: "rgba(248,249,250,0.9)" }}>
                <ListItem>
                  <ListItemText primary="Two celebrities are shown at random." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Pick the one you think is more likely to vape." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Your vote updates both of their rankings instantly." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="A fresh pair is fetched (we prefetch to keep it fast)." />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 2, color: "rgba(248,249,250,0.95)" }}
              >
                How Elo scoring works here
              </Typography>
              <Typography paragraph sx={{ color: "rgba(248,249,250,0.9)", mb: 2 }}>
                We use the classic Elo system to keep head-to-head results fair. Every celebrity starts at the same baseline rating. After each vote, we compare the winner&apos;s expected score against the loser&apos;s expected score and adjust both ratings.
              </Typography>
              <Typography paragraph sx={{ color: "rgba(248,249,250,0.9)", mb: 1.5 }}>
                Expected score (chance to win) for A is <strong>E_A = 1 / (1 + 10^((B - A) / 400))</strong>. The update step is <strong>new = current + K × (actual - expected)</strong>, where <strong>actual</strong> is 1 for the winner and 0 for the loser. We use a K-factor of 32 to make ratings responsive without being too volatile.
              </Typography>
              <Typography sx={{ color: "rgba(248,249,250,0.9)" }}>
                Upsets (a lower-rated celeb beating a higher-rated one) earn a larger boost, while expected wins move ratings only a little. Over time this converges to a ranking that reflects how often each celeb is picked to vape.
              </Typography>
            </Paper>
          </Grid>

          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 4,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.05)",
                backdropFilter: "blur(10px)",
              }}
            >
              <Typography
                variant="h5"
                sx={{ fontWeight: 700, mb: 2, color: "rgba(248,249,250,0.95)" }}
              >
                Tips for faster play
              </Typography>
              <List dense sx={{ color: "rgba(248,249,250,0.9)" }}>
                <ListItem>
                  <ListItemText primary="On desktop, use ← → arrow keys to vote and Space to load a new pair." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="On mobile, swipe left or right to vote." />
                </ListItem>
                <ListItem>
                  <ListItemText primary="Check the Rankings page anytime to see how the board is shifting." />
                </ListItem>
              </List>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
