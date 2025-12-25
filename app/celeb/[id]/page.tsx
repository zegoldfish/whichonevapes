import { notFound } from "next/navigation";
import Container from "@mui/material/Container";
import Box from "@mui/material/Box";
import Typography from "@mui/material/Typography";
import { getCelebrityById } from "@/app/actions/celebrities";
import { ClientCelebrityCard } from "./ClientCelebrityCard";

export const dynamic = "force-dynamic";

export default async function CelebrityPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const celeb = await getCelebrityById(id);

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
