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
import { getSkipStatsByCelebrity } from "@/app/actions/celebrities";

interface SkipStat {
  celebrityId: string;
  celebrityName: string;
  skipCount: number;
}

export default function CelebritySkipStatsTable() {
  const [stats, setStats] = useState<SkipStat[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState(0);
  const [pageSize, setPageSize] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);
      try {
        const result = await getSkipStatsByCelebrity({ pageSize, pageNumber: page });
        setStats(result.items);
        setTotalCount(result.totalCount);
      } catch (err) {
        console.error("Failed to load skip stats:", err);
        setError(err instanceof Error ? err.message : "Failed to load skip statistics");
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, [page, pageSize]);

  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPageSize(parseInt(event.target.value, 10));
    setPage(0);
  };

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: COLORS.text.error }}>
          Error: {error}
        </Typography>
      </Box>
    );
  }

  if (stats.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: COLORS.text.muted }}>
          No skip data found
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: COLORS.text.primary, fontWeight: 700, mb: 2 }}>
        Celebrity Skip Statistics
      </Typography>

      <TableContainer component={Paper} sx={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ background: "rgba(255,255,255,0.05)" }}>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Rank</TableCell>
              <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Celebrity Name</TableCell>
              <TableCell align="right" sx={{ color: COLORS.text.primary, fontWeight: 600 }}>Skip Count</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {stats.map((stat, index) => (
              <TableRow
                key={stat.celebrityId}
                sx={{
                  borderBottom: "1px solid rgba(255,255,255,0.08)",
                  "&:hover": { background: "rgba(255,255,255,0.04)" },
                }}
              >
                <TableCell sx={{ color: COLORS.text.secondary, fontWeight: 600, width: "80px" }}>
                  #{page * pageSize + index + 1}
                </TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>
                  {stat.celebrityName}
                </TableCell>
                <TableCell align="right" sx={{ color: COLORS.text.secondary, fontWeight: 600 }}>
                  {stat.skipCount}
                </TableCell>
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

      <Box sx={{ mt: 2, p: 2, background: "rgba(255,255,255,0.02)", borderRadius: 1 }}>
        <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
          Total celebrities skipped: {totalCount} | Total skips: {stats.reduce((sum, s) => sum + s.skipCount, 0)}
        </Typography>
      </Box>
    </Box>
  );
}
