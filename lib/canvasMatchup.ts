/**
 * Canvas utilities for drawing and sharing celebrity matchups
 */

import { Celebrity } from "@/types/celebrity";

export interface MatchupCanvasOptions {
  width?: number;
  height?: number;
  includeNames?: boolean;
  includeStats?: boolean;
}

/**
 * Draw a matchup on canvas with two celebrities side by side
 * Returns a Promise that resolves when the image is ready to share
 */
export async function drawMatchupCanvas(
  celebA: Celebrity & { imgSrc?: string | null },
  celebB: Celebrity & { imgSrc?: string | null },
  options: MatchupCanvasOptions = {}
): Promise<Blob> {
  const width = options.width ?? 1200;
  const height = options.height ?? 630; // Standard OG image size
  const includeNames = options.includeNames !== false;
  const includeStats = options.includeStats !== false;

  // Use regular Canvas if OffscreenCanvas is not available
  let canvas: any;
  if (typeof OffscreenCanvas !== "undefined") {
    canvas = new OffscreenCanvas(width, height);
  } else {
    // Fallback for browsers without OffscreenCanvas
    const htmlCanvas = document.createElement("canvas");
    htmlCanvas.width = width;
    htmlCanvas.height = height;
    canvas = htmlCanvas;
  }
  
  const ctx = canvas.getContext("2d");
  
  if (!ctx) {
    throw new Error("Failed to get canvas context");
  }

  // Background gradient (dark theme matching the app)
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, "#0a0e27");
  gradient.addColorStop(1, "#1a1f3a");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);

  // Draw divider line in the middle
  ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(width / 2, 0);
  ctx.lineTo(width / 2, height);
  ctx.stroke();

  // Image dimensions
  const imgWidth = (width / 2) - 40;
  const imgHeight = height - (includeNames ? 200 : 100);
  const imgY = 50;

  // Load and draw images
  const imgPromises = [];

  // Left image
  if (celebA.imgSrc) {
    imgPromises.push(
      drawImageOnCanvas(
        ctx,
        celebA.imgSrc,
        20,
        imgY,
        imgWidth,
        imgHeight
      ).catch((err) => {
        console.warn(`Failed to load image for ${celebA.name}:`, err);
      })
    );
  }

  // Right image
  if (celebB.imgSrc) {
    imgPromises.push(
      drawImageOnCanvas(
        ctx,
        celebB.imgSrc,
        width / 2 + 20,
        imgY,
        imgWidth,
        imgHeight
      ).catch((err) => {
        console.warn(`Failed to load image for ${celebB.name}:`, err);
      })
    );
  }

  await Promise.all(imgPromises);

  // Draw names
  if (includeNames) {
    ctx.fillStyle = "#fff";
    ctx.font = "bold 32px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";

    const nameY = height - 120;
    ctx.fillText(celebA.name, width / 4, nameY);
    ctx.fillText(celebB.name, (3 * width) / 4, nameY);
    
    // Draw ELO stats under each name
    ctx.fillStyle = "rgba(255, 255, 255, 0.8)";
    ctx.font = "18px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    
    const statsY = height - 90;
    
    // Celebrity A stats
    ctx.fillText(`Elo: ${celebA.elo ?? 1000}`, width / 4, statsY);
    
    // Celebrity B stats
    ctx.fillText(`Elo: ${celebB.elo ?? 1000}`, (3 * width) / 4, statsY);
  }

  // Draw "VS" in the middle
  ctx.fillStyle = "rgba(255, 255, 255, 0.7)";
  ctx.font = "bold 48px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
  ctx.textAlign = "center";
  ctx.fillText("vs", width / 2, height / 2 + 20);

  // Draw stats if requested
  if (includeStats) {
    ctx.fillStyle = "rgba(255, 255, 255, 0.5)";
    ctx.font = "14px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.textAlign = "center";
    
    const statsY = height - 30;
    ctx.fillText("Which One Vapes? - whichonevapes.net", width / 2, statsY);
  }

  // Convert canvas to blob
  return new Promise((resolve, reject) => {
    if (canvas.convertToBlob) {
      // OffscreenCanvas
      canvas.convertToBlob({ type: "image/jpeg", quality: 0.9 }).then(resolve).catch(reject);
    } else {
      // Regular HTMLCanvas
      canvas.toBlob(
        (blob: Blob | null) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error("Failed to convert canvas to blob"));
          }
        },
        "image/jpeg",
        0.9
      );
    }
  });
}

/**
 * Helper function to draw an image on canvas
 */
function drawImageOnCanvas(
  ctx: OffscreenCanvasRenderingContext2D,
  imgSrc: string,
  x: number,
  y: number,
  width: number,
  height: number
): Promise<void> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = "anonymous";
    
    // Timeout after 10 seconds
    const timeout = setTimeout(() => {
      reject(new Error(`Image load timeout: ${imgSrc}`));
    }, 10000);
    
    img.onload = () => {
      clearTimeout(timeout);
      try {
        // Calculate dimensions to maintain aspect ratio and fill the box
        const imgAspect = img.width / img.height;
        const boxAspect = width / height;
        
        let drawWidth = width;
        let drawHeight = height;
        let drawX = x;
        let drawY = y;

        if (imgAspect > boxAspect) {
          drawWidth = height * imgAspect;
          drawX = x + (width - drawWidth) / 2;
        } else {
          drawHeight = width / imgAspect;
          drawY = y + (height - drawHeight) / 2;
        }

        // Draw rounded rectangle background for image
        const radius = 12;
        ctx.fillStyle = "rgba(0, 0, 0, 0.5)";
        roundRect(ctx, x, y, width, height, radius);
        ctx.fill();

        // Clip to rounded rectangle and draw image
        ctx.save();
        roundRect(ctx, x, y, width, height, radius);
        ctx.clip();
        ctx.drawImage(img, drawX, drawY, drawWidth, drawHeight);
        ctx.restore();

        // Draw border around image
        ctx.strokeStyle = "rgba(255, 255, 255, 0.2)";
        ctx.lineWidth = 2;
        roundRect(ctx, x, y, width, height, radius);
        ctx.stroke();

        resolve();
      } catch (err) {
        reject(err);
      }
    };

    img.onerror = () => {
      clearTimeout(timeout);
      reject(new Error(`Failed to load image: ${imgSrc}`));
    };

    img.src = imgSrc;
  });
}

/**
 * Helper to draw rounded rectangles on canvas
 */
function roundRect(
  ctx: OffscreenCanvasRenderingContext2D,
  x: number,
  y: number,
  width: number,
  height: number,
  radius: number
) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.lineTo(x + width - radius, y);
  ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
  ctx.lineTo(x + width, y + height - radius);
  ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
  ctx.lineTo(x + radius, y + height);
  ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
  ctx.lineTo(x, y + radius);
  ctx.quadraticCurveTo(x, y, x + radius, y);
  ctx.closePath();
}

/**
 * Download canvas blob as image file
 */
export async function downloadMatchupImage(
  blob: Blob,
  filename: string = "matchup.jpg"
): Promise<void> {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/**
 * Share matchup image using Web Share API or copy to clipboard
 */
export async function shareMatchupImage(
  blob: Blob,
  celebA: Celebrity,
  celebB: Celebrity
): Promise<void> {
  // Try Web Share API first (mobile/modern browsers)
  if (navigator.share) {
    try {
      const file = new File([blob], "matchup.jpg", { type: "image/jpeg" });
      await navigator.share({
        title: "Which One Vapes?",
        text: `Who vapes: ${celebA.name} or ${celebB.name}?`,
        files: [file],
      });
      return;
    } catch (err) {
      console.log("Share API dismissed or failed, trying fallback...");
    }
  }

  // Fallback: Download or copy to clipboard
  const url = URL.createObjectURL(blob);
  
  // Try to copy to clipboard (modern browsers)
  try {
    const response = await fetch(url);
    const data = await response.blob();
    await navigator.clipboard.write([
      new ClipboardItem({ "image/jpeg": data }),
    ]);
  } catch (err) {
    // Ultimate fallback: just download
    downloadMatchupImage(blob, `matchup-${celebA.id}-vs-${celebB.id}.jpg`);
  }

  URL.revokeObjectURL(url);
}
