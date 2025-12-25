import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getCelebrityById, getCelebrityBySlug } from "@/app/actions/celebrities";
import { ClientCelebrityCard } from "./ClientCelebrityCard";

export const dynamic = "force-dynamic";

// UUID v4 regex pattern
const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export default async function CelebrityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  
  // Determine if the id is a UUID or a slug
  const isUuid = UUID_REGEX.test(id);
  const celeb = isUuid ? await getCelebrityById(id) : await getCelebrityBySlug(id);

  if (!celeb) {
    notFound();
  }

  return (
    <Container maxWidth="sm" sx={{ py: { xs: 4, md: 6 } }}>
      <Box sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
        <Box sx={{ textAlign: "center" }}>
          <Typography
            variant="h3"
            sx={{
              fontWeight: 800,
              mb: 1.5,
              fontSize: { xs: "2rem", md: "2.5rem" },
              background: "linear-gradient(135deg, #1DB6A8 0%, #EF476F 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              letterSpacing: "-0.02em",
            }}
          >
            {celeb.name}
          </Typography>
          <Typography
            variant="body1"
            sx={{
              color: "rgba(248, 249, 250, 0.75)",
              fontWeight: 500,
            }}
          >
            Celebrity Profile
          </Typography>
        </Box>

        <ClientCelebrityCard celebrity={celeb} />
      </Box>
    </Container>
  );
}
