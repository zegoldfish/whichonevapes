import { getAllCelebrities } from "@/app/actions/celebrities";
import Link from "next/link";
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
  const requestedPage = Number(params.page) || 1;
  const totalPages = Math.ceil(celebrities.length / ITEMS_PER_PAGE);
  // Clamp currentPage to valid range [1, totalPages]
  const currentPage = Math.max(1, Math.min(requestedPage, totalPages));
  const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
  const endIndex = startIndex + ITEMS_PER_PAGE;
  const paginatedCelebrities = celebrities.slice(startIndex, endIndex);

  return (
    <Container maxWidth="lg" sx={{ py: 6 }}>
      <Box
        sx={{
          mb: 6,
          textAlign: "center",
          animation: "fadeIn 0.8s ease-out",
          "@keyframes fadeIn": {
            from: { opacity: 0, transform: "translateY(-20px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Typography
          variant="h2"
          component="h1"
          gutterBottom
          sx={{
            fontWeight: 800,
            fontSize: { xs: "2.5rem", md: "3.5rem" },
            background: "linear-gradient(135deg, #7B2CBF 0%, #C71585 50%, #FF006E 100%)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            letterSpacing: "-0.02em",
          }}
        >
          Rankings
        </Typography>
        <Typography
          variant="h6"
          sx={{
            color: "rgba(248, 249, 250, 0.7)",
            fontWeight: 300,
            letterSpacing: "0.05em",
          }}
        >
          Top celebrities by ELO rating • {celebrities.length} total
        </Typography>
      </Box>

      <TableContainer
        component={Paper}
        sx={{
          background: "rgba(255, 255, 255, 0.03)",
          backdropFilter: "blur(10px)",
          border: "1px solid rgba(255, 255, 255, 0.1)",
          borderRadius: 3,
          overflow: "hidden",
          boxShadow: "0 8px 32px rgba(0, 0, 0, 0.3)",
          animation: "slideUp 0.6s ease-out",
          "@keyframes slideUp": {
            from: { opacity: 0, transform: "translateY(30px)" },
            to: { opacity: 1, transform: "translateY(0)" },
          },
        }}
      >
        <Table>
          <TableHead>
            <TableRow
              sx={{
                background: "linear-gradient(135deg, rgba(123, 44, 191, 0.2) 0%, rgba(199, 21, 133, 0.2) 100%)",
                borderBottom: "2px solid rgba(123, 44, 191, 0.5)",
              }}
            >
              <TableCell
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                  py: 2,
                }}
              >
                Rank
              </TableCell>
              <TableCell
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Name
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                ELO Rating
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Wins
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Matches
              </TableCell>
              <TableCell
                align="right"
                sx={{
                  color: "var(--text)",
                  fontWeight: 800,
                  fontSize: "0.9rem",
                  textTransform: "uppercase",
                  letterSpacing: "0.1em",
                }}
              >
                Win Rate
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {paginatedCelebrities.map((celeb, index) => {
              const globalRank = startIndex + index + 1;
              const isTopThree = globalRank <= 3;
              const medals = ['🥇', '🥈', '🥉'];
              
              return (
                <TableRow
                  key={celeb.id}
                  sx={{
                    transition: "all 0.3s ease",
                    "&:hover": {
                      backgroundColor: "rgba(123, 44, 191, 0.1)",
                      transform: "scale(1.01)",
                    },
                    borderBottom: "1px solid rgba(255,255,255,0.05)",
                    background: isTopThree
                      ? "linear-gradient(90deg, rgba(123, 44, 191, 0.15), transparent)"
                      : "transparent",
                  }}
                >
                  <TableCell
                    sx={{
                      color: "var(--text)",
                      fontWeight: 700,
                      fontSize: isTopThree ? "1.2rem" : "1rem",
                      py: 2,
                    }}
                  >
                    {isTopThree ? medals[globalRank - 1] : globalRank}
                  </TableCell>
                  <TableCell
                    sx={{
                      color: "var(--text)",
                      fontWeight: isTopThree ? 700 : 400,
                      fontSize: isTopThree ? "1.1rem" : "1rem",
                    }}
                  >
                    <Box sx={{ display: "flex", alignItems: "center", gap: 1.25 }}>
                      <Link
                        href={`/celeb/${celeb.id}`}
                        style={{
                          color: "var(--text)",
                          textDecoration: "none",
                          fontWeight: isTopThree ? 700 : 400,
                        }}
                      >
                        {celeb.name}
                      </Link>
                      {Boolean((celeb as any).confirmedVaper) && (
                        <Box
                          component="span"
                          sx={{
                            px: 1,
                            py: 0.25,
                            borderRadius: 999,
                            fontSize: "0.7rem",
                            fontWeight: 700,
                            color: "white",
                            background: "linear-gradient(135deg, #7B2CBF 0%, #FF006E 100%)",
                            boxShadow: "0 4px 12px rgba(199, 21, 133, 0.35)",
                          }}
                        >
                          Confirmed
                        </Box>
                      )}
                    </Box>
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: isTopThree ? "var(--primary)" : "var(--text)",
                      fontWeight: 700,
                      fontSize: isTopThree ? "1.1rem" : "1rem",
                    }}
                  >
                    {(celeb.elo ?? 1000).toFixed(0)}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "rgba(248, 249, 250, 0.8)",
                      fontWeight: 500,
                    }}
                  >
                    {celeb.wins ?? 0}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "rgba(248, 249, 250, 0.8)",
                      fontWeight: 500,
                    }}
                  >
                    {celeb.matches ?? 0}
                  </TableCell>
                  <TableCell
                    align="right"
                    sx={{
                      color: "var(--secondary)",
                      fontWeight: 600,
                    }}
                  >
                    {celeb.matches && celeb.matches > 0
                      ? ((((celeb.wins ?? 0) / celeb.matches) * 100).toFixed(1) + "%")
                      : "N/A"}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      <RankingsPagination totalPages={totalPages} currentPage={currentPage} />
    </Container>
  );
}
