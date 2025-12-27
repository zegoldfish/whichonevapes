
"use client";

import { useState } from "react";
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
  IconButton,
  Tooltip,
  CircularProgress,
  Chip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { COLORS } from "@/lib/theme";
import { approveCelebrity, rejectCelebrity } from "@/app/actions/celebrities";

interface Celebrity {
  id: string;
  name: string;
  slug?: string;
  wikipediaPageId?: string;
  createdAt: string;
  updatedAt: string;
}

interface AdminCelebritiesTableProps {
  celebrities: Celebrity[];
  onUpdate: () => void;
}

export default function AdminCelebritiesTable({ celebrities, onUpdate }: AdminCelebritiesTableProps) {
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleApprove = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const result = await approveCelebrity({ celebrityId: id });
      if (result.success) {
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to approve celebrity");
    } finally {
      setLoading(null);
    }
  };

  const handleReject = async (id: string) => {
    setLoading(id);
    setError(null);
    try {
      const result = await rejectCelebrity({ celebrityId: id });
      if (result.success) {
        onUpdate();
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reject celebrity");
    } finally {
      setLoading(null);
    }
  };

  if (celebrities.length === 0) {
    return (
      <Box sx={{ textAlign: "center", py: 4 }}>
        <Typography variant="body1" sx={{ color: COLORS.text.muted }}>
          No pending celebrity suggestions
        </Typography>
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h6" sx={{ color: COLORS.text.primary, fontWeight: 700, mb: 2 }}>
        Pending Celebrity Suggestions
      </Typography>

      {error && (
        <Chip
          label={error}
          color="error"
          onDelete={() => setError(null)}
          sx={{ mb: 2 }}
        />
      )}

      <Paper
        elevation={0}
        sx={{
          border: `1px solid ${COLORS.border.light}`,
          backgroundColor: "rgba(255,255,255,0.02)",
          borderRadius: 2,
        }}
      >
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell sx={{ color: COLORS.text.secondary, fontWeight: 600 }}>Name</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary, fontWeight: 600 }}>Wikipedia ID</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary, fontWeight: 600 }}>Submitted</TableCell>
                <TableCell sx={{ color: COLORS.text.secondary, fontWeight: 600 }} align="right">Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {celebrities.map((celeb) => (
                <TableRow
                  key={celeb.id}
                  hover
                  sx={{
                    "&:hover": {
                      backgroundColor: "rgba(255,255,255,0.03)",
                    },
                  }}
                >
                  <TableCell sx={{ color: COLORS.text.primary, fontWeight: 600 }}>
                    {celeb.name}
                  </TableCell>
                  <TableCell sx={{ color: COLORS.text.primary }}>
                    {celeb.wikipediaPageId || <span style={{ color: COLORS.text.muted }}>—</span>}
                  </TableCell>
                  <TableCell sx={{ color: COLORS.text.primary }}>
                    {new Date(celeb.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell align="right">
                    {loading === celeb.id ? (
                      <CircularProgress size={24} sx={{ color: COLORS.primary.main }} />
                    ) : (
                      <Box sx={{ display: "flex", gap: 1, justifyContent: "flex-end" }}>
                        <Tooltip title="Approve">
                          <IconButton
                            onClick={() => handleApprove(celeb.id)}
                            sx={{
                              color: COLORS.primary.main,
                              "&:hover": {
                                backgroundColor: "rgba(29, 182, 168, 0.1)",
                              },
                            }}
                          >
                            <CheckCircleIcon />
                          </IconButton>
                        </Tooltip>
                        <Tooltip title="Reject">
                          <IconButton
                            onClick={() => handleReject(celeb.id)}
                            sx={{
                              color: COLORS.accent.main,
                              "&:hover": {
                                backgroundColor: "rgba(239, 71, 111, 0.1)",
                              },
                            }}
                          >
                            <CancelIcon />
                          </IconButton>
                        </Tooltip>
                      </Box>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Box>
  );
}
