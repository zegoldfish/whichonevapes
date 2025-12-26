"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
} from "@mui/material";
import { suggestCelebrity } from "../actions/celebrities";
import { COLORS } from "@/lib/theme";

export default function CelebritySuggestionForm() {
  const [name, setName] = useState("");
  const [wikipediaPageId, setWikipediaPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (name.trim().length < 2) {
      setError("Please enter a valid celebrity name");
      return;
    }

    setLoading(true);
    setError(null);
    setSuccess(null);

    try {
      const result = await suggestCelebrity({
        name: name.trim(),
        wikipediaPageId: wikipediaPageId.trim() || undefined,
      });

      if (result.success) {
        setSuccess(result.message);
        setName("");
        setWikipediaPageId("");
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to submit suggestion");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Paper
      elevation={0}
      sx={{
        p: 3,
        border: `1px solid ${COLORS.border.light}`,
        backgroundColor: COLORS.background.dark,
      }}
    >
      <Typography variant="h6" gutterBottom sx={{ color: COLORS.text.primary, fontWeight: 600 }}>
        Suggest a Celebrity
      </Typography>
      <Typography variant="body2" sx={{ color: COLORS.text.secondary, mb: 3 }}>
        Can&apos;t find who you&apos;re looking for? Suggest a celebrity to be added to the database.
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Box component="form" onSubmit={handleSubmit}>
        <TextField
          fullWidth
          required
          label="Celebrity Name"
          placeholder="e.g., Johnny Depp"
          value={name}
          onChange={(e) => setName(e.target.value)}
          disabled={loading}
          sx={{
            mb: 2,
            "& .MuiOutlinedInput-root": {
              backgroundColor: COLORS.background.dark,
              color: COLORS.text.primary,
              "&:hover fieldset": {
                borderColor: COLORS.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: COLORS.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: COLORS.text.secondary,
              "&.Mui-focused": {
                color: COLORS.primary.main,
              },
            },
          }}
        />

        <TextField
          fullWidth
          label="Wikipedia Page ID (optional)"
          placeholder="e.g., Johnny_Depp"
          value={wikipediaPageId}
          onChange={(e) => setWikipediaPageId(e.target.value)}
          disabled={loading}
          helperText="The Wikipedia page ID can be found in the URL (e.g., en.wikipedia.org/wiki/Johnny_Depp)"
          sx={{
            mb: 3,
            "& .MuiOutlinedInput-root": {
              backgroundColor: COLORS.background.dark,
              color: COLORS.text.primary,
              "&:hover fieldset": {
                borderColor: COLORS.primary.main,
              },
              "&.Mui-focused fieldset": {
                borderColor: COLORS.primary.main,
              },
            },
            "& .MuiInputLabel-root": {
              color: COLORS.text.secondary,
              "&.Mui-focused": {
                color: COLORS.primary.main,
              },
            },
            "& .MuiFormHelperText-root": {
              color: COLORS.text.muted,
            },
          }}
        />

        <Button
          type="submit"
          variant="contained"
          fullWidth
          disabled={loading || name.trim().length < 2}
          sx={{
            backgroundColor: COLORS.primary.main,
            color: "#fff",
            py: 1.5,
            fontWeight: 600,
            "&:hover": {
              backgroundColor: COLORS.primary.light,
            },
            "&:disabled": {
              backgroundColor: COLORS.background.darkText,
              color: COLORS.text.muted,
            },
          }}
        >
          {loading ? <CircularProgress size={24} sx={{ color: "#fff" }} /> : "Submit Suggestion"}
        </Button>
      </Box>
    </Paper>
  );
}
