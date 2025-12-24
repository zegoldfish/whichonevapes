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
        borderBottom: "1px solid rgba(255,255,255,0.12)",
        backdropFilter: "blur(6px)",
        backgroundColor: "rgba(0,0,0,0.35)",
      }}
    >
      <Toolbar sx={{ display: "flex", gap: 2 }}>
        <Typography
          component={Link}
          href="/"
          variant="h6"
          sx={{
            flexGrow: 1,
            color: "var(--text)",
            textDecoration: "none",
            fontWeight: 700,
            letterSpacing: 0.5,
          }}
        >
          Which One Vapes
        </Typography>

        <Stack direction="row" spacing={1} alignItems="center">
          <Button component={Link} href="/" variant="text" color="inherit">
            Play
          </Button>
          <Button component={Link} href="/rankings" variant="text" color="inherit">
            Rankings
          </Button>
        </Stack>
      </Toolbar>
    </AppBar>
  );
}
