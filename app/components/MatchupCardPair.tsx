"use client";

import { useMemo } from "react";
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
}

export function MatchupCardPair({
  celebA,
  celebB,
  onVoteA,
  onVoteB,
  isVoting,
  feedbackA,
  feedbackB,
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
    </>
  );
}
