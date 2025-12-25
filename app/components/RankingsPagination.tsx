"use client";

import { Box, Button, Typography } from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";

interface RankingsPaginationProps {
  page: number;
  hasNext: boolean;
  hasPrev: boolean;
  isLoading?: boolean;
  onNext: () => void;
  onPrev: () => void;
}

export default function RankingsPagination({
  page,
  hasNext,
  hasPrev,
  isLoading,
  onNext,
  onPrev,
}: RankingsPaginationProps) {
  return (
    <Box
      sx={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        gap: 2,
        mt: 4,
        p: 2,
        borderRadius: 3,
        border: "1px solid rgba(255,255,255,0.08)",
        background: "rgba(255,255,255,0.03)",
      }}
    >
      <Button
        variant="outlined"
        onClick={onPrev}
        disabled={!hasPrev || isLoading}
        startIcon={<ChevronLeftIcon />}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          color: "var(--text)",
          borderColor: "rgba(255,255,255,0.16)",
          "&:hover": {
            borderColor: "rgba(255,255,255,0.4)",
            background: "rgba(255,255,255,0.06)",
          },
        }}
      >
        Previous
      </Button>

      <Typography
        variant="body2"
        sx={{ color: "rgba(248,249,250,0.75)", fontWeight: 700 }}
      >
        Page {page}
      </Typography>

      <Button
        variant="contained"
        onClick={onNext}
        disabled={!hasNext || isLoading}
        endIcon={<ChevronRightIcon />}
        sx={{
          borderRadius: 2,
          textTransform: "none",
          background: "linear-gradient(135deg, #1DB6A8 0%, #0FB17A 100%)",
          color: "#0b0d14",
          fontWeight: 800,
          "&:hover": {
            background: "linear-gradient(135deg, #1ED9C5 0%, #14C48D 100%)",
          },
        }}
      >
        Next
      </Button>
    </Box>
  );
}
