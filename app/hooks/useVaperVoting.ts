import { useState } from "react";
import { event as gaEvent } from "@/lib/gtag";
import { voteConfirmedVaper } from "@/app/actions/celebrities";

interface UseVaperVotingProps {
  celebrityId: string;
  initialYesVotes?: number;
  initialNoVotes?: number;
}

interface UseVaperVotingReturn {
  votes: {
    yes: number;
    no: number;
  };
  isVoting: boolean;
  error: string | null;
  handleVote: (isVaper: boolean) => Promise<void>;
}

/**
 * Hook for managing vaper voting state and functionality
 * Handles vote submission, state updates, and error handling
 */
export function useVaperVoting({
  celebrityId,
  initialYesVotes = 0,
  initialNoVotes = 0,
}: UseVaperVotingProps): UseVaperVotingReturn {
  const [votes, setVotes] = useState({
    yes: initialYesVotes,
    no: initialNoVotes,
  });
  const [isVoting, setIsVoting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleVote = async (isVaper: boolean) => {
    setIsVoting(true);
    setError(null);

    try {
      const result = await voteConfirmedVaper({
        celebrityId,
        isVaper,
      });
      // Track GA event for confirmed vaper vote
      gaEvent({
        action: "vaper_vote",
        category: "engagement",
        label: `celebrityId:${celebrityId}|vote:${isVaper ? "yes" : "no"}`,
        value: 1,
      });
      setVotes({ yes: result.yesVotes, no: result.noVotes });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to record vote");
    } finally {
      setIsVoting(false);
    }
  };

  return { votes, isVoting, error, handleVote };
}
