"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { Pagination, Box } from "@mui/material";

interface RankingsPaginationProps {
  totalPages: number;
  currentPage: number;
}

export default function RankingsPagination({
  totalPages,
  currentPage,
}: RankingsPaginationProps) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = (_event: React.ChangeEvent<unknown>, page: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", page.toString());
    router.push(`/rankings?${params.toString()}`);
  };

  return (
    <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
      <Pagination
        count={totalPages}
        page={currentPage}
        onChange={handlePageChange}
        color="primary"
        size="large"
        sx={{
          "& .MuiPaginationItem-root": {
            color: "var(--text)",
          },
        }}
      />
    </Box>
  );
}
