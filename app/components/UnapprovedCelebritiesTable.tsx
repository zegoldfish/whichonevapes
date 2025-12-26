"use client";

import { useEffect, useState } from "react";
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
  Pagination,
  Stack,
  CircularProgress,
} from "@mui/material";
import { COLORS } from "@/lib/theme";
import { getUnapprovedCelebritiesPage } from "../actions/celebrities";

interface RowItem {
  id: string;
  name: string;
  slug?: string;
  wikipediaPageId?: string;
  createdAt: string;
  updatedAt: string;
}

export default function UnapprovedCelebritiesTable() {
  const [items, setItems] = useState<RowItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [pageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [nextCursorMap, setNextCursorMap] = useState<Record<number, string | undefined>>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPage = async (pageNumber: number) => {
    setLoading(true);
    setError(null);
    try {
      const cursor = pageNumber === 1 ? null : String((pageNumber - 1) * pageSize);
      const res = await getUnapprovedCelebritiesPage({ pageSize, cursor });
      setItems(res.items);
      setTotalCount(res.totalCount);
      setNextCursorMap({ ...nextCursorMap, [pageNumber]: res.nextCursor });
      setPage(pageNumber);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load unapproved celebrities");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPage(1);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const pageCount = Math.max(1, Math.ceil(totalCount / pageSize));

  return (
    <Box>
      <Typography variant="h6" sx={{ color: COLORS.text.primary, fontWeight: 600, mb: 2 }}>
        Pending Suggestions
      </Typography>
      <Paper
        elevation={0}
        sx={{ border: `1px solid ${COLORS.border.light}`, backgroundColor: COLORS.background.dark }}
      >
        <TableContainer>
          <Table size="small" aria-label="Unapproved celebrities">
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: COLORS.text.secondary }}>Name</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>Wikipedia Page ID</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>Created</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary }}>Updated</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                      <CircularProgress size={20} sx={{ color: COLORS.primary.main }} />
                      <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                        Loading...
                      </Typography>
                    </Stack>
                  </TableCell>
                </TableRow>
              ) : items.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4}>
                    <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                      No pending suggestions.
                    </Typography>
                  </TableCell>
                </TableRow>
              ) : (
                items.map((item) => (
                  <TableRow key={item.id} hover>
                    <TableCell sx={{ color: COLORS.text.primary }}>{item.name}</TableCell>
                    <TableCell sx={{ color: COLORS.text.primary }}>{item.wikipediaPageId || "—"}</TableCell>
                    <TableCell sx={{ color: COLORS.text.primary }}>{new Date(item.createdAt).toLocaleString()}</TableCell>
                    <TableCell sx={{ color: COLORS.text.primary }}>{new Date(item.updatedAt).toLocaleString()}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      {error && (
        <Typography variant="body2" sx={{ color: COLORS.accent.main, mt: 1 }}>
          {error}
        </Typography>
      )}

      <Stack alignItems="center" sx={{ mt: 2 }}>
        <Pagination
          count={pageCount}
          page={page}
          onChange={(_, p) => loadPage(p)}
          sx={{
            "& .MuiPaginationItem-root": {
              color: COLORS.text.primary,
            },
            "& .MuiPaginationItem-root.Mui-selected": {
              backgroundColor: COLORS.primary.main,
              color: "#fff",
            },
          }}
        />
      </Stack>
    </Box>
  );
}
