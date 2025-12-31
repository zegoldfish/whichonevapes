import { useState, useEffect, useCallback } from "react";

interface VoteStats {
  totalVotes: number;
  currentStreak: number;
  longestStreak: number;
  lastVoteDate: string | null;
  votesToday: number;
}

interface UseVoteStreakReturn {
  stats: VoteStats;
  recordVote: () => void;
  resetStats: () => void;
  showStreakFeedback: boolean;
  streakMilestone: number | null;
  dismissFeedback: () => void;
}

const STORAGE_KEY = "voteStats";
export const STREAK_MILESTONES = [5, 10, 25, 50, 100, 250, 500, 1000];

const getDefaultStats = (): VoteStats => ({
  totalVotes: 0,
  currentStreak: 0,
  longestStreak: 0,
  lastVoteDate: null,
  votesToday: 0,
});

const isToday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);
  const today = new Date();
  return (
    date.getDate() === today.getDate() &&
    date.getMonth() === today.getMonth() &&
    date.getFullYear() === today.getFullYear()
  );
};

const isYesterday = (dateString: string | null): boolean => {
  if (!dateString) return false;
  const date = new Date(dateString);

  // Normalize the input date to local midnight
  const inputDate = new Date(date);
  inputDate.setHours(0, 0, 0, 0);

  // Compute yesterday relative to today's local midnight
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const yesterday = new Date(today);
  yesterday.setDate(today.getDate() - 1);

  return inputDate.getTime() === yesterday.getTime();
};

/**
 * Hook for tracking user vote statistics and streaks
 * Persists data in localStorage and provides feedback on milestones
 */
export function useVoteStreak(): UseVoteStreakReturn {
  const [stats, setStats] = useState<VoteStats>(getDefaultStats);
  const [showStreakFeedback, setShowStreakFeedback] = useState(false);
  const [streakMilestone, setStreakMilestone] = useState<number | null>(null);

  // Load stats from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored) as VoteStats;
        // Reset votesToday if it's a new day
        if (!isToday(parsed.lastVoteDate)) {
          parsed.votesToday = 0;
        }
        // Reset streak if user hasn't voted today or yesterday
        if (!isToday(parsed.lastVoteDate) && !isYesterday(parsed.lastVoteDate)) {
          parsed.currentStreak = 0;
        }
        setStats(parsed);
      }
    } catch (error) {
      console.error("Failed to load vote stats:", error);
    }
  }, []);

  // Save stats to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
    } catch (error) {
      console.error("Failed to save vote stats:", error);
    }
  }, [stats]);

  const recordVote = useCallback(() => {
    setStats((prev) => {
      const now = new Date().toISOString();
      const wasToday = isToday(prev.lastVoteDate);
      const wasYesterday = isYesterday(prev.lastVoteDate);
      
      // Calculate new streak
      let newStreak = prev.currentStreak;
      if (!prev.lastVoteDate || wasYesterday) {
        // Continue or start streak
        newStreak = prev.currentStreak + 1;
      } else if (!wasToday) {
        // Streak broken, reset
        newStreak = 1;
      }
      
      const newTotalVotes = prev.totalVotes + 1;
      const newLongestStreak = Math.max(prev.longestStreak, newStreak);
      
      // Check for milestone
      const milestone = STREAK_MILESTONES.find(
        (m) => newTotalVotes === m && prev.totalVotes < m
      );
      
      if (milestone) {
        setStreakMilestone(milestone);
        setShowStreakFeedback(true);
      } else if (newStreak > prev.currentStreak && newStreak % 5 === 0) {
        // Show feedback for streak multiples of 5
        setStreakMilestone(newStreak);
        setShowStreakFeedback(true);
      }
      
      return {
        totalVotes: newTotalVotes,
        currentStreak: newStreak,
        longestStreak: newLongestStreak,
        lastVoteDate: now,
        votesToday: wasToday ? prev.votesToday + 1 : 1,
      };
    });
  }, []);

  const resetStats = useCallback(() => {
    setStats(getDefaultStats());
    localStorage.removeItem(STORAGE_KEY);
    setShowStreakFeedback(false);
    setStreakMilestone(null);
  }, []);

  const dismissFeedback = useCallback(() => {
    setShowStreakFeedback(false);
  }, []);

  return {
    stats,
    recordVote,
    resetStats,
    showStreakFeedback,
    streakMilestone,
    dismissFeedback,
  };
}
