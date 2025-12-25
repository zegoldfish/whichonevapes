"use client";

import Link from "next/link";
import { CelebrityProfile } from "@/app/components/CelebrityProfile";
import { type Celebrity } from "@/types/celebrity";
import { Box, Button } from "@mui/material";
import HomeRoundedIcon from "@mui/icons-material/HomeRounded";

interface Props {
  celebrity: Celebrity;
}

export function ClientCelebrityCard({ celebrity }: Props) {
  return (
    <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
      <Box sx={{ display: "flex", justifyContent: "center" }}>
        <Button
          component={Link}
          href="/"
          variant="outlined"
          startIcon={<HomeRoundedIcon />}
          sx={{
            borderRadius: 3,
            borderColor: "rgba(248,249,250,0.22)",
            color: "var(--text)",
            background: "rgba(255,255,255,0.04)",
            textTransform: "none",
            fontWeight: 700,
            px: 3,
            py: 1,
            "&:hover": {
              borderColor: "rgba(248,249,250,0.4)",
              background: "rgba(255,255,255,0.08)",
            },
          }}
        >
          Back to Game
        </Button>
      </Box>
      
      <CelebrityProfile celebrity={celebrity} />
    </Box>
  );
}
