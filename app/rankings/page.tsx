"use client";

import { Suspense, useEffect, useMemo, useRef, useState, useTransition } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  Alert,
  Box,
  Chip,
  CircularProgress,
  Container,
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
import ClimbersSection from "@/app/components/ClimbersSection";
import { getRankedCelebritiesPage, getTopClimbers } from "@/app/actions/celebrities";
import { getVaperLikelihood } from "@/lib/vaper";
import { eloPercentileFromRank, matchesPerDay, wilsonLowerBound, daysSince } from "@/lib/metrics";
import { COLORS, GRADIENTS } from "@/lib/theme";
import { type Celebrity } from "@/types/celebrity";
import { event as gaEvent } from "@/lib/gtag";

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

function RankingCard({ celeb, rank, totalCount }: { celeb: Celebrity; rank: number; totalCount: number }) {
  const { isLikelyVaper, percentage } = getVaperLikelihood(
    celeb.confirmedVaperYesVotes,
    celeb.confirmedVaperNoVotes
  );

  const winRate = useMemo(() => {
    if (!celeb.matches || celeb.matches === 0) return null;
    const pct = ((celeb.wins ?? 0) / celeb.matches) * 100;
    return `${pct.toFixed(1)}% win rate`;
  }, [celeb.matches, celeb.wins]);

  const winConfidence = useMemo(() => {
    if (!celeb.matches || celeb.matches === 0) return null;
    const lb = wilsonLowerBound(celeb.wins ?? 0, celeb.matches);
    return `${(lb * 100).toFixed(1)}% win confidence`;
  }, [celeb.matches, celeb.wins]);

  const vaperConfidence = useMemo(() => {
    const total = (celeb.confirmedVaperYesVotes ?? 0) + (celeb.confirmedVaperNoVotes ?? 0);
    if (total === 0) return null;
    const lb = wilsonLowerBound(celeb.confirmedVaperYesVotes ?? 0, total);
    return `${(lb * 100).toFixed(1)}% vaper confidence`;
  }, [celeb.confirmedVaperYesVotes, celeb.confirmedVaperNoVotes]);

  const lastActiveDays = daysSince(celeb.updatedAt);
  const matchRate = matchesPerDay(celeb.matches ?? 0, celeb.createdAt);
  const eloPct = useMemo(() => eloPercentileFromRank(rank, totalCount), [rank, totalCount]);

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
          gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))",
          gap: 1,
        }}
      >
        <StatPill label="Wins" value={celeb.wins ?? 0} />
        <StatPill label="Matches" value={celeb.matches ?? 0} />
        <StatPill label="Win rate" value={winRate ?? "N/A"} />
        {typeof eloPct === "number" && <StatPill label="Elo pct." value={`${eloPct.toFixed(1)}%`} />}
        {winConfidence && <StatPill label="Win conf." value={winConfidence} />}
        {typeof lastActiveDays === "number" && (
          <StatPill label="Last active" value={`${lastActiveDays}d ago`} />
        )}
        {typeof matchRate === "number" && (
          <StatPill label="Match rate" value={`${matchRate.toFixed(2)}/day`} />
        )}
        {vaperConfidence && <StatPill label="Vaper conf." value={vaperConfidence} />}
      </Box>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
          {celeb.confirmedVaperYesVotes ?? 0} 👍 / {celeb.confirmedVaperNoVotes ?? 0} 👎
        </Typography>
        <Link
          href={`/celeb/${celeb.id}`}
          onClick={() => gaEvent({ action: "rankings_profile_click", category: "rankings", label: `celebrityId:${celeb.id}|rank:${rank}` })}
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
  const [celebrities, setCelebrities] = useState<Array<Celebrity & { rank: number }>>([]);
  const [nextCursor, setNextCursor] = useState<string | undefined>();
  const [currentCursor, setCurrentCursor] = useState<string | undefined>(initialCursor || undefined);
  const [cursorStack, setCursorStack] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const hasLoadedRef = useRef(false);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [sortBy, setSortBy] = useState<string>("elo");
  const [climbers, setClimbers] = useState<Array<{ id: string; name: string; elo: number; eloGain: number; rank: number; wins: number; matches: number; confirmedVaper: boolean; confirmedVaperYesVotes: number; confirmedVaperNoVotes: number }> | null>(null);
  const [climbersLoading, setClimbersLoading] = useState(true);

  const page = cursorStack.length + 1;
  const isLoading = loading || isPending;
  const rankOffset = (page - 1) * PAGE_SIZE;

  // Load climbers on initial mount
  useEffect(() => {
    const loadClimbers = async () => {
      try {
        setClimbersLoading(true);
        const topClimbers = await getTopClimbers({ limit: 5, hoursBack: 24 });
        setClimbers(topClimbers);
      } catch (err) {
        console.error("Failed to load climbers:", err);
        setClimbers([]);
      } finally {
        setClimbersLoading(false);
      }
    };
    
    loadClimbers();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput.trim());
    }, 300);
    return () => clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    // Track search query changes (debounced value)
    if (hasLoadedRef.current) {
      gaEvent({ action: "rankings_search", category: "rankings", label: searchQuery || "" });
    }
  }, [searchQuery, gaEvent]);

  useEffect(() => {
    if (hasLoadedRef.current) {
      gaEvent({ action: "rankings_sort_change", category: "rankings", label: sortBy });
    }
  }, [sortBy, gaEvent]);

  const updateUrl = (cursor: string | null, search: string) => {
    const params = new URLSearchParams();
    if (cursor) params.set("cursor", cursor);
    if (search) params.set("q", search);
    const query = params.toString();
    router.replace(query ? `/rankings?${query}` : "/rankings", { scroll: false });
  };

  const loadPage = (cursor: string | null, stack: (string | null)[]) => {
    setLoading(true);
    setError(null);
    startTransition(async () => {
      try {
        const { items, nextCursor: newNextCursor, totalCount } = await getRankedCelebritiesPage({
          pageSize: PAGE_SIZE,
          cursor,
          search: searchQuery || null,
        });

        setCelebrities(items);
        setNextCursor(newNextCursor);
        setCursorStack(stack);
        setCurrentCursor(cursor || undefined);
        setTotalCount(totalCount || 0);
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
      // On initial load, ignore any initialCursor when there is a search query,
      // so searches always start from the first page.
      const initialLoadCursor = searchQuery ? null : initialCursor;
      loadPage(initialLoadCursor, []);
      return;
    }
    // When the search query changes after the initial load, reset to the first page.
    loadPage(null, []);
  }, [searchQuery]);

  const handleNext = () => {
    if (!nextCursor) return;
    const newStack = [...cursorStack, currentCursor ?? null];
    loadPage(nextCursor, newStack);
    gaEvent({ action: "rankings_pagination_next", category: "rankings", label: `page:${page + 1}` });
  };

  const handlePrev = () => {
    if (cursorStack.length === 0) return;
    const newStack = [...cursorStack];
    const prevCursor = newStack.pop() || null;
    loadPage(prevCursor, newStack);
    gaEvent({ action: "rankings_pagination_prev", category: "rankings", label: `page:${page - 1}` });
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
      </Box>

      <ClimbersSection climbers={climbers} isLoading={climbersLoading} />

      <Box
        sx={{
          mb: 3,
          display: "grid",
          gridTemplateColumns: { xs: "1fr", sm: "1fr auto" },
          gap: 2,
          alignItems: "center",
        }}
      >
        <TextField
          placeholder="Search celebrities"
          value={searchInput}
          onChange={(e) => setSearchInput(e.target.value)}
          variant="outlined"
          sx={{
            width: "100%",
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
        <TextField
          select
          label="Sort"
          size="small"
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          sx={{
            width: 220,
            justifySelf: { xs: "stretch", sm: "end" },
            "& .MuiOutlinedInput-root": {
              background: "rgba(255,255,255,0.04)",
              borderRadius: 3,
              color: "var(--text)",
              "& fieldset": { borderColor: "rgba(255,255,255,0.12)" },
              "&:hover fieldset": { borderColor: "rgba(255,255,255,0.4)" },
              "&.Mui-focused fieldset": { borderColor: COLORS.primary.light },
            },
            "& .MuiInputBase-input": { padding: "10px 12px" },
            "& .MuiInputLabel-root": { color: COLORS.text.muted },
            "& .MuiInputLabel-root.Mui-focused": { color: COLORS.primary.light },
          }}
          SelectProps={{ native: true }}
        >
          <option value="elo">Elo (desc)</option>
          <option value="winConfidence">Win confidence</option>
          <option value="matchRate">Match rate/day</option>
          <option value="recent">Recent activity</option>
        </TextField>

        {/** sort change tracking handled via useEffect above */}
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {isLoading && celebrities.length === 0 ? (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
            gap: 2.5,
          }}
        >
          {Array.from({ length: 8 }).map((_, idx) => (
            <Skeleton
              key={idx}
              variant="rectangular"
              height={180}
              sx={{
                borderRadius: 3,
                background: "rgba(255,255,255,0.05)",
              }}
            />
          ))}
        </Box>
      ) : celebrities.length === 0 ? (
        <Box sx={{ py: 10, textAlign: "center", color: COLORS.text.muted }}>
          <Typography variant="h6">No celebrities found</Typography>
          <Typography variant="body2">Try a different search or clear filters.</Typography>
        </Box>
      ) : (
        <>
          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: { xs: "1fr", sm: "repeat(2, 1fr)", md: "repeat(3, 1fr)" },
              gap: 2.5,
            }}
          >
            {([...celebrities]
              .sort((a, b) => {
                if (sortBy === "elo") {
                  return (b.elo ?? 1000) - (a.elo ?? 1000);
                }
                if (sortBy === "winConfidence") {
                  const wa = a.matches ? wilsonLowerBound(a.wins ?? 0, a.matches) : -1;
                  const wb = b.matches ? wilsonLowerBound(b.wins ?? 0, b.matches) : -1;
                  return wb - wa;
                }
                if (sortBy === "matchRate") {
                  const ma = matchesPerDay(a.matches ?? 0, a.createdAt) ?? -1;
                  const mb = matchesPerDay(b.matches ?? 0, b.createdAt) ?? -1;
                  return mb - ma;
                }
                if (sortBy === "recent") {
                  const da = daysSince(a.updatedAt) ?? Number.POSITIVE_INFINITY;
                  const db = daysSince(b.updatedAt) ?? Number.POSITIVE_INFINITY;
                  return da - db; // smaller is more recent
                }
                return 0;
              })
              .map((celeb) => (
                <RankingCard key={celeb.id} celeb={celeb} rank={celeb.rank} totalCount={totalCount} />
              )))}
          </Box>

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
  return (
    <Suspense fallback={
      <Container maxWidth="lg" sx={{ py: 6 }}>
        <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "50vh" }}>
          <CircularProgress />
        </Box>
      </Container>
    }>
      <RankingsContent />
    </Suspense>
  );
}
