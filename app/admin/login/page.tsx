"use client";

import { Suspense } from "react";
import { signIn } from "next-auth/react";
import { useSearchParams } from "next/navigation";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Alert,
  Container,
  CircularProgress,
} from "@mui/material";
import { GRADIENTS, COLORS } from "@/lib/theme";

function LoginForm() {
  const searchParams = useSearchParams();
  const error = searchParams.get("error");

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
          py: 4,
        }}
      >
        <Card
          sx={{
            width: "100%",
            borderRadius: 4,
            background: GRADIENTS.card,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h4"
              sx={{
                fontWeight: 800,
                mb: 1,
                color: "var(--text)",
                textAlign: "center",
              }}
            >
              Admin Access
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: "rgba(248, 249, 250, 0.65)",
                textAlign: "center",
                mb: 3,
              }}
            >
              Sign in with your GitHub account to access the admin panel
            </Typography>

            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}

            <Button
              fullWidth
              onClick={() => signIn("github", { callbackUrl: "/admin" })}
              sx={{
                py: 1.2,
                fontWeight: 800,
                letterSpacing: "0.02em",
                borderRadius: 2.5,
                background: "rgba(255, 255, 255, 0.08)",
                color: "var(--text)",
                border: "1px solid rgba(255, 255, 255, 0.2)",
                textTransform: "none",
                transition: "transform 0.15s ease, background 0.15s ease",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.12)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Sign in with GitHub
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}

export default function AdminLogin() {
  return (
    <Suspense fallback={
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    }>
      <LoginForm />
    </Suspense>
  );
}
