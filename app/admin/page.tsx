"use client";

import { signOut, useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState, useCallback } from "react";
import {
  Box,
  Card,
  CardContent,
  Button,
  Typography,
  Container,
  CircularProgress,
  Chip,
  Alert,
} from "@mui/material";
import { GRADIENTS, COLORS } from "@/lib/theme";
import AdminCelebritiesTable from "@/app/admin/components/AdminCelebritiesTable";
import { getUnapprovedCelebritiesPage } from "@/app/actions/celebrities";
import { Celebrity } from "@/types/celebrity";

export const dynamic = "force-dynamic";

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [celebrities, setCelebrities] = useState<Pick<Celebrity, "id" | "name" | "slug" | "wikipediaPageId" | "createdAt" | "updatedAt">[]>([]);
  const [loadingCelebs, setLoadingCelebs] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadCelebrities = useCallback(async () => {
    setLoadingCelebs(true);
    setError(null);
    try {
      const result = await getUnapprovedCelebritiesPage({ pageSize: 50, cursor: null });
      setCelebrities(result.items);
    } catch (error) {
      console.error("Failed to load celebrities:", error);
      setError(error instanceof Error ? error.message : "Failed to load celebrities");
    } finally {
      setLoadingCelebs(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") {
      loadCelebrities();
    }
  }, [status, loadCelebrities]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/admin/login");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
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
    );
  }

  if (!session) {
    return null;
  }

  const githubUsername = session.user?.login || session.user?.name || session.user?.email;

  return (
    <Container maxWidth="md">
      <Box sx={{ py: 4 }}>
        <Card
          sx={{
            borderRadius: 4,
            background: GRADIENTS.card,
            border: "1px solid rgba(255,255,255,0.08)",
            boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
            mb: 3,
          }}
        >
          <CardContent sx={{ p: 4 }}>
            <Typography
              variant="h3"
              sx={{
                fontWeight: 800,
                mb: 2,
                color: "var(--text)",
              }}
            >
              Admin Dashboard
            </Typography>

            <Box sx={{ mb: 4 }}>
              <Typography
                variant="body1"
                sx={{
                  color: "rgba(248, 249, 250, 0.85)",
                  mb: 2,
                }}
              >
                Welcome, {githubUsername}
              </Typography>
              <Box sx={{ display: "flex", gap: 2, flexWrap: "wrap" }}>
                <Chip
                  label={`GitHub: @${githubUsername}`}
                  sx={{
                    background: "rgba(29, 182, 168, 0.15)",
                    color: "var(--text)",
                    fontWeight: 600,
                    border: "1px solid rgba(29,182,168,0.5)",
                  }}
                />
              </Box>
            </Box>

            <Box
              sx={{
                p: 3,
                borderRadius: 2,
                background: "rgba(255,255,255,0.03)",
                border: "1px solid rgba(255,255,255,0.06)",
                mb: 3,
              }}
            >
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {loadingCelebs ? (
                <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
                  <CircularProgress />
                </Box>
              ) : (
                <AdminCelebritiesTable 
                  celebrities={celebrities}
                  onUpdate={loadCelebrities}
                />
              )}
            </Box>

            <Button
              onClick={() => signOut({ redirect: true, callbackUrl: "/" })}
              sx={{
                mt: 2,
                py: 1,
                px: 3,
                fontWeight: 800,
                letterSpacing: "0.02em",
                borderRadius: 2.5,
                background: "rgba(239,71,111,0.2)",
                color: COLORS.accent.main,
                border: `1px solid ${COLORS.accent.main}66`,
                textTransform: "none",
                transition: "transform 0.15s ease, background 0.15s ease",
                "&:hover": {
                  background: "rgba(239,71,111,0.3)",
                  transform: "translateY(-2px)",
                },
              }}
            >
              Sign Out
            </Button>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
}
