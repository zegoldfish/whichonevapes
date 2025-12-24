"use client";

import { useState, useEffect } from "react";
import {
  Card,
  CardContent,
  CardMedia,
  Button,
  Box,
  CircularProgress,
  Typography,
  Skeleton,
} from "@mui/material";
import { type Celebrity } from "@/types/celebrity";
import { getCelebrityWikipediaData } from "@/app/actions/celebrities";

interface EnrichedGameCardProps {
  celebrity: Celebrity;
  onVote: () => void;
  isVoting: boolean;
  position: "left" | "right";
}

export function EnrichedGameCard({
  celebrity,
  onVote,
  isVoting,
  position,
}: EnrichedGameCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [wikiData, setWikiData] = useState<{
    bio: string | null;
    image: string | null;
  } | null>(null);
  const [loadingImage, setLoadingImage] = useState(false);
  const [loadingBio, setLoadingBio] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset local state when the celebrity changes to avoid stale data
  useEffect(() => {
    setExpanded(false);
    setWikiData(null);
    setError(null);
    setLoadingImage(false);
    setLoadingBio(false);
  }, [celebrity.id]);

  // Fetch Wikipedia image automatically on mount if not already available
  useEffect(() => {
    if (!celebrity.image && !wikiData?.image && celebrity.wikipediaPageId) {
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
    // Only run this effect when the celebrity input changes
  }, [celebrity.id, celebrity.image, celebrity.wikipediaPageId]);

  // Fetch bio only when card is expanded
  const handleCardClick = async () => {
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

  return (
    <Box sx={{ textAlign: "center" }}>
      <Card
        sx={{
          maxWidth: 300,
          margin: "0 auto",
          cursor: "pointer",
          transition: "transform 0.2s",
          "&:hover": {
            transform: "scale(1.05)",
          },
        }}
        onClick={handleCardClick}
        aria-pressed={expanded}
        role="button"
      >
        {loadingImage && !displayImage ? (
          <Skeleton variant="rectangular" height={300} />
        ) : displayImage ? (
          <CardMedia
            component="img"
            height="300"
            image={displayImage}
            alt={celebrity.name}
            sx={{ objectFit: "cover" }}
          />
        ) : null}
        
        <CardContent>
          <Typography variant="h5" component="div">
            {celebrity.name}
          </Typography>
          
          {expanded && (
            <>
              {loadingBio && !displayBio ? (
                <Box sx={{ mt: 2 }}>
                  <Skeleton />
                  <Skeleton />
                  <Skeleton />
                </Box>
              ) : displayBio ? (
                <Typography
                  variant="body2"
                  color="text.secondary"
                  sx={{
                    mt: 2,
                    textAlign: "left",
                    maxHeight: "200px",
                    overflow: "auto",
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
          
          <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
            Score: {celebrity.elo ?? 1000}
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Matches: {celebrity.matches ?? 0}
          </Typography>
        </CardContent>
      </Card>
      
      <Button
        variant="contained"
        size="large"
        onClick={onVote}
        disabled={isVoting}
        sx={{ mt: 2, minWidth: 150 }}
      >
        {isVoting ? (
          <CircularProgress size={24} color="inherit" />
        ) : (
          "More Likely to Vape"
        )}
      </Button>
    </Box>
  );
}
