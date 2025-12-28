"use client";

import { useState, useEffect } from "react";
import {
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  CircularProgress,
  TablePagination,
} from "@mui/material";
import { COLORS } from "@/lib/theme";
import { MatchupSkip } from "@/types/matchup";
import { getSkipEventsPage } from "@/app/actions/celebrities";

interface SkipEventsTableProps {
  onLoadingChange?: (loading: boolean) => void;
}

export default function SkipEventsTable({ onLoadingChange }: SkipEventsTableProps) {
  const [skipEvents, setSkipEvents] = useState<MatchupSkip[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadSkipEvents = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSkipEventsPage({ pageSize, pageNumber: page });
        setSkipEvents(result.items);
        setTotalCount(result.totalCount);
      } catch (err) {
        console.error("Failed to load skip events:", err);
        setError(err instanceof Error ? err.message : "Failed to load skip events");
      } finally {
        setLoading(false);
      }
    };
    loadSkipEvents();
  }, [page, pageSize]);

  useEffect(() => {
    onLoadingChange?.(loading);
  }, [loading, onLoadingChange]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  const formatDate = (timestamp: string): string => {
    return new Date(timestamp).toLocaleString();
  };

  if (loading && skipEvents.length === 0) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: COLORS.text.error || "#ff6b6b" }}>
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (skipEvents.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: COLORS.text.muted }}>
          No skip events found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: COLORS.text.primary, fontWeight: 700, mb: 2 }}>
        Skip Events
      </Typography>

      <TableContainer component={Paper} sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "rgba(255,255,255,0.05)" }}>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Timestamp</TableCell>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Celebrity A</TableCell>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Celebrity B</TableCell>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Client IP</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {skipEvents.map((event) => (
              <TableRow
                key={event.id}
                sx={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { background: "rgba(255,255,255,0.04)" },
                }}
              >
                <TableCell sx={{ color: COLORS.text.secondary, fontSize: "0.875rem" }}>
                  {formatDate(event.timestamp)}
                </TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>{event.celebAName}</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>{event.celebBName}</TableCell>
                <TableCell sx={{ color: COLORS.text.muted, fontSize: "0.875rem" }}>{event.clientIp}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        rowsPerPageOptions={[5, 10, 25, 50]}
        component="div"
        count={totalCount}
        rowsPerPage={pageSize}
        page={page}
        onPageChange={handleChangePage}
        onRowsPerPageChange={handleChangeRowsPerPage}
        sx={{
          color: COLORS.text.secondary,
          "& .MuiTablePagination-selectLabel, & .MuiTablePagination-displayedRows": {
            margin: 0,
          },
        }}
      />
    </Box>
  );
}
