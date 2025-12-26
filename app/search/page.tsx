"use client";

import { useState } from "react";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import SearchCelebrity from "../components/SearchCelebrity";
import CelebritySuggestionForm from "../components/CelebritySuggestionForm";
import UnapprovedCelebritiesTable from "../components/UnapprovedCelebritiesTable";
import { COLORS } from "@/lib/theme";

export default function SearchPage() {
  const [showSuggestionForm, setShowSuggestionForm] = useState(false);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography
          variant="h3"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 700,
            color: COLORS.text.primary,
            fontSize: { xs: "2rem", md: "3rem" },
          }}
        >
          Find a Celebrity
        </Typography>
        <Typography variant="body1" sx={{ color: COLORS.text.secondary }}>
          Search for celebrities to view their vaping status and statistics.
        </Typography>
      </Box>

      <SearchCelebrity onNoResults={() => setShowSuggestionForm(true)} />

      <Divider sx={{ my: 4, borderColor: COLORS.border.light }} />

      <CelebritySuggestionForm />

      <Box sx={{ mt: 4 }}>
        <UnapprovedCelebritiesTable />
      </Box>
    </Container>
  );
}
