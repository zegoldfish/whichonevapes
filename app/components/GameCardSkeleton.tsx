"use client";

import { Card, CardContent, Box, Skeleton, Typography } from "@mui/material";
import { GRADIENTS, COLORS } from "@/lib/theme";

interface Props {
  position?: "left" | "right";
}

export default function GameCardSkeleton({ position: _position = "left" }: Props) {
  return (
    <Box
      sx={{
        textAlign: "center",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        width: "100%",
      }}
    >
      <Card
        sx={{
          width: "100%",
          maxWidth: { xs: 360, sm: 420, md: 460 },
          margin: "0 auto",
          borderRadius: 4,
          overflow: "hidden",
          position: "relative",
          background: GRADIENTS.card,
          border: `1px solid ${COLORS.border.light}`,
          boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
        }}
      >
        <Box
          sx={{
            position: "relative",
            minHeight: { xs: 260, sm: 320 },
            background: GRADIENTS.photoSection,
            overflow: "hidden",
          }}
        >
          <Skeleton
            variant="rectangular"
            animation="wave"
            sx={{
              position: "absolute",
              inset: 0,
              bgcolor: "rgba(255, 255, 255, 0.06)",
            }}
          />
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: GRADIENTS.imageOverlay,
              opacity: 0.9,
            }}
          />
        </Box>

        <Box
          sx={{
            maxHeight: 120,
            overflow: "hidden",
            px: 3,
            pt: 2,
            pb: 1,
            background: COLORS.background.overlay,
            borderBottom: `1px solid ${COLORS.border.lighter}`,
          }}
        >
          <Skeleton width="95%" sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", mb: 1 }} />
          <Skeleton width="90%" sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", mb: 1 }} />
          <Skeleton width="80%" sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }} />
        </Box>

        <CardContent sx={{ p: 3 }}>
          <Skeleton
            width="65%"
            height={34}
            animation="wave"
            sx={{ bgcolor: "rgba(255, 255, 255, 0.14)", mb: 2 }}
          />

          <Box
            sx={{
              display: "flex",
              gap: 1,
              justifyContent: "center",
              flexWrap: "wrap",
              mb: 2,
              rowGap: 1,
            }}
          >
            <Skeleton
              variant="rounded"
              width={100}
              height={28}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }}
            />
            <Skeleton
              variant="rounded"
              width={110}
              height={28}
              sx={{ bgcolor: "rgba(255, 255, 255, 0.08)" }}
            />
            <Skeleton
              variant="rounded"
              width={130}
              height={28}
              sx={{ bgcolor: "rgba(29, 182, 168, 0.18)" }}
            />
          </Box>

          <Skeleton
            variant="rounded"
            width="100%"
            height={52}
            animation="wave"
            sx={{ bgcolor: "rgba(29, 182, 168, 0.22)", mb: 2 }}
          />

          <Skeleton
            variant="rounded"
            width={160}
            height={40}
            sx={{ bgcolor: "rgba(255, 255, 255, 0.08)", mb: 2 }}
          />

          <Box
            sx={{
              mt: 2,
              p: 1.5,
              borderRadius: 2,
              background: "rgba(255,255,255,0.03)",
              border: `1px solid ${COLORS.border.lighter}`,
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: COLORS.text.muted,
                mb: 1,
              }}
            >
              Confirmed vaper?
            </Typography>
            <Box
              sx={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 1,
              }}
            >
              <Skeleton
                variant="circular"
                width={42}
                height={42}
                sx={{ bgcolor: "rgba(29, 182, 168, 0.22)" }}
              />
              <Skeleton
                variant="rounded"
                width={70}
                height={20}
                sx={{ bgcolor: "rgba(255, 255, 255, 0.12)" }}
              />
              <Skeleton
                variant="circular"
                width={42}
                height={42}
                sx={{ bgcolor: "rgba(239, 71, 111, 0.2)" }}
              />
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
