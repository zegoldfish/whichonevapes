"use client";

import { EnrichedGameCard } from "@/app/components/EnrichedGameCard";
import { type Celebrity } from "@/types/celebrity";

interface Props {
  celebrity: Celebrity;
}

export function ClientCelebrityCard({ celebrity }: Props) {
  return (
    <EnrichedGameCard
      celebrity={celebrity}
      onVote={() => {}}
      isVoting={true}
      position="left"
    />
  );
}
