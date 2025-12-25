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
    <Container maxWidth="sm" sx={{ py: 6 }}>
      <Box sx={{ textAlign: "center", mb: 4 }}>
        <Typography
          variant="h4"
          sx={{
            fontWeight: 800,
            mb: 1,
            background: "linear-gradient(135deg, #7B2CBF 0%, #C71585 50%, #FF006E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {celeb.name}
        </Typography>
      </Box>

      <ClientCelebrityCard celebrity={celeb} />
    </Container>
  );
}
