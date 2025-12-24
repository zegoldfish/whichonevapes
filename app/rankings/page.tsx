import { getAllCelebrities } from "@/app/actions/celebrities";
import {
  Container,
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Typography,
  Pagination,
} from "@mui/material";
import RankingsPagination from "@/app/components/RankingsPagination";

const ITEMS_PER_PAGE = 50;

export default async function RankingsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const celebrities = await getAllCelebrities();
  const params = await searchParams;
  const currentPage = Number(params.page) || 1;
  const totalPages = Math.ceil(celebrities.length / ITEMS_PER_PAGE);
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCelebrities = celebrities.slice(startIndex, endIndex);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Box sx={{ mb: 4 }}>
        <Typography variant="h4" component="h1" gutterBottom>
          Rankings
        </Typography>
        <Typography variant="body1" sx={{ color: "var(--text)", opacity: 0.7 }}>
          Top celebrities by ELO rating ({celebrities.length} total)
        </Typography>
      </Box>

      <TableContainer component={Paper} sx={{ backgroundColor: "rgba(0,0,0,0.2)" }}>
        <Table>
          <TableHead>
            <TableRow sx={{ backgroundColor: "rgba(255,255,255,0.05)" }}>
              <TableCell sx={{ color: "var(--text)", fontWeight: 700 }}>Rank</TableCell>
              <TableCell sx={{ color: "var(--text)", fontWeight: 700 }}>Name</TableCell>
              <TableCell align="right" sx={{ color: "var(--text)", fontWeight: 700 }}>
                ELO Rating
              </TableCell>
              <TableCell align="right" sx={{ color: "var(--text)", fontWeight: 700 }}>
                Wins
              </TableCell>
              <TableCell align="right" sx={{ color: "var(--text)", fontWeight: 700 }}>
                Matches
              </TableCell>
              <TableCell align="right" sx={{ color: "var(--text)", fontWeight: 700 }}>
                Win Rate
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCelebrities.map((celeb, index) => (
              <TableRow
                key={celeb.id}
                sx={{
                  "&:hover": { backgroundColor: "rgba(255,255,255,0.05)" },
                  borderBottom: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <TableCell sx={{ color: "var(--text)" }}>{startIndex + index + 1}</TableCell>
                <TableCell sx={{ color: "var(--text)" }}>{celeb.name}</TableCell>
                <TableCell align="right" sx={{ color: "var(--text)", fontWeight: 600 }}>
                  {(celeb.elo ?? 1000).toFixed(0)}
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {celeb.wins ?? 0}
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {celeb.matches ?? 0}
                </TableCell>
                <TableCell align="right" sx={{ color: "var(--text)" }}>
                  {celeb.matches && celeb.matches > 0
                    ? ((((celeb.wins ?? 0) / celeb.matches) * 100).toFixed(1) + "%")
                    : "N/A"}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <RankingsPagination totalPages={totalPages} currentPage={currentPage} />
    </Container>
  );
}
