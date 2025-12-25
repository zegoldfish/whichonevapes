"use client";

import { useState, useEffect, type MouseEvent } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  Button,
  Box,
  CircularProgress,
  Typography,
  Skeleton,
  IconButton,
  Tooltip,
} from "@mui/material";
import ThumbUpIcon from "@mui/icons-material/ThumbUp";
import ThumbDownIcon from "@mui/icons-material/ThumbDown";
import { type Celebrity } from "@/types/celebrity";
import { getCelebrityWikipediaData, voteConfirmedVaper } from "@/app/actions/celebrities";
import { getVaperLikelihood } from "@/lib/vaper";

interface EnrichedGameCardProps {
  celebrity: Celebrity;
  onVote: () => void;
  isVoting: boolean;
  position: "left" | "right";
  voteState?: "winner" | "loser" | null;
  readOnly?: boolean;
}

export function EnrichedGameCard({
  celebrity,
  onVote,
  isVoting,
  position,
  voteState = null,
  readOnly = false,
}: EnrichedGameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [wikiData, setWikiData] = useState<{
    bio: string | null;
    image: string | null;
  } | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [vaperVotes, setVaperVotes] = useState({
    yes: celebrity.confirmedVaperYesVotes ?? 0,
    no: celebrity.confirmedVaperNoVotes ?? 0,
  });
  const [isVotingVaper, setIsVotingVaper] = useState(false);
  const [vaperVoteError, setVaperVoteError] = useState<string | null>(null);

  // Reset local state when the celebrity changes to avoid stale data
  useEffect(() => {
    setExpanded(false);
    setWikiData(null);
    setError(null);
    setLoadingImage(false);
    setLoadingBio(false);
    setVaperVotes({
      yes: celebrity.confirmedVaperYesVotes ?? 0,
      no: celebrity.confirmedVaperNoVotes ?? 0,
    });
    setVaperVoteError(null);
  }, [celebrity.id, celebrity.confirmedVaperYesVotes, celebrity.confirmedVaperNoVotes]);

  const confirmed = Boolean((celebrity as any).confirmedVaper);

  // Fetch Wikipedia image automatically on mount if not already available
  useEffect(() => {
    if (!celebrity.image && celebrity.wikipediaPageId && !loadingImage && !wikiData) {
      setLoadingImage(true);
      getCelebrityWikipediaData(celebrity.wikipediaPageId)
        .then((data) => {
          setWikiData(data);
        })
        .catch((err) => {
          console.error("Failed to load Wikipedia image:", err);
        })
        .finally(() => {
          setLoadingImage(false);
        });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [celebrity.id, celebrity.image, celebrity.wikipediaPageId]);

  useEffect(() => {
    if (readOnly) {
      setExpanded(true);
      if (
        !celebrity.bio &&
        !wikiData?.bio &&
        !loadingBio &&
        celebrity.wikipediaPageId
      ) {
        setLoadingBio(true);
        setError(null);
        getCelebrityWikipediaData(celebrity.wikipediaPageId)
          .then((data) => {
            setWikiData((prev) => ({
              image: prev?.image || data.image,
              bio: data.bio,
            }));
          })
          .catch((err) => {
            setError("Failed to load Wikipedia data");
            console.error(err);
          })
          .finally(() => {
            setLoadingBio(false);
          });
      }
    }
  }, [celebrity.bio, celebrity.wikipediaPageId, readOnly]);

  // Fetch bio only when card is expanded
  const handleCardClick = async () => {
    if (readOnly) return;
    if (
      !expanded &&
      !celebrity.bio &&
      !wikiData?.bio &&
      !loadingBio &&
      !loadingImage &&
      celebrity.wikipediaPageId
    ) {
      setLoadingBio(true);
      setError(null);
      try {
        const data = await getCelebrityWikipediaData(celebrity.wikipediaPageId);
        setWikiData((prev) => ({
          image: prev?.image || data.image,
          bio: data.bio,
        }));
      } catch (err) {
        setError("Failed to load Wikipedia data");
        console.error(err);
      } finally {
        setLoadingBio(false);
      }
    }
    setExpanded((prev) => !prev);
  };

  // Use existing data if available, otherwise use fetched data
  const displayImage = celebrity.image || wikiData?.image;
  const displayBio = celebrity.bio || wikiData?.bio;

  const handleVaperVote = async (isVaper: boolean) => {
    setIsVotingVaper(true);
    setVaperVoteError(null);
    try {
      const result = await voteConfirmedVaper({
        celebrityId: celebrity.id,
        isVaper,
      });
      setVaperVotes({
        yes: result.yesVotes,
        no: result.noVotes,
      });
    } catch (err) {
      setVaperVoteError(err instanceof Error ? err.message : "Failed to vote");
    } finally {
      setIsVotingVaper(false);
    }
  };

  const handlePrimaryVoteClick = (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    onVote();
  };

  const handleVaperVoteClick = (isVaper: boolean) => (e: MouseEvent<HTMLButtonElement>) => {
    e.stopPropagation();
    handleVaperVote(isVaper);
  };

  const { isLikelyVaper } = getVaperLikelihood(vaperVotes.yes, vaperVotes.no);

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
          maxWidth: 400,
          margin: "0 auto",
          cursor: readOnly ? "default" : "pointer",
          transition: "all 0.25s ease",
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 3,
          overflow: "hidden",
          position: "relative",
          boxShadow:
            voteState === "winner"
              ? "0 0 0 2px rgba(76, 175, 80, 0.7), 0 16px 40px rgba(76, 175, 80, 0.25)"
              : voteState === "loser"
              ? "inset 0 0 120px rgba(0,0,0,0.35)"
              : "0 0 0 rgba(0,0,0,0)",
          transform:
            voteState === "winner"
              ? "translateY(-6px) scale(1.02)"
              : voteState === "loser"
              ? "translateY(0) scale(0.98)"
              : undefined,
          opacity: voteState === "loser" ? 0.7 : 1,
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(123, 44, 191, 0.1) 0%, rgba(199, 21, 133, 0.1) 100%)",
            opacity: 0,
            transition: "opacity 0.4s ease",
            pointerEvents: "none",
            zIndex: 0,
          },
          "&:hover": readOnly
            ? undefined
            : {
                transform: "translateY(-8px) scale(1.02)",
                boxShadow: "0 20px 40px rgba(123, 44, 191, 0.3), 0 0 40px rgba(199, 21, 133, 0.2)",
                border: "1px solid rgba(123, 44, 191, 0.4)",
                "&::before": {
                  opacity: 1,
                },
              },
        }}
        onClick={readOnly ? undefined : handleCardClick}
        aria-pressed={readOnly ? undefined : expanded}
        role={readOnly ? undefined : "button"}
      >
        {loadingImage && !displayImage ? (
          <Skeleton 
            variant="rectangular" 
            height={400} 
            sx={{ 
              bgcolor: "rgba(255, 255, 255, 0.05)",
            }} 
          />
        ) : displayImage ? (
          <Box sx={{ position: "relative", overflow: "hidden", width: "100%" }}>
            <Image
              src={displayImage}
              alt={celebrity.name}
              width={400}
              height={400}
              unoptimized
              style={{
                objectFit: "cover",
                width: "100%",
                height: "auto",
                minHeight: "400px",
                maxHeight: "400px",
              }}
              priority={position === "left"}
            />
            {confirmed && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1.5,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "white",
                  background: "linear-gradient(135deg, #7B2CBF 0%, #FF006E 100%)",
                  boxShadow: "0 6px 16px rgba(199, 21, 133, 0.35)",
                  zIndex: 2,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Confirmed Vaper
              </Box>
            )}
            {!confirmed && isLikelyVaper && (
              <Box
                sx={{
                  position: "absolute",
                  top: 12,
                  left: 12,
                  px: 1.25,
                  py: 0.4,
                  borderRadius: 1.5,
                  fontSize: "0.75rem",
                  fontWeight: 800,
                  color: "white",
                  background: "linear-gradient(135deg, #4CAF50 0%, #2E7D32 100%)",
                  boxShadow: "0 6px 16px rgba(76, 175, 80, 0.35)",
                  zIndex: 2,
                  letterSpacing: "0.05em",
                  textTransform: "uppercase",
                }}
              >
                Likely Vaper
              </Box>
            )}
            <Box
              sx={{
                position: "absolute",
                bottom: 0,
                left: 0,
                right: 0,
                height: "100px",
                background: "linear-gradient(to top, rgba(10, 17, 40, 0.95), transparent)",
                pointerEvents: "none",
                zIndex: 1,
              }}
            />
          </Box>
        ) : null}
        
        <CardContent sx={{ position: "relative", zIndex: 1, p: 3 }}>
          <Typography 
            variant="h5" 
            component="div"
            sx={{
              fontWeight: 700,
              mb: 2,
              fontSize: "1.5rem",
              background: "linear-gradient(135deg, #F8F9FA 0%, #C71585 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {celebrity.name}
          </Typography>
          
          {expanded && (
            <>
              {loadingBio && !displayBio ? (
                <Box sx={{ mt: 2 }}>
                  <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                  <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                  <Skeleton sx={{ bgcolor: "rgba(255, 255, 255, 0.05)" }} />
                </Box>
              ) : displayBio ? (
                <Typography
                  variant="body2"
                  sx={{
                    mt: 2,
                    textAlign: "left",
                    maxHeight: "200px",
                    overflow: "auto",
                    color: "rgba(248, 249, 250, 0.8)",
                    lineHeight: 1.6,
                    p: 2,
                    background: "rgba(0, 0, 0, 0.2)",
                    borderRadius: 2,
                    border: "1px solid rgba(255, 255, 255, 0.05)",
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
                  {displayBio}
                </Typography>
              ) : error ? (
                <Typography
                  variant="body2"
                  color="error"
                  sx={{ mt: 2 }}
                >
                  {error}
                </Typography>
              ) : null}
            </>
          )}
          
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
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "rgba(248, 249, 250, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.7rem",
                }}
              >
                Score
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: "var(--primary)",
                }}
              >
                {celebrity.elo ?? 1000}
              </Typography>
            </Box>
            <Box sx={{ textAlign: "center" }}>
              <Typography 
                variant="caption" 
                sx={{ 
                  color: "rgba(248, 249, 250, 0.5)",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  fontSize: "0.7rem",
                }}
              >
                Matches
              </Typography>
              <Typography 
                variant="h6" 
                sx={{ 
                  fontWeight: 700,
                  color: "var(--secondary)",
                }}
              >
                {celebrity.matches ?? 0}
              </Typography>
            </Box>
          </Box>
          
          {/* Confirmed Vaper Voting Section */}
          <Box
            sx={{
              mt: 3,
              pt: 3,
              borderTop: "1px solid rgba(255, 255, 255, 0.1)",
            }}
          >
            <Typography 
              variant="caption" 
              sx={{ 
                color: "rgba(248, 249, 250, 0.5)",
                textTransform: "uppercase",
                letterSpacing: "0.1em",
                fontSize: "0.7rem",
                display: "block",
                mb: 2,
                textAlign: "center",
              }}
            >
              Confirmed Vaper?
            </Typography>
            
            <Box
              sx={{
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                gap: 3,
              }}
            >
              <Tooltip title="Yes, confirmed vaper" arrow>
                <Box sx={{ textAlign: "center" }}>
                  <IconButton
                    onClick={handleVaperVoteClick(true)}
                    disabled={isVotingVaper}
                    sx={{
                      background: "linear-gradient(135deg, rgba(76, 175, 80, 0.2) 0%, rgba(56, 142, 60, 0.2) 100%)",
                      border: "1px solid rgba(76, 175, 80, 0.3)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, rgba(76, 175, 80, 0.4) 0%, rgba(56, 142, 60, 0.4) 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 16px rgba(76, 175, 80, 0.4)",
                      },
                      "&:disabled": {
                        opacity: 0.5,
                      },
                    }}
                  >
                    <ThumbUpIcon sx={{ color: "#4CAF50" }} />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      color: "#4CAF50",
                    }}
                  >
                    {vaperVotes.yes}
                  </Typography>
                </Box>
              </Tooltip>
              
              <Tooltip title="No, not a vaper" arrow>
                <Box sx={{ textAlign: "center" }}>
                  <IconButton
                    onClick={handleVaperVoteClick(false)}
                    disabled={isVotingVaper}
                    sx={{
                      background: "linear-gradient(135deg, rgba(244, 67, 54, 0.2) 0%, rgba(211, 47, 47, 0.2) 100%)",
                      border: "1px solid rgba(244, 67, 54, 0.3)",
                      transition: "all 0.3s ease",
                      "&:hover": {
                        background: "linear-gradient(135deg, rgba(244, 67, 54, 0.4) 0%, rgba(211, 47, 47, 0.4) 100%)",
                        transform: "translateY(-2px)",
                        boxShadow: "0 6px 16px rgba(244, 67, 54, 0.4)",
                      },
                      "&:disabled": {
                        opacity: 0.5,
                      },
                    }}
                  >
                    <ThumbDownIcon sx={{ color: "#F44336" }} />
                  </IconButton>
                  <Typography
                    variant="body2"
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                      color: "#F44336",
                    }}
                  >
                    {vaperVotes.no}
                  </Typography>
                </Box>
              </Tooltip>
            </Box>
            
            {vaperVoteError && (
              <Typography
                variant="caption"
                sx={{
                  display: "block",
                  mt: 2,
                  color: "#F44336",
                  textAlign: "center",
                }}
              >
                {vaperVoteError}
              </Typography>
            )}
          </Box>
          
        </CardContent>
      </Card>
      
      {!readOnly && (
        <Button
          variant="contained"
          onClick={handlePrimaryVoteClick}
          disabled={isVoting}
          sx={{
            mt: 3,
            py: 1.2,
            px: 2.5,
            fontSize: "0.875rem",
            fontWeight: 700,
            borderRadius: 3,
            alignSelf: "center",
            width: "fit-content",
            background: "linear-gradient(135deg, #7B2CBF 0%, #C71585 100%)",
            boxShadow: "0 8px 20px rgba(123, 44, 191, 0.4)",
            transition: "all 0.3s ease",
            textTransform: "none",
            letterSpacing: "0.05em",
            "&:hover": {
              background: "linear-gradient(135deg, #9333EA 0%, #E91E8C 100%)",
              transform: "translateY(-2px)",
              boxShadow: "0 12px 30px rgba(199, 21, 133, 0.6)",
            },
            "&:active": {
              transform: "translateY(0px)",
            },
            "&:disabled": {
              background: "rgba(123, 44, 191, 0.3)",
              color: "rgba(248, 249, 250, 0.5)",
            },
          }}
        >
          {isVoting ? (
            <CircularProgress size={24} color="inherit" />
          ) : (
            "More Likely to Vape"
          )}
        </Button>
      )}
    </Box>
  );
}
