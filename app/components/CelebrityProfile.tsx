"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  IconButton,
  Tooltip,
  Skeleton,
} from "@mui/material";
import ThumbUpAltRoundedIcon from "@mui/icons-material/ThumbUpAltRounded";
import ThumbDownAltRoundedIcon from "@mui/icons-material/ThumbDownAltRounded";
import BoltRoundedIcon from "@mui/icons-material/BoltRounded";
import { type Celebrity } from "@/types/celebrity";
import {
  getCelebrityWikipediaData,
  voteConfirmedVaper,
} from "@/app/actions/celebrities";
import { getVaperLikelihood } from "@/lib/vaper";
import { GRADIENTS, COLORS } from "@/lib/theme";

interface CelebrityProfileProps {
  celebrity: Celebrity;
}

export function CelebrityProfile({ celebrity }: CelebrityProfileProps) {
  const [imgSrc, setImgSrc] = useState<string | null>(celebrity.image || null);
  const [bio, setBio] = useState<string | null>(celebrity.bio || null);
  const [loadingWikiData, setLoadingWikiData] = useState(false);
  const [vaperVotes, setVaperVotes] = useState({
    yes: celebrity.confirmedVaperYesVotes ?? 0,
    no: celebrity.confirmedVaperNoVotes ?? 0,
  });
  const [isVotingVaper, setIsVotingVaper] = useState(false);
  const [vaperVoteError, setVaperVoteError] = useState<string | null>(null);

  useEffect(() => {
    setImgSrc(celebrity.image || null);
    setBio(celebrity.bio || null);
    setVaperVotes({
      yes: celebrity.confirmedVaperYesVotes ?? 0,
      no: celebrity.confirmedVaperNoVotes ?? 0,
    });
    setVaperVoteError(null);
  }, [celebrity.id]);

  // Fetch Wikipedia data if needed
  useEffect(() => {
    if ((!imgSrc || !bio) && celebrity.wikipediaPageId && !loadingWikiData) {
      let active = true;
      setLoadingWikiData(true);
      getCelebrityWikipediaData(celebrity.wikipediaPageId)
        .then((data) => {
          if (!active) return;
          if (data.image && !imgSrc) {
            setImgSrc(data.image);
          }
          if (data.bio && !bio) {
            setBio(data.bio);
          }
        })
        .catch((err) => {
          console.error("Failed to load Wikipedia data:", err);
        })
        .finally(() => {
          if (active) setLoadingWikiData(false);
        });
      return () => {
        active = false;
      };
    }
  }, [celebrity.wikipediaPageId, imgSrc, bio]);

  const { isLikelyVaper, percentage } = getVaperLikelihood(
    vaperVotes.yes,
    vaperVotes.no
  );

  const handleVaperVote = async (isVaper: boolean) => {
    setIsVotingVaper(true);
    setVaperVoteError(null);
    try {
      const result = await voteConfirmedVaper({
        celebrityId: celebrity.id,
        isVaper,
      });
      setVaperVotes({ yes: result.yesVotes, no: result.noVotes });
    } catch (err) {
      setVaperVoteError(
        err instanceof Error ? err.message : "Failed to record vote"
      );
    } finally {
      setIsVotingVaper(false);
    }
  };

  const badgeText = celebrity.confirmedVaper
    ? "Confirmed Vaper"
    : isLikelyVaper
    ? "Likely Vaper"
    : null;

  return (
    <Card
      sx={{
        width: "100%",
        maxWidth: { xs: 360, sm: 420, md: 480 },
        margin: "0 auto",
        borderRadius: 4,
        overflow: "hidden",
        background: GRADIENTS.card,
        border: `1px solid ${COLORS.border.light}`,
        boxShadow: "0 16px 40px rgba(0, 0, 0, 0.35)",
      }}
    >
      {/* Image Section */}
      <Box sx={{ position: "relative", minHeight: { xs: 280, sm: 360 }, background: GRADIENTS.photoSection }}>
        {loadingWikiData && !imgSrc ? (
          <Skeleton 
            variant="rectangular" 
            height={360} 
            sx={{ 
              bgcolor: "rgba(255, 255, 255, 0.05)",
            }} 
          />
        ) : imgSrc ? (
          <>
            <Image
              src={imgSrc}
              alt={celebrity.name}
              width={640}
              height={640}
              unoptimized
              priority
              style={{
                width: "100%",
                height: "100%",
                objectFit: "cover",
                minHeight: 280,
                maxHeight: 420,
                filter: "saturate(1.08)",
              }}
            />
            <Box
              sx={{
                position: "absolute",
                inset: 0,
                background: GRADIENTS.imageOverlay,
              }}
            />
          </>
        ) : (
          <Box
            sx={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              minHeight: 280,
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No image available
            </Typography>
          </Box>
        )}
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
      </Box>

      <CardContent sx={{ p: 3 }}>
        {/* Stats */}
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
              background: COLORS.border.lighter,
              color: "var(--text)",
              fontWeight: 600,
            }}
          />
          <Chip
            label={`${celebrity.matches ?? 0} matches`}
            size="small"
            sx={{
              background: COLORS.border.lighter,
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
                border: `1px solid ${COLORS.primary.main}33`,
              }}
            />
          )}
        </Box>

        {/* Bio Section */}
        {loadingWikiData && !bio ? (
          <Box sx={{ mb: 3 }}>
            <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} height={20} />
            <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} height={20} />
            <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} height={20} width="80%" />
          </Box>
        ) : bio ? (
          <Box
            sx={{
              mb: 3,
              p: 2,
              borderRadius: 2,
              background: COLORS.background.overlay,
              border: `1px solid ${COLORS.border.light}`,
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
              Biography
            </Typography>
            <Typography
              variant="body2"
              sx={{
                color: COLORS.text.primary,
                lineHeight: 1.6,
                maxHeight: "240px",
                overflow: "auto",
                "&::-webkit-scrollbar": {
                  width: "6px",
                },
                "&::-webkit-scrollbar-track": {
                  background: "rgba(0, 0, 0, 0.2)",
                  borderRadius: "10px",
                },
                "&::-webkit-scrollbar-thumb": {
                  background: "rgba(123, 44, 191, 0.5)",
                  borderRadius: "10px",
                  "&:hover": {
                    background: "rgba(123, 44, 191, 0.7)",
                  },
                },
              }}
            >
              {bio}
            </Typography>
          </Box>
        ) : null}

        {/* Confirmed Vaper Voting */}
        <Box
          sx={{
            p: 1.5,
            borderRadius: 2,
            background: "rgba(255,255,255,0.03)",
            border: `1px solid ${COLORS.border.light}`,
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
            <Tooltip title="Yes, confirmed vaper" arrow>
              <span>
                <IconButton
                  onClick={() => handleVaperVote(true)}
                  disabled={isVotingVaper}
                  sx={{
                    background: "rgba(29,182,168,0.15)",
                    border: `1px solid ${COLORS.primary.main}66`,
                    "&:hover": { background: "rgba(29,182,168,0.25)" },
                  }}
                >
                  <ThumbUpAltRoundedIcon sx={{ color: COLORS.primary.main }} />
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
                  onClick={() => handleVaperVote(false)}
                  disabled={isVotingVaper}
                  sx={{
                    background: "rgba(239,71,111,0.12)",
                    border: `1px solid ${COLORS.accent.main}55`,
                    "&:hover": { background: "rgba(239,71,111,0.22)" },
                  }}
                >
                  <ThumbDownAltRoundedIcon sx={{ color: COLORS.accent.main }} />
                </IconButton>
              </span>
            </Tooltip>
          </Box>
          {vaperVoteError && (
            <Typography
              variant="caption"
              sx={{
                display: "block",
                color: COLORS.accent.main,
                mt: 1,
              }}
            >
              {vaperVoteError}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}
