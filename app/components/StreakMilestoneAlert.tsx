"use client";

import { Snackbar, Alert, AlertTitle, Box } from "@mui/material";
import CelebrationIcon from "@mui/icons-material/Celebration";

interface StreakMilestoneAlertProps {
  open: boolean;
  milestone: number | null;
  onClose: () => void;
  isVoteMilestone?: boolean;
}

export function StreakMilestoneAlert({
  open,
  milestone,
  onClose,
  isVoteMilestone = false,
}: StreakMilestoneAlertProps) {
  if (!milestone) return null;

  const getMessage = () => {
    if (isVoteMilestone) {
      return {
        title: "🎉 Milestone Reached!",
        message: `You've cast ${milestone} total votes! Keep it going!`,
      };
    }
    return {
      title: "🔥 Streak Milestone!",
      message: `${milestone} days in a row! You're on fire!`,
    };
  };

  const { title, message } = getMessage();

  return (
    <Snackbar
      open={open}
      autoHideDuration={4000}
      onClose={onClose}
      anchorOrigin={{ vertical: "top", horizontal: "center" }}
      sx={{ mt: 2 }}
    >
      <Alert
        onClose={onClose}
        severity="success"
        icon={<CelebrationIcon />}
        sx={{
          background: "linear-gradient(135deg, rgba(29, 182, 168, 0.95) 0%, rgba(6, 214, 160, 0.95) 100%)",
          color: "rgba(12, 18, 32, 1)",
          border: "2px solid rgba(255,255,255,0.3)",
          boxShadow: "0 16px 40px rgba(29, 182, 168, 0.4)",
          borderRadius: 2,
          fontWeight: 700,
          minWidth: 300,
          "& .MuiAlert-icon": {
            color: "rgba(12, 18, 32, 1)",
          },
        }}
      >
        <AlertTitle sx={{ fontWeight: 800, color: "rgba(12, 18, 32, 1)" }}>
          {title}
        </AlertTitle>
        <Box sx={{ color: "rgba(12, 18, 32, 0.85)" }}>{message}</Box>
      </Alert>
    </Snackbar>
  );
}
