"use client";

import { useEffect, useState, type MouseEvent } from "react";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Chip,
  IconButton,
  Tooltip,
  CircularProgress,
} from "@mui/material";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { type Celebrity } from "@/types/celebrity";
import { getVaperLikelihood } from "@/lib/vaper";
import { GRADIENTS } from "@/lib/theme";
import { useWikipediaData } from "@/app/hooks/useWikipediaData";
import { useVaperVoting } from "@/app/hooks/useVaperVoting";

interface VoteCardProps {
  celebrity: Celebrity;
  onVote: () => void;
  isVoting: boolean;
  position: "left" | "right";
  voteState?: "winner" | "loser" | null;
}

export function VoteCard({
  celebrity,
  onVote,
  isVoting,
  position,
  voteState = null,
}: VoteCardProps) {
  const { imgSrc, bio, loading: loadingImg } = useWikipediaData({
    wikipediaPageId: celebrity.wikipediaPageId,
    initialImage: celebrity.image,
    initialBio: celebrity.bio,
  });

  const { votes: vaperVotes, isVoting: isVotingVaper, error: vaperVoteError, handleVote } = useVaperVoting({
    celebrityId: celebrity.id,
    initialYesVotes: celebrity.confirmedVaperYesVotes,
    initialNoVotes: celebrity.confirmedVaperNoVotes,
  });

  const { isLikelyVaper, percentage } = getVaperLikelihood(
    vaperVotes.yes,
    vaperVotes.no
  );

  const handleVaperVoteClick = (isVaper: boolean) => (
    e: MouseEvent<HTMLButtonElement>
  ) => {
    e.stopPropagation();
    if (isVotingVaper) return;
    handleVote(isVaper);
  };

  const badgeText = celebrity.confirmedVaper
    ? "Confirmed Vaper"
    : isLikelyVaper
    ? "Likely Vaper"
    : null;

  return (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        textAlign: "center",
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
          border: "1px solid rgba(255,255,255,0.08)",
          boxShadow:
            voteState === "winner"
              ? "0 0 0 2px rgba(29, 182, 168, 0.6), 0 20px 45px rgba(29, 182, 168, 0.25)"
              : voteState === "loser"
              ? "inset 0 0 120px rgba(0,0,0,0.35)"
              : "0 16px 40px rgba(0, 0, 0, 0.35)",
          transform:
            voteState === "winner"
              ? "translateY(-6px) scale(1.02)"
              : voteState === "loser"
              ? "translateY(0) scale(0.98)"
              : "translateY(0)",
          opacity: voteState === "loser" ? 0.75 : 1,
          transition: "transform 0.2s ease, box-shadow 0.2s ease, opacity 0.2s ease",
        }}
      >
        <Box sx={{ position: "relative", minHeight: { xs: 260, sm: 320 }, background: GRADIENTS.photoSection }}>
          {imgSrc && (
            <Image
              src={imgSrc}
              alt={celebrity.name}
              width={640}
              height={640}
              unoptimized
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                minHeight: 260,
                maxHeight: 420,
                filter: "saturate(1.08)",
              }}
              priority={position === "left"}
            />
          )}
          <Box
            sx={{
              position: "absolute",
              inset: 0,
              background: GRADIENTS.imageOverlay,
            }}
          />
          {badgeText && (
            <Chip
              icon={<BoltRoundedIcon sx={{ color: "#0b0d14" }} />}
              label={badgeText}
              size="small"
              sx={{
                position: "absolute",
                top: 14,
                left: 14,
                fontWeight: 700,
                background:
                  celebrity.confirmedVaper
                    ? GRADIENTS.confirmedVaper
                    : GRADIENTS.likelyVaper,
                color: "#0b0d14",
                boxShadow: "0 8px 20px rgba(0,0,0,0.2)",
              }}
            />
          )}
          {loadingImg && !imgSrc && (
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <CircularProgress size={32} color="inherit" />
            </Box>
          )}
        </Box>

        {bio && (
          <Box
            sx={{
              maxHeight: 120,
              overflowY: "auto",
              px: 3,
              pt: 2,
              pb: 1,
              background: "rgba(0, 0, 0, 0.25)",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              "&::-webkit-scrollbar": {
                width: "6px",
              },
              "&::-webkit-scrollbar-track": {
                background: "rgba(0, 0, 0, 0.2)",
              },
              "&::-webkit-scrollbar-thumb": {
                background: "rgba(255, 255, 255, 0.2)",
                borderRadius: "3px",
                "&:hover": {
                  background: "rgba(255, 255, 255, 0.3)",
                },
              },
            }}
          >
            <Typography
              variant="body2"
              sx={{
                color: "rgba(248, 249, 250, 0.85)",
                lineHeight: 1.6,
                fontSize: "0.875rem",
              }}
            >
              {bio}
            </Typography>
          </Box>
        )}

        <CardContent sx={{ p: 3 }}>
          <Typography
            variant="h5"
            sx={{
              fontWeight: 800,
              letterSpacing: "-0.02em",
              mb: 1,
              color: "var(--text)",
            }}
          >
            {celebrity.name}
          </Typography>

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
            <Chip
              label={`Elo ${celebrity.elo ?? 1000}`}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--text)",
                fontWeight: 600,
              }}
            />
            <Chip
              label={`${celebrity.matches ?? 0} matches`}
              size="small"
              sx={{
                background: "rgba(255,255,255,0.06)",
                color: "var(--text)",
                fontWeight: 600,
              }}
            />
            {isLikelyVaper && (
              <Chip
                label={`${Math.round(percentage)}% say vaper`}
                size="small"
                sx={{
                  background: "rgba(29, 182, 168, 0.15)",
                  color: "var(--text)",
                  fontWeight: 700,
                  border: "1px solid rgba(29,182,168,0.5)",
                }}
              />
            )}
          </Box>

          <Button
            variant="contained"
            fullWidth
            onClick={(e) => {
              e.stopPropagation();
              if (!isVoting) onVote();
            }}
            disabled={isVoting}
            sx={{
              mt: 1,
              py: 1.2,
              fontWeight: 800,
              letterSpacing: "0.02em",
              borderRadius: 2.5,
              background: GRADIENTS.primaryButton,
              color: "#071019",
              boxShadow: "0 12px 28px rgba(15, 177, 122, 0.35)",
              textTransform: "none",
              transition: "transform 0.15s ease, box-shadow 0.15s ease",
              "&:hover": {
                background: GRADIENTS.primaryButtonHover,
                transform: "translateY(-2px)",
                boxShadow: "0 16px 32px rgba(15, 177, 122, 0.45)",
              },
              "&:disabled": {
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.6)",
                boxShadow: "none",
              },
            }}
          >
            {isVoting ? "Submitting..." : "More likely to vape"}
          </Button>

          <Box
            sx={{
              mt: 3,
              p: 1.5,
              borderRadius: 2,
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <Typography
              variant="caption"
              sx={{
                display: "block",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                color: "rgba(248, 249, 250, 0.65)",
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
              <Tooltip title="Yes, confirmed vaper" arrow>
                <span>
                  <IconButton
                    onClick={handleVaperVoteClick(true)}
                    disabled={isVotingVaper}
                    sx={{
                      background: "rgba(29,182,168,0.15)",
                      border: "1px solid rgba(29,182,168,0.4)",
                      "&:hover": { background: "rgba(29,182,168,0.25)" },
                    }}
                  >
                    <ThumbUpAltRoundedIcon sx={{ color: "#1DB6A8" }} />
                  </IconButton>
                </span>
              </Tooltip>
              <Typography
                variant="body2"
                sx={{ color: "var(--text)", fontWeight: 700 }}
              >
                {vaperVotes.yes} / {vaperVotes.no}
              </Typography>
              <Tooltip title="No, not a vaper" arrow>
                <span>
                  <IconButton
                    onClick={handleVaperVoteClick(false)}
                    disabled={isVotingVaper}
                    sx={{
                      background: "rgba(239,71,111,0.12)",
                      border: "1px solid rgba(239,71,111,0.35)",
                      "&:hover": { background: "rgba(239,71,111,0.22)" },
                    }}
                  >
                    <ThumbDownAltRoundedIcon sx={{ color: "#EF476F" }} />
                  </IconButton>
                </span>
              </Tooltip>
            </Box>
            {vaperVoteError && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  color: "#EF476F",
                  mt: 1,
                }}
              >
                {vaperVoteError}
              </Typography>
            )}
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
