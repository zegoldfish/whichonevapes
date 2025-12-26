"use client";

import { useState, useEffect } from "react";
import {
  Box,
  TextField,
  Button,
  Paper,
  Typography,
  Alert,
  CircularProgress,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
} from "@mui/material";
import { suggestCelebrity, searchWikipedia } from "../actions/celebrities";
import { COLORS } from "@/lib/theme";
import { event as gaEvent } from "@/lib/gtag";

export default function CelebritySuggestionForm() {
  const [name, setName] = useState("");
  const [wikipediaPageId, setWikipediaPageId] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [wikiResults, setWikiResults] = useState<Array<{ pageId: string; title: string; thumbnail?: string }>>([]);
  const [wikiLoading, setWikiLoading] = useState(false);
  const [wikiError, setWikiError] = useState<string | null>(null);

  // Debounced Wikipedia search when typing the name
  useEffect(() => {
    const q = name.trim();
    if (q.length < 2) {
      setWikiResults([]);
      setWikiError(null);
      setWikiLoading(false);
      return;
    }

    setWikiLoading(true);
    setWikiError(null);
    const timer = setTimeout(async () => {
      try {
        gaEvent({ action: "wiki_search", category: "suggestion", label: q });
        const results = await searchWikipedia({ query: q, limit: 5 });
        setWikiResults(results);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Wikipedia search failed";
        setWikiError(msg);
        setWikiResults([]);
        gaEvent({ action: "wiki_search_error", category: "suggestion", label: msg });
      } finally {
        setWikiLoading(false);
      }
    }, 400);

    return () => clearTimeout(timer);
  }, [name]);

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
      // Track suggestion submit
      gaEvent({ action: "suggest_submit", category: "suggestion", label: name.trim() });
      const result = await suggestCelebrity({
        name: name.trim(),
        wikipediaPageId: wikipediaPageId.trim() || undefined,
      });

      if (result.success) {
        gaEvent({ action: "suggest_success", category: "suggestion", label: name.trim() });
        setSuccess(result.message);
        setName("");
        setWikipediaPageId("");
      } else {
        gaEvent({ action: "suggest_error", category: "suggestion", label: result.message });
        setError(result.message);
      }
    } catch (err) {
      gaEvent({ action: "suggest_error", category: "suggestion", label: (err instanceof Error ? err.message : "unknown_error") });
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

        {/* Wikipedia search suggestions */}
        {(wikiLoading || wikiResults.length > 0 || wikiError) && (
          <Paper
            elevation={0}
            sx={{
              mb: 3,
              border: `1px solid ${COLORS.border.light}`,
              backgroundColor: COLORS.background.dark,
            }}
          >
            <Box sx={{ p: 2 }}>
              <Typography variant="subtitle2" sx={{ color: COLORS.text.secondary, mb: 1 }}>
                Wikipedia Suggestions
              </Typography>
              {wikiLoading && (
                <Typography variant="body2" sx={{ color: COLORS.text.muted }}>
                  Searching…
                </Typography>
              )}
              {wikiError && (
                <Alert severity="warning" sx={{ mb: 1 }}>
                  {wikiError}
                </Alert>
              )}
            </Box>

            {wikiResults.length > 0 && (
              <List disablePadding>
                {wikiResults.map((r) => (
                  <ListItem key={r.pageId} disablePadding divider>
                    <ListItemButton
                      onClick={() => {
                        setName(r.title);
                        setWikipediaPageId(r.pageId);
                        gaEvent({ action: "wiki_result_click", category: "suggestion", label: `${r.pageId}:${r.title}` });
                      }}
                      sx={{
                        "&:hover": { backgroundColor: COLORS.background.darkText },
                      }}
                    >
                      {r.thumbnail && (
                        <Box sx={{ mr: 2 }}>
                          <img src={r.thumbnail} alt={r.title} width={40} height={40} style={{ borderRadius: 6 }} />
                        </Box>
                      )}
                      <ListItemText
                        primary={r.title}
                        secondary={r.pageId}
                        primaryTypographyProps={{ color: COLORS.text.primary }}
                        secondaryTypographyProps={{ color: COLORS.text.muted }}
                      />
                    </ListItemButton>
                  </ListItem>
                ))}
              </List>
            )}
          </Paper>
        )}

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
