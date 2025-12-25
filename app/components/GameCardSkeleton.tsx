"use client";

import { Card, CardContent, Box, Skeleton, Typography } from "@mui/material";

interface Props {
  position?: "left" | "right";
}

export default function GameCardSkeleton({ position = "left" }: Props) {
  return (
    <Box
      sx={{
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
      }}
    >
      <Card
        sx={{
          maxWidth: { xs: 360, sm: 380, md: 400 },
          width: "100%",
          margin: "0 auto",
          transition: "all 0.25s ease",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
        }}
      >
        {/* Image area */}
        <Skeleton
          variant="rectangular"
          height={{ xs: 320, sm: 360, md: 400 }}
          animation="wave"
          sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }}
        />

        <CardContent sx={{ position: "relative", zIndex: 1, p: 3 }}>
          {/* Name */}
          <Skeleton width="60%" height={32} sx={{ bgcolor: "rgba(255, 255, 255, 0.06)", mb: 2 }} />

          {/* Bio block preview */}
          <Box sx={{ mt: 2 }}>
            <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
            <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
            <Skeleton width="80%" sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
          </Box>

          {/* Stats */}
          <Box
            sx={{
              display: "flex",
              justifyContent: "space-around",
              mt: 3,
              pt: 2,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ visibility: "hidden" }}>
                Score
              </Typography>
              <Skeleton width={60} height={28} sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }} />
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography variant="caption" sx={{ visibility: "hidden" }}>
                Matches
              </Typography>
              <Skeleton width={60} height={28} sx={{ bgcolor: "rgba(255, 255, 255, 0.06)" }} />
            </Box>
          </Box>
        </CardContent>
      </Card>

      {/* Button placeholder */}
      <Skeleton
        variant="rounded"
        height={40}
        width={220}
        animation="wave"
        sx={{ mt: 3, alignSelf: "center", bgcolor: "rgba(255, 255, 255, 0.08)" }}
      />
    </Box>
  );
}
