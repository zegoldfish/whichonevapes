"use client";

import { useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
  Grid,
  InputAdornment,
  Skeleton,
  TextField,
  Typography,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import ArrowOutwardIcon from "@mui/icons-material/ArrowOutward";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import RankingsPagination from "@/app/components/RankingsPagination";
import { getRankedCelebritiesPage } from "@/app/actions/celebrities";
import { getVaperLikelihood } from "@/lib/vaper";
import { COLORS, GRADIENTS } from "@/lib/theme";
import { type Celebrity } from "@/types/celebrity";

const PAGE_SIZE = 24;

function StatPill({ label, value }: { label: string; value: string | number }) {
  return (
    <Box
      sx={{
        p: 1.25,
        borderRadius: 2,
        background: "rgba(255,255,255,0.04)",
        border: `1px solid ${COLORS.border.lighter}`,
      }}
    >
      <Typography
        variant="caption"
        sx={{ color: COLORS.text.muted, textTransform: "uppercase", letterSpacing: "0.08em" }}
      >
        {label}
      </Typography>
      <Typography variant="subtitle1" sx={{ fontWeight: 800, color: "var(--text)" }}>
        {value}
      </Typography>
    </Box>
  );
}

function RankingCard({ celeb, rank }: { celeb: Celebrity; rank: number }) {
  const { isLikelyVaper, percentage } = getVaperLikelihood(
    celeb.confirmedVaperYesVotes,
    celeb.confirmedVaperNoVotes
  );

  const winRate = useMemo(() => {
    if (!celeb.matches || celeb.matches === 0) return null;
    const pct = ((celeb.wins ?? 0) / celeb.matches) * 100;
    return `${pct.toFixed(1)}% win rate`;
  }, [celeb.matches, celeb.wins]);

  const medalColor = rank === 1 ? "#FFD166" : rank === 2 ? "#A0AEC0" : "#B2772B";

  return (
    <Box
      sx={{
        p: 2.5,
        display: "grid",
        gap: 1.5,
        borderRadius: 3,
        background: GRADIENTS.card,
        border: `1px solid ${COLORS.border.light}`,
        boxShadow: "0 12px 32px rgba(0,0,0,0.35)",
        minHeight: 200,
      }}
    >
      <Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 2 }}>
        <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
          <Box
            sx={{
              width: 46,
              height: 46,
              borderRadius: 2,
              display: "grid",
              placeItems: "center",
              background: "rgba(255,255,255,0.05)",
              border: `1px solid ${COLORS.border.lighter}`,
              fontWeight: 800,
              color: "var(--text)",
              position: "relative",
            }}
          >
            {rank <= 3 ? <EmojiEventsIcon sx={{ color: medalColor }} /> : rank}
          </Box>
          <Box>
            <Link
              href={`/celeb/${celeb.id}`}
              style={{
                color: "var(--text)",
                textDecoration: "none",
                fontWeight: 800,
                fontSize: "1.05rem",
                letterSpacing: "-0.01em",
              }}
            >
              {celeb.name}
            </Link>
            <Typography variant="caption" sx={{ color: COLORS.text.muted, display: "block" }}>
              Elo {(celeb.elo ?? 1000).toFixed(0)}
            </Typography>
          </Box>
        </Box>

        <Box sx={{ display: "flex", gap: 1, flexWrap: "wrap", justifyContent: "flex-end" }}>
          {celeb.confirmedVaper && (
            <Chip
              icon={<CheckCircleIcon sx={{ color: "#0b0d14" }} />}
              label="Confirmed"
              size="small"
              sx={{
                background: GRADIENTS.confirmedVaper,
                color: "#0b0d14",
                fontWeight: 800,
              }}
            />
          )}
          {!celeb.confirmedVaper && isLikelyVaper && (
            <Chip
              label={`Likely vaper · ${percentage.toFixed(0)}%`}
              size="small"
              sx={{
                background: "rgba(29, 182, 168, 0.15)",
                color: "var(--text)",
                border: `1px solid ${COLORS.primary.light}55`,
                fontWeight: 700,
              }}
            />
          )}
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))",
          gap: 1,
        }}
      >
        <StatPill label="Wins" value={celeb.wins ?? 0} />
        <StatPill label="Matches" value={celeb.matches ?? 0} />
        <StatPill label="Win rate" value={winRate ?? "N/A"} />
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
          {celeb.confirmedVaperYesVotes ?? 0} 👍 / {celeb.confirmedVaperNoVotes ?? 0} 👎
        </Typography>
        <Link
          href={`/celeb/${celeb.id}`}
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 6,
            color: "var(--text)",
            fontWeight: 700,
            textDecoration: "none",
          }}
        >
          View profile <ArrowOutwardIcon sx={{ fontSize: 18 }} />
        </Link>
      </Box>
    </Box>
  );
}

function RankingsContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSearch = searchParams.get("q") ?? "";
  const initialCursor = searchParams.get("cursor") ?? null;

  const [searchInput, setSearchInput] = useState(initialSearch);
  const [searchQuery, setSearchQuery] = useState(initialSearch);
  const [celebrities, setCelebrities] = useState<Celebrity[]>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(initialCursor || undefined);
  const [cursorStack, setCursorStack] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasLoadedRef = useRef(false);

  const page = cursorStack.length + 1;
  const isLoading = loading || isPending;
  const rankOffset = (page - 1) * PAGE_SIZE;

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const updateUrl = (cursor: string | null, search: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (search) params.set("q", search);
    const query = params.toString();
    router.replace(query ? `/rankings?${query}` : "/rankings", { scroll: false });
  };

  const loadPage = (cursor: string | null, stack: string[]) => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const { items, nextCursor: newNextCursor } = await getRankedCelebritiesPage({
          pageSize: PAGE_SIZE,
          cursor,
          search: searchQuery || null,
        });

        setCelebrities(items);
        setNextCursor(newNextCursor);
        setCursorStack(stack);
        setCurrentCursor(cursor || undefined);
        updateUrl(cursor, searchQuery);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to load rankings");
      } finally {
        setLoading(false);
      }
    });
  };

  useEffect(() => {
    if (!hasLoadedRef.current) {
      hasLoadedRef.current = true;
      loadPage(initialCursor, []);
      return;
    }
    loadPage(null, []);
  }, [searchQuery]);

  const handleNext = () => {
    if (!nextCursor) return;
    const newStack = [...cursorStack, currentCursor ?? ""];
    loadPage(nextCursor, newStack);
  };

  const handlePrev = () => {
    if (cursorStack.length === 0) return;
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop();
    loadPage(prevCursor && prevCursor.length > 0 ? prevCursor : null, newStack);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box
        sx={{
          mb: 5,
          p: 3,
          borderRadius: 3,
          textAlign: "center",
          background: "linear-gradient(135deg, rgba(29,182,168,0.12), rgba(239,71,111,0.12))",
          border: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        <Typography
          variant="h2"
          sx={{
            fontWeight: 800,
            fontSize: { xs: "2.2rem", md: "3rem" },
            background: "linear-gradient(135deg, #1DB6A8 0%, #EF476F 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          Elo Rankings
        </Typography>
        <Typography variant="h6" sx={{ color: COLORS.text.secondary, fontWeight: 500 }}>
          Browse ranked celebrities without downloading the whole list.
        </Typography>
      </Box>

      <Box sx={{ mb: 3, display: "flex", justifyContent: "center" }}>
        <TextField
          placeholder="Search celebrities"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          variant="outlined"
          sx={{
            width: { xs: "100%", sm: 420 },
            "& .MuiOutlinedInput-root": {
              background: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              color: "var(--text)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&.Mui-focused fieldset": { borderColor: COLORS.primary.light },
            },
            "& .MuiInputBase-input": { padding: "12px 14px" },
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: COLORS.text.muted }} />
              </InputAdornment>
            ),
          }}
        />
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && celebrities.length === 0 ? (
        <Grid container spacing={2.5}>
          {Array.from({ length: 8 }).map((_, idx) => (
            <Grid item xs={12} sm={6} md={4} key={idx}>
              <Skeleton
                variant="rectangular"
                height={180}
                sx={{
                  borderRadius: 3,
                  background: "rgba(255,255,255,0.05)",
                }}
              />
            </Grid>
          ))}
        </Grid>
      ) : celebrities.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center", color: COLORS.text.muted }}>
          <Typography variant="h6">No celebrities found</Typography>
          <Typography variant="body2">Try a different search or clear filters.</Typography>
        </Box>
      ) : (
        <>
          <Grid container spacing={2.5}>
            {celebrities.map((celeb, idx) => (
              <Grid item xs={12} sm={6} md={4} key={celeb.id}>
                <RankingCard celeb={celeb} rank={rankOffset + idx + 1} />
              </Grid>
            ))}
          </Grid>

          <RankingsPagination
            page={page}
            hasNext={Boolean(nextCursor)}
            hasPrev={cursorStack.length > 0}
            isLoading={isLoading}
            onNext={handleNext}
            onPrev={handlePrev}
          />
        </>
      )}

      {isLoading && celebrities.length > 0 && (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
          <CircularProgress size={28} />
        </Box>
      )}
    </Container>
  );
}

export default function RankingsPage() {
  return <RankingsContent />;
}
