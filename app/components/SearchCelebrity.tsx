"use client";

import { useState } from "react";
import {
  Box,
  TextField,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  CircularProgress,
  Typography,
  Paper,
  Alert,
} from "@mui/material";
import Link from "next/link";
import { type Celebrity } from "@/types/celebrity";
import { searchCelebrities } from "../actions/celebrities";
import { COLORS } from "@/lib/theme";

interface SearchCelebrityProps {
  onNoResults?: () => void;
}

export default function SearchCelebrity({ onNoResults }: SearchCelebrityProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [results, setResults] = useState<Celebrity[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasSearched, setHasSearched] = useState(false);

  const handleSearch = async (term: string) => {
    setSearchTerm(term);
    setHasSearched(false);
    
    if (term.trim().length < 2) {
      setResults([]);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const searchResults = await searchCelebrities({ searchTerm: term });
      setResults(searchResults);
      setHasSearched(true);
      
      if (searchResults.length === 0 && onNoResults) {
        onNoResults();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
      setResults([]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <TextField
        fullWidth
        label="Search for a celebrity"
        placeholder="e.g., Leonardo DiCaprio"
        value={searchTerm}
        onChange={(e) => handleSearch(e.target.value)}
        variant="outlined"
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

      {loading && (
        <Box display="flex" justifyContent="center" py={4}>
          <CircularProgress sx={{ color: COLORS.primary }} />
        </Box>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {!loading && hasSearched && results.length === 0 && searchTerm.trim().length >= 2 && (
        <Paper
          elevation={0}
          sx={{
            p: 3,
            textAlign: "center",
            backgroundColor: COLORS.background.dark,
            border: `1px solid ${COLORS.border.light}`,
          }}
        >
          <Typography variant="body1" sx={{ color: COLORS.text.secondary }}>
            No celebrities found matching &quot;{searchTerm}&quot;
          </Typography>
          <Typography variant="body2" sx={{ color: COLORS.text.muted, mt: 1 }}>
            Try a different search or suggest this celebrity below
          </Typography>
        </Paper>
      )}

      {results.length > 0 && (
        <Paper
          elevation={0}
          sx={{
            border: `1px solid ${COLORS.border.light}`,
            backgroundColor: COLORS.background.dark,
          }}
        >
          <List disablePadding>
            {results.map((celebrity, index) => (
              <ListItem
                key={celebrity.id}
                disablePadding
                divider={index < results.length - 1}
              >
                <ListItemButton
                  component={Link}
                  href={`/celeb/${celebrity.id}`}
                  sx={{
                    "&:hover": {
                      backgroundColor: COLORS.background.darkText,
                    },
                  }}
                >
                  <ListItemText
                    primary={celebrity.name}
                    secondary={`ELO: ${celebrity.elo ?? 1000} • ${celebrity.matches ?? 0} matches`}
                    primaryTypographyProps={{
                      fontWeight: 500,
                      color: COLORS.text.primary,
                    }}
                    secondaryTypographyProps={{
                      color: COLORS.text.secondary,
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Paper>
      )}
    </Box>
  );
}
