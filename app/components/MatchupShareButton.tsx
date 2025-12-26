"use client";

import { useState } from "react";
import {
  Button,
  IconButton,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import ShareIcon from "@mui/icons-material/Share";
import FileDownloadIcon from "@mui/icons-material/FileDownload";
import { Celebrity } from "@/types/celebrity";
import {
  drawMatchupCanvas,
  downloadMatchupImage,
  shareMatchupImage,
} from "@/lib/canvasMatchup";
import { event as gaEvent } from "@/lib/gtag";

interface MatchupShareButtonProps {
  celebA: Celebrity;
  celebB: Celebrity;
  imgA?: string | null;
  imgB?: string | null;
  variant?: "icon" | "button";
}

export function MatchupShareButton({
  celebA,
  celebB,
  imgA,
  imgB,
  variant = "icon",
}: MatchupShareButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showDialog, setShowDialog] = useState(false);
  const [generatedBlob, setGeneratedBlob] = useState<Blob | null>(null);

  const handleGenerateAndShare = async () => {
    setLoading(true);
    setError(null);

    try {
      const celebAWithImg = { ...celebA, imgSrc: imgA ?? undefined };
      const celebBWithImg = { ...celebB, imgSrc: imgB ?? undefined };
      
      console.log("Generating matchup canvas...", {
        celebA: celebA.name,
        celebB: celebB.name,
        imgA: imgA ? "loaded" : "missing",
        imgB: imgB ? "loaded" : "missing",
      });
      gaEvent({ action: "share_generate", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
      
      const blob = await drawMatchupCanvas(celebAWithImg, celebBWithImg, {
        includeNames: true,
        includeStats: true,
      });

      console.log("Canvas generated, blob size:", blob.size);
      setGeneratedBlob(blob);
      setShowDialog(true);
      gaEvent({ action: "share_dialog_open", category: "share", label: `${celebA.name}-vs-${celebB.name}` });

      // Auto-share if Web Share API is available
      // @ts-ignore - navigator.share is optional API not yet in all TS types
      if (typeof navigator !== "undefined" && navigator.share) {
        try {
          gaEvent({ action: "share_attempt", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
          await shareMatchupImage(blob, celebA, celebB);
          gaEvent({ action: "share_success", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
        } catch (err) {
          // User cancelled or share failed, dialog is already open
          console.log("Share cancelled or failed:", err);
          gaEvent({ action: "share_fail", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
        }
      }
    } catch (err) {
      console.error("Share generation error:", err);
      setError(
        err instanceof Error ? err.message : "Failed to generate image"
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async () => {
    if (generatedBlob) {
      await downloadMatchupImage(
        generatedBlob,
        `matchup-${celebA.name}-vs-${celebB.name}.jpg`
      );
      gaEvent({ action: "share_download", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
      setShowDialog(false);
    }
  };

  const handleShare = async () => {
    if (generatedBlob) {
      try {
        gaEvent({ action: "share_attempt", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
        await shareMatchupImage(generatedBlob, celebA, celebB);
        gaEvent({ action: "share_success", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
      } catch (err) {
        gaEvent({ action: "share_fail", category: "share", label: `${celebA.name}-vs-${celebB.name}` });
        setError(
          err instanceof Error ? err.message : "Failed to share image"
        );
      }
    }
  };

  const button = (
    <Button
      onClick={handleGenerateAndShare}
      disabled={loading}
      startIcon={
        loading ? (
          <CircularProgress size={20} />
        ) : (
          <ShareIcon />
        )
      }
      variant={variant === "button" ? "contained" : "text"}
      size={variant === "button" ? "medium" : "small"}
      fullWidth={variant === "button"}
      sx={{
        color: variant === "icon" ? "inherit" : undefined,
        "&:disabled": {
          color: "action.disabled",
        },
      }}
      title="Share this matchup"
    >
      {variant === "button" && "Share Matchup"}
    </Button>
  );

  if (variant === "icon") {
    return (
      <>
        <IconButton
          onClick={handleGenerateAndShare}
          disabled={loading}
          size="small"
          sx={{
            color: "rgba(255, 255, 255, 0.7)",
            "&:hover": {
              color: "rgba(255, 255, 255, 1)",
            },
          }}
          title="Share this matchup"
        >
          {loading ? <CircularProgress size={20} /> : <ShareIcon />}
        </IconButton>

        <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
          <DialogTitle>Share Matchup</DialogTitle>
          <DialogContent sx={{ minWidth: 400 }}>
            {generatedBlob && (
              <img
                src={URL.createObjectURL(generatedBlob)}
                alt="Matchup preview"
                style={{ width: "100%", borderRadius: 8, marginTop: 16 }}
              />
            )}
            {error && (
              <div style={{ color: "red", marginTop: 16 }}>{error}</div>
            )}
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setShowDialog(false)}>Close</Button>
            <Button
              onClick={handleDownload}
              startIcon={<FileDownloadIcon />}
              variant="contained"
            >
              Download
            </Button>
            <Button
              onClick={handleShare}
              startIcon={<ShareIcon />}
              variant="contained"
              color="primary"
            >
              Share
            </Button>
          </DialogActions>
        </Dialog>
      </>
    );
  }

  return (
    <>
      {button}
      <Dialog open={showDialog} onClose={() => setShowDialog(false)}>
        <DialogTitle>Share Matchup</DialogTitle>
        <DialogContent sx={{ minWidth: 400 }}>
          {generatedBlob && (
            <img
              src={URL.createObjectURL(generatedBlob)}
              alt="Matchup preview"
              style={{ width: "100%", borderRadius: 8, marginTop: 16 }}
            />
          )}
          {error && (
            <div style={{ color: "red", marginTop: 16 }}>{error}</div>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setShowDialog(false)}>Close</Button>
          <Button
            onClick={handleDownload}
            startIcon={<FileDownloadIcon />}
            variant="contained"
          >
            Download
          </Button>
          <Button
            onClick={handleShare}
            startIcon={<ShareIcon />}
            variant="contained"
            color="primary"
          >
            Share
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
