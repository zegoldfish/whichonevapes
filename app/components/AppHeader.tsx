"use client";

import Link from "next/link";
import { AppBar, Toolbar, Typography, Button, Stack } from "@mui/material";

export function AppHeader() {
  return (
    <AppBar
      position="static"
      color="transparent"
      elevation={0}
      sx={{
        borderBottom: "1px solid rgba(255,255,255,0.08)",
        backdropFilter: "blur(20px)",
        backgroundColor: "rgba(10, 17, 40, 0.7)",
        boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
      }}
    >
      <Toolbar sx={{ display: "flex", gap: 2, py: 1 }}>
        <Typography
          component={Link}
          href="/"
          variant="h6"
          sx={{
            flexGrow: 1,
            color: "var(--text)",
            textDecoration: "none",
            fontWeight: 800,
            letterSpacing: 0.5,
            fontSize: "1.25rem",
            background: "linear-gradient(135deg, #F8F9FA 0%, #7B2CBF 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            transition: "all 0.3s ease",
            "&:hover": {
              transform: "translateY(-2px)",
              filter: "brightness(1.2)",
            },
          }}
        >
          Which One Vapes
        </Typography>

        <Stack direction="row" spacing={2} alignItems="center">
          <Button
            component={Link}
            href="/"
            variant="text"
            sx={{
              color: "var(--text)",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
              py: 1,
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                background: "rgba(123, 44, 191, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Play
          </Button>
          <Button
            component={Link}
            href="/rankings"
            variant="text"
            sx={{
              color: "var(--text)",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
              py: 1,
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                background: "rgba(199, 21, 133, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            Rankings
          </Button>
          <Button
            component={Link}
            href="/about"
            variant="text"
            sx={{
              color: "var(--text)",
              fontWeight: 600,
              textTransform: "none",
              px: 2,
              py: 1,
              borderRadius: 2,
              transition: "all 0.3s ease",
              "&:hover": {
                background: "rgba(255, 0, 110, 0.15)",
                transform: "translateY(-2px)",
              },
            }}
          >
            About
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
