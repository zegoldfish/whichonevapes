/**
 * Theme constants for the application
 * Colors, gradients, and reusable design tokens
 */

// Background gradients
export const GRADIENTS = {
  // Photo section
  photoSection:
    "radial-gradient(circle at 20% 20%, rgba(29, 182, 168, 0.12), transparent 40%), " +
    "radial-gradient(circle at 80% 0%, rgba(239, 71, 111, 0.12), transparent 35%), " +
    "#0c1220",

  // Card backgrounds
  card: "linear-gradient(145deg, rgba(255,255,255,0.04), rgba(255,255,255,0.02))",

  // Image overlays
  imageOverlay:
    "linear-gradient(180deg, rgba(5,8,15,0) 0%, rgba(5,8,15,0.15) 35%, rgba(5,8,15,0.85) 100%)",

  // Badge/chip gradients
  confirmedVaper: "linear-gradient(135deg, #1DB6A8, #0FB17A)",
  likelyVaper: "linear-gradient(135deg, #F7C948, #F2A541)",

  // Button gradients
  primaryButton: "linear-gradient(135deg, #1DB6A8 0%, #0FB17A 100%)",
  primaryButtonHover: "linear-gradient(135deg, #1ED9C5 0%, #14C48D 100%)",
};

// Color palette
export const COLORS = {
  primary: {
    main: "#1DB6A8",
    light: "#1ED9C5",
    dark: "#0FB17A",
  },
  accent: {
    main: "#EF476F",
    light: "#F5647D",
  },
  warning: {
    main: "#F7C948",
    light: "#F2A541",
  },
  background: {
    dark: "#0c1220",
    overlay: "rgba(0, 0, 0, 0.25)",
  },
  text: {
    primary: "rgba(248, 249, 250, 0.85)",
    secondary: "rgba(248, 249, 250, 0.75)",
    muted: "rgba(248, 249, 250, 0.65)",
  },
  border: {
    light: "rgba(255,255,255,0.08)",
    lighter: "rgba(255,255,255,0.06)",
  },
};
