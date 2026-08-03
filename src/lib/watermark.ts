import { format } from "date-fns";
import { id } from "date-fns/locale";

export type WatermarkPosition = "bottom-right" | "bottom-left";

/**
 * Reliably parses activity date (YYYY-MM-DD) and activity time (HH:mm) into a Date object.
 */
export function parseActivityDateTime(dateStr?: string, timeStr?: string): Date {
  if (!dateStr) return new Date();

  const dateMatch = dateStr.match(/(\d{4})-(\d{2})-(\d{2})/);
  const timeMatch = (timeStr || "00:00").match(/(\d{2}):(\d{2})/);

  if (dateMatch) {
    const year = parseInt(dateMatch[1], 10);
    const month = parseInt(dateMatch[2], 10) - 1;
    const day = parseInt(dateMatch[3], 10);

    const hours = timeMatch ? parseInt(timeMatch[1], 10) : 0;
    const minutes = timeMatch ? parseInt(timeMatch[2], 10) : 0;

    const d = new Date(year, month, day, hours, minutes, 0);
    if (!isNaN(d.getTime())) {
      return d;
    }
  }

  const tryParse = new Date(dateStr);
  if (!isNaN(tryParse.getTime())) {
    if (timeMatch) {
      tryParse.setHours(parseInt(timeMatch[1], 10), parseInt(timeMatch[2], 10), 0);
    }
    return tryParse;
  }

  return new Date();
}

/**
 * Automatically applies an authentic timestamp watermark stamp onto an image file
 * using HTML5 Canvas.
 */
export async function applyWatermark(
  file: File,
  customDate: Date = new Date(),
  position: WatermarkPosition = "bottom-right"
): Promise<File> {
  return new Promise((resolve) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);

      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      if (!ctx) {
        return resolve(file);
      }

      const width = img.width;
      const height = img.height;
      canvas.width = width;
      canvas.height = height;

      // 1. Draw original photo onto canvas
      ctx.drawImage(img, 0, 0, width, height);

      // 2. Calculate responsive dimensions relative to photo size (Compact & Sleek)
      const scale = Math.max(width, height) / 1200;
      const padding = Math.max(10 * scale, 12);
      const fontSizeHeader = Math.max(9.5 * scale, 11);
      const fontSizeTime = Math.max(13 * scale, 14);
      const boxPaddingX = Math.max(12 * scale, 14);
      const boxPaddingY = Math.max(8 * scale, 10);

      // Formatted date string
      const dateFormatted = format(customDate, "dd MMM yyyy • HH:mm:ss 'WIB'", { locale: id }).toUpperCase();
      const headerText = "WAMS • VERIFIED BY SYSTEM";

      // Set fonts for text width measurement
      ctx.font = `bold ${fontSizeHeader}px sans-serif`;
      const headerWidth = ctx.measureText(headerText).width;

      ctx.font = `bold ${fontSizeTime}px monospace`;
      const timeWidth = ctx.measureText(dateFormatted).width;

      const badgeWidth = Math.max(headerWidth, timeWidth) + boxPaddingX * 2;
      const badgeHeight = fontSizeHeader + fontSizeTime + boxPaddingY * 2 + 8 * scale;

      // Position logic (bottom-right vs bottom-left)
      const posX = position === "bottom-left" ? padding : width - badgeWidth - padding;
      const posY = height - badgeHeight - padding;

      // 3. Draw dark glassmorphic rounded background badge
      const radius = 8 * scale;
      ctx.save();
      ctx.fillStyle = "rgba(15, 23, 42, 0.88)"; // Deep slate dark backdrop
      ctx.shadowColor = "rgba(0, 0, 0, 0.6)";
      ctx.shadowBlur = 12 * scale;

      ctx.beginPath();
      if (typeof ctx.roundRect === "function") {
        ctx.roundRect(posX, posY, badgeWidth, badgeHeight, radius);
      } else {
        ctx.rect(posX, posY, badgeWidth, badgeHeight);
      }
      ctx.fill();

      // Cyan border outline
      ctx.strokeStyle = "rgba(56, 189, 248, 0.4)";
      ctx.lineWidth = 1.5 * scale;
      ctx.stroke();
      ctx.restore();

      // 4. Draw Header Text
      ctx.fillStyle = "#38bdf8"; // Sky blue accent
      ctx.font = `bold ${fontSizeHeader}px sans-serif`;
      ctx.fillText(headerText, posX + boxPaddingX, posY + boxPaddingY + fontSizeHeader);

      // 5. Draw Timestamp Text
      ctx.fillStyle = "#ffffff";
      ctx.font = `bold ${fontSizeTime}px monospace`;
      ctx.fillText(
        dateFormatted,
        posX + boxPaddingX,
        posY + boxPaddingY + fontSizeHeader + 8 * scale + fontSizeTime
      );

      // 6. Convert canvas back to Blob & File
      const mimeType = file.type === "image/png" ? "image/png" : "image/jpeg";
      canvas.toBlob(
        (blob) => {
          if (!blob) return resolve(file);
          const watermarkedFile = new File([blob], file.name, {
            type: mimeType,
            lastModified: Date.now(),
          });
          resolve(watermarkedFile);
        },
        mimeType,
        0.92
      );
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      resolve(file);
    };

    img.src = url;
  });
}

/**
 * Generates standardized image download file name: [user]-[date]-[project]-[module]-[time].[ext]
 */
export function formatImageDownloadName({
  userName,
  date,
  projectName,
  moduleName,
  time,
  originalName = "image.jpg",
}: {
  userName?: string;
  date?: string;
  projectName?: string;
  moduleName?: string;
  time?: string;
  originalName?: string;
}): string {
  const cleanStr = (s?: string, fallback: string = "") =>
    (s || fallback)
      .trim()
      .toLowerCase()
      .replace(/[\s_]+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "") || fallback;

  const u = cleanStr(userName, "user");
  const d = (date || new Date().toISOString().slice(0, 10)).trim();
  const p = cleanStr(projectName, "proyek");
  const m = cleanStr(moduleName, "modul");
  const t = (time || "0000").replace(/[^0-9]/g, "").slice(0, 4) || "0000";

  const ext = originalName.includes(".") ? originalName.split(".").pop() || "jpg" : "jpg";
  return `${u}-${d}-${p}-${m}-${t}.${ext}`;
}

/**
 * Fetches an existing image URL, stamps the authentic watermark onto an HTML5 canvas,
 * and triggers a browser file download of the watermarked image file.
 */
export async function downloadWatermarkedImage(
  url: string,
  fileName: string = "activity_evidence.jpg",
  customDate: Date = new Date()
): Promise<void> {
  try {
    const res = await fetch(url);
    const blob = await res.blob();
    const file = new File([blob], fileName, { type: blob.type || "image/jpeg" });
    const watermarkedFile = await applyWatermark(file, customDate);

    const watermarkedUrl = URL.createObjectURL(watermarkedFile);
    const a = document.createElement("a");
    a.href = watermarkedUrl;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(watermarkedUrl);
  } catch (err) {
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.target = "_blank";
    a.click();
  }
}
