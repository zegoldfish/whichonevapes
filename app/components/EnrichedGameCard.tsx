"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import {
  Card,
  CardContent,
  Box,
  Typography,
  Skeleton,
} from "@mui/material";
import { type Celebrity } from "@/types/celebrity";
import { getCelebrityWikipediaData } from "@/app/actions/celebrities";
import { getVaperLikelihood } from "@/lib/vaper";

interface EnrichedGameCardProps {
  celebrity: Celebrity;
}

export function EnrichedGameCard({
  celebrity,
}: EnrichedGameCardProps) {
  const [expanded, setExpanded] = useState(true);
  const [wikiData, setWikiData] = useState<{
    bio: string | null;
    image: string | null;
  } | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when the celebrity changes to avoid stale data
  useEffect(() => {
    setWikiData(null);
    setError(null);
    setLoadingImage(false);
    setLoadingBio(false);
  }, [celebrity.id]);

  const confirmed = Boolean((celebrity as any).confirmedVaper);

  // Fetch Wikipedia image and bio automatically on mount
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
  }, [celebrity.id, celebrity.image, celebrity.wikipediaPageId]);

  // Fetch bio on mount if not available
  useEffect(() => {
    if (!celebrity.bio && !wikiData?.bio && !loadingBio && celebrity.wikipediaPageId) {
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
  }, [celebrity.bio, celebrity.wikipediaPageId]);

  // Use existing data if available, otherwise use fetched data
  const displayImage = celebrity.image || wikiData?.image;
  const displayBio = celebrity.bio || wikiData?.bio;

  const { isLikelyVaper } = getVaperLikelihood(
    celebrity.confirmedVaperYesVotes ?? 0,
    celebrity.confirmedVaperNoVotes ?? 0
  );

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
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.1)",
          "&::before": {
            content: '""',
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "linear-gradient(135deg, rgba(123, 44, 191, 0.1) 0%, rgba(199, 21, 133, 0.1) 100%)",
            opacity: 1,
            pointerEvents: "none",
            zIndex: 0,
          },
        }}
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
                height: "55vh",
                maxHeight: 420,
                minHeight: 280,
              }}
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
          
        </CardContent>
      </Card>
    </Box>
  );
}
