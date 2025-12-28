"use client";

import { useMemo } from "react";
import { Box } from "@mui/material";
import { Celebrity } from "@/types/celebrity";
import { VoteCard } from "./VoteCard";
import { useWikipediaData } from "@/app/hooks/useWikipediaData";

interface MatchupCardPairProps {
  celebA: Celebrity;
  celebB: Celebrity;
  onVoteA: () => void;
  onVoteB: () => void;
  isVoting: boolean;
  feedbackA: boolean;
  feedbackB: boolean;
  activeCard: "A" | "B";
  onCycleCard: () => void;
  onTouchStart: (e: React.TouchEvent) => void;
  onTouchMove: (e: React.TouchEvent) => void;
  onTouchEnd: () => void;
}

export function MatchupCardPair({
  celebA,
  celebB,
  onVoteA,
  onVoteB,
  isVoting,
  feedbackA,
  feedbackB,
  activeCard,
  onCycleCard,
  onTouchStart,
  onTouchMove,
  onTouchEnd,
}: MatchupCardPairProps) {
  const { imgSrc: imgA } = useWikipediaData({
    wikipediaPageId: celebA.wikipediaPageId,
    initialImage: celebA.image,
    initialBio: celebA.bio,
  });

  const { imgSrc: imgB } = useWikipediaData({
    wikipediaPageId: celebB.wikipediaPageId,
    initialImage: celebB.image,
    initialBio: celebB.bio,
  });

  return (
    <>
      {/* Desktop: side by side */}
      <Box sx={{ display: { xs: "none", md: "contents" } }}>
        <VoteCard
          key={celebA.id}
          celebrity={celebA}
          onVote={onVoteA}
          isVoting={isVoting}
          position="left"
          pairedCelebrity={celebB}
          pairedCelebImg={imgB}
          voteState={feedbackA ? "winner" : feedbackB ? "loser" : null}
        />
        <VoteCard
          key={celebB.id}
          celebrity={celebB}
          onVote={onVoteB}
          isVoting={isVoting}
          position="right"
          pairedCelebrity={celebA}
          pairedCelebImg={imgA}
          voteState={feedbackB ? "winner" : feedbackA ? "loser" : null}
        />
      </Box>

      {/* Mobile: stacked cards */}
      <Box
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
        sx={{
          display: { xs: "block", md: "none" },
          position: "relative",
          width: "100%",
          maxWidth: 400,
          margin: "0 auto",
          height: "auto",
          minHeight: "62vh",
          touchAction: "pan-y", // Allow vertical scrolling but capture horizontal swipes
        }}
      >
        {/* Card A - back card */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "100%",
            transform: activeCard === "A" 
              ? "translateX(-50%) translateX(-15px) scale(0.95) rotateZ(-3deg)" 
              : "translateX(-50%) translateX(15px) scale(0.95) rotateZ(3deg)",
            opacity: activeCard === "A" ? 1 : 0.5,
            zIndex: activeCard === "A" ? 2 : 1,
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            pointerEvents: activeCard === "A" ? "auto" : "none",
            cursor: "default",
          }}
        >
          <VoteCard
            key={celebA.id}
            celebrity={celebA}
            onVote={onVoteA}
            isVoting={isVoting}
            position="left"
            pairedCelebrity={celebB}
            pairedCelebImg={imgB}
            voteState={feedbackA ? "winner" : feedbackB ? "loser" : null}
            isMobileInactive={activeCard !== "A"}
          />
        </Box>

        {/* Card B - front card */}
        <Box
          sx={{
            position: "absolute",
            top: 0,
            left: "50%",
            width: "100%",
            transform: activeCard === "B" 
              ? "translateX(-50%) translateX(-15px) scale(0.95) rotateZ(-3deg)" 
              : "translateX(-50%) translateX(15px) scale(0.95) rotateZ(3deg)",
            opacity: activeCard === "B" ? 1 : 0.5,
            zIndex: activeCard === "B" ? 2 : 1,
            transition: "all 0.4s cubic-bezier(0.34, 1.56, 0.64, 1)",
            pointerEvents: activeCard === "B" ? "auto" : "none",
            cursor: "default",
          }}
        >
          <VoteCard
            key={celebB.id}
            celebrity={celebB}
            onVote={onVoteB}
            isVoting={isVoting}
            position="right"
            pairedCelebrity={celebA}
            pairedCelebImg={imgA}
            voteState={feedbackB ? "winner" : feedbackA ? "loser" : null}
            isMobileInactive={activeCard !== "B"}
          />
        </Box>
      </Box>
    </>
  );
}
