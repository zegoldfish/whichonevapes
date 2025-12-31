import type { Metadata } from "next";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Grid from "@mui/material/Grid";
import Paper from "@mui/material/Paper";
import List from "@mui/material/List";
import ListItem from "@mui/material/ListItem";
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import { COLORS, GRADIENTS } from "@/lib/theme";

export const metadata: Metadata = {
  title: "About | Which One Vapes",
  description: "How the game works and how Elo rankings are calculated.",
};

export default function AboutPage() {
  return (
    <Container maxWidth="lg">
      <Box sx={{ py: { xs: 4, md: 6 }, display: "flex", flexDirection: "column", gap: 4 }}>
        {/* Header Section */}
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
            About This Game
          </Typography>
          <Typography
            variant="h6"
            sx={{
              color: "rgba(248, 249, 250, 0.78)",
              fontWeight: 500,
              letterSpacing: "0.01em",
            }}
          >
            Learn how rankings and voting work.
          </Typography>
        </Box>

        <Grid container spacing={{ xs: 3, md: 4 }}>
          {/* How the game works */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: "100%",
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 2.5,
                  color: COLORS.primary.main,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                🎮 How the game works
              </Typography>
              <List disablePadding sx={{ color: "rgba(248,249,250,0.85)" }}>
                <ListItem disableGutters sx={{ mb: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: COLORS.primary.main }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Two celebrities are shown at random"
                    primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                  />
                </ListItem>
                <ListItem disableGutters sx={{ mb: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: COLORS.primary.main }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Pick who you think is more likely to vape"
                    primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                  />
                </ListItem>
                <ListItem disableGutters sx={{ mb: 1.5 }}>
                  <ListItemIcon sx={{ minWidth: 32, color: COLORS.primary.main }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Your vote updates their rankings instantly"
                    primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                  />
                </ListItem>
                <ListItem disableGutters>
                  <ListItemIcon sx={{ minWidth: 32, color: COLORS.primary.main }}>
                    <CheckCircleIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText
                    primary="Get a fresh pair (we prefetch for speed)"
                    primaryTypographyProps={{ sx: { fontWeight: 500 } }}
                  />
                </ListItem>
              </List>
            </Paper>
          </Grid>

          {/* Elo Scoring */}
          <Grid size={{ xs: 12, md: 6 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                height: "100%",
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 2.5,
                  color: COLORS.accent.main,
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                📊 Elo Ranking System
              </Typography>
              <Typography
                paragraph
                sx={{
                  color: "rgba(248,249,250,0.85)",
                  mb: 2,
                  lineHeight: 1.6,
                }}
              >
                We use the classic Elo rating system to keep rankings fair. Every celebrity starts at the same baseline, and ratings adjust after each vote based on the expected outcome.
              </Typography>
              <Box
                sx={{
                  background: "rgba(29, 182, 168, 0.1)",
                  border: "1px solid rgba(29, 182, 168, 0.2)",
                  borderRadius: 2,
                  p: 2.5,
                  mb: 2.5,
                  color: "rgba(248,249,250,0.8)",
                }}
              >
                <Typography sx={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", mb: 1.5, color: "rgba(248,249,250,0.9)" }}>
                  <strong>Expected Score:</strong> E<sub>A</sub> = 1 / (1 + 10<sup>(B−A)/400</sup>)
                </Typography>
                <Typography sx={{ fontFamily: "Georgia, serif", fontSize: "1.1rem", color: "rgba(248,249,250,0.9)" }}>
                  <strong>Rating Update:</strong> new = current + K × (actual − expected)
                </Typography>
              </Box>
              <Typography
                sx={{
                  color: "rgba(248,249,250,0.75)",
                  fontSize: "0.95rem",
                  lineHeight: 1.6,
                }}
              >
                We use K=32. Upsets get bigger boosts, expected wins move ratings less. Over time this converges to true rankings.
              </Typography>
            </Paper>
          </Grid>

          {/* Tips Section */}
          <Grid size={{ xs: 12 }}>
            <Paper
              elevation={0}
              sx={{
                p: { xs: 3, md: 4 },
                borderRadius: 3,
                background: "rgba(255,255,255,0.04)",
                border: "1px solid rgba(255,255,255,0.08)",
                backdropFilter: "blur(10px)",
                transition: "all 0.3s ease",
                "&:hover": {
                  background: "rgba(255,255,255,0.06)",
                  borderColor: "rgba(255,255,255,0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              <Typography
                variant="h5"
                sx={{
                  fontWeight: 800,
                  mb: 2.5,
                  color: "#FFD700",
                  display: "flex",
                  alignItems: "center",
                  gap: 1,
                }}
              >
                ⚡ Tips for Faster Play
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography sx={{ color: "rgba(248, 249, 250, 0.65)", fontWeight: 700 }}>⌨️</Typography>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "rgba(248,249,250,0.9)",
                          mb: 0.5,
                        }}
                      >
                        Keyboard (Desktop)
                      </Typography>
                      <Typography sx={{ color: "rgba(248,249,250,0.75)", fontSize: "0.9rem" }}>
                        Use ← → arrow keys to vote, Space to skip
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography sx={{ color: "rgba(248, 249, 250, 0.65)", fontWeight: 700 }}>👆</Typography>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "rgba(248,249,250,0.9)",
                          mb: 0.5,
                        }}
                      >
                        Mobile Touch
                      </Typography>
                      <Typography sx={{ color: "rgba(248,249,250,0.75)", fontSize: "0.9rem" }}>
                        Swipe left/right to vote, long press to select
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <Box sx={{ display: "flex", gap: 1.5 }}>
                    <Typography sx={{ color: "rgba(248, 249, 250, 0.65)", fontWeight: 700 }}>📈</Typography>
                    <Box>
                      <Typography
                        sx={{
                          fontWeight: 600,
                          color: "rgba(248,249,250,0.9)",
                          mb: 0.5,
                        }}
                      >
                        Check Rankings
                      </Typography>
                      <Typography sx={{ color: "rgba(248,249,250,0.75)", fontSize: "0.9rem" }}>
                        Visit Rankings anytime to see shifts
                      </Typography>
                    </Box>
                  </Box>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
}
