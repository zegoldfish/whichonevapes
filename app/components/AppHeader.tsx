"use client";

import { useState } from "react";
import Link from "next/link";
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Stack,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  Box,
  useMediaQuery,
  useTheme,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import CloseIcon from "@mui/icons-material/Close";
import { event as gaEvent } from "@/lib/gtag";

export function AppHeader() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down("md"));

  const navLinks = [
    { href: "/", label: "Play" },
    { href: "/search", label: "Search" },
    { href: "/rankings", label: "Rankings" },
    { href: "/matchups", label: "Matchups" },
    { href: "/about", label: "About" },
  ];

  const toggleMobileMenu = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  return (
    <>
      <AppBar
        position="static"
        color="transparent"
        elevation={0}
        sx={{
          borderBottom: "1px solid rgba(255,255,255,0.08)",
          backdropFilter: "blur(20px)",
          backgroundColor: "rgba(10, 17, 40, 0.7)",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.1)",
        }}
      >
        <Toolbar sx={{ display: "flex", gap: 2, py: 1 }}>
          <Typography
            component={Link}
            href="/"
            variant="h6"
            sx={{
              flexGrow: 1,
              color: "var(--text)",
              textDecoration: "none",
              fontWeight: 800,
              letterSpacing: 0.5,
              fontSize: { xs: "1rem", sm: "1.25rem" },
              background: "linear-gradient(135deg, #F8F9FA 0%, #7B2CBF 100%)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
              transition: "all 0.3s ease",
              "&:hover": {
                transform: "translateY(-2px)",
                filter: "brightness(1.2)",
              },
            }}
          >
            Which One Vapes
          </Typography>

          {/* Desktop Navigation */}
          {!isMobile && (
            <Stack direction="row" spacing={2} alignItems="center">
              {navLinks.map((link) => (
                <Button
                  key={link.href}
                  component={Link}
                  href={link.href}
                  onClick={() => gaEvent({ action: "nav_click", category: "navigation", label: link.href })}
                  variant="text"
                  sx={{
                    color: "var(--text)",
                    fontWeight: 600,
                    textTransform: "none",
                    px: 2,
                    py: 1,
                    borderRadius: 2,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "rgba(123, 44, 191, 0.15)",
                      transform: "translateY(-2px)",
                    },
                  }}
                >
                  {link.label}
                </Button>
              ))}
            </Stack>
          )}

          {/* Mobile Menu Button */}
          {isMobile && (
            <IconButton
              edge="end"
              color="inherit"
              onClick={toggleMobileMenu}
              sx={{
                color: "var(--text)",
              }}
            >
              <MenuIcon />
            </IconButton>
          )}
        </Toolbar>
      </AppBar>

      {/* Mobile Drawer */}
      <Drawer
        anchor="right"
        open={mobileMenuOpen}
        onClose={toggleMobileMenu}
        sx={{
          "& .MuiDrawer-paper": {
            width: 280,
            background: "rgba(10, 17, 40, 0.98)",
            backdropFilter: "blur(20px)",
            borderLeft: "1px solid rgba(255, 255, 255, 0.1)",
          },
        }}
      >
        <Box sx={{ p: 2 }}>
          <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
            <IconButton onClick={toggleMobileMenu} sx={{ color: "var(--text)" }}>
              <CloseIcon />
            </IconButton>
          </Box>
          <List>
            {navLinks.map((link) => (
              <ListItem key={link.href} disablePadding>
                <ListItemButton
                  component={Link}
                  href={link.href}
                  onClick={toggleMobileMenu}
                  onMouseDown={() => gaEvent({ action: "nav_click", category: "navigation", label: link.href })}
                  sx={{
                    borderRadius: 2,
                    mb: 1,
                    transition: "all 0.3s ease",
                    "&:hover": {
                      background: "rgba(123, 44, 191, 0.2)",
                    },
                  }}
                >
                  <ListItemText
                    primary={link.label}
                    sx={{
                      "& .MuiListItemText-primary": {
                        color: "var(--text)",
                        fontWeight: 600,
                        fontSize: "1.1rem",
                      },
                    }}
                  />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>
    </>
  );
}
