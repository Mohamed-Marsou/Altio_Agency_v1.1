// =============================================================================
// PICTURE PIPELINE  (server side only: used by the dev API, later by the backend)
// -----------------------------------------------------------------------------
// Every uploaded picture goes through the same steps, so the site stays light:
//   1. the REAL file type is read from the first bytes (a .exe renamed .jpg is refused);
//      only JPEG, PNG, WebP and AVIF are accepted (no SVG: it can hold scripts);
//   2. the size limit is checked (8 MB) and absurdly large pictures are refused;
//   3. the picture is rotated the right way up and ALL metadata is removed
//      (phone photos carry the GPS position of the place where they were taken);
//   4. it is converted to WebP in three widths (480, 960, 1600 px), never enlarged;
//   5. each file is kept under about 150 KB (quality goes down step by step if needed).
// The original file is NOT kept.
// =============================================================================
import { createHash, randomBytes } from "node:crypto";
import sharp from "sharp";
import { MAX_UPLOAD_BYTES, type MediaEntry } from "./schemas";

export const WIDTHS = [480, 960, 1600] as const;
/** Target size of one finished file. */
export const TARGET_BYTES = 150 * 1024;
const MAX_PIXELS = 50_000_000; // refuse "decompression bomb" pictures (about 7000 x 7000)
const QUALITIES = [78, 70, 62, 55, 48];

export class MediaError extends Error {
  constructor(
    public readonly code: "TOO_LARGE" | "BAD_TYPE" | "EMPTY" | "UNREADABLE",
    message: string,
  ) {
    super(message);
  }
}

/** The real type of a picture, from its first bytes (not from the file name). */
export function detectImageType(buffer: Buffer): "jpeg" | "png" | "webp" | "avif" | null {
  if (buffer.length < 12) return null;
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return "jpeg";
  if (buffer.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))) return "png";
  if (buffer.subarray(0, 4).toString("ascii") === "RIFF" && buffer.subarray(8, 12).toString("ascii") === "WEBP") return "webp";
  if (buffer.subarray(4, 8).toString("ascii") === "ftyp" && /^(avif|avis)$/.test(buffer.subarray(8, 12).toString("ascii"))) return "avif";
  return null;
}

export type ProcessedImage = {
  id: string;
  hash: string;
  width: number;
  height: number;
  /** The WebP files to write, one per width. */
  files: { width: number; bytes: number; buffer: Buffer }[];
};

/** Validates and converts an uploaded picture. Throws MediaError for a refused file. */
export async function processImage(input: Buffer): Promise<ProcessedImage> {
  if (input.length === 0) throw new MediaError("EMPTY", "The file is empty.");
  if (input.length > MAX_UPLOAD_BYTES) {
    throw new MediaError("TOO_LARGE", `The file is too large (maximum ${MAX_UPLOAD_BYTES / 1024 / 1024} MB).`);
  }
  if (!detectImageType(input)) {
    throw new MediaError("BAD_TYPE", "Only JPEG, PNG, WebP and AVIF pictures are accepted.");
  }

  let width: number;
  let height: number;
  try {
    // rotate() with no argument applies the camera orientation, so width and height are the displayed ones.
    const meta = await sharp(input, { limitInputPixels: MAX_PIXELS }).rotate().metadata();
    const oriented = (meta.orientation ?? 1) >= 5;
    width = (oriented ? meta.height : meta.width) ?? 0;
    height = (oriented ? meta.width : meta.height) ?? 0;
    if (!width || !height) throw new Error("no size");
  } catch {
    throw new MediaError("UNREADABLE", "This picture could not be read (or it is too many pixels).");
  }

  // Never enlarge: use the standard widths that fit, plus the picture's own width when it is small.
  const widths = [...new Set([...WIDTHS.filter((w) => w < width), Math.min(width, WIDTHS[2])])].sort((a, b) => a - b);

  const files: ProcessedImage["files"] = [];
  for (const target of widths) {
    let buffer = Buffer.alloc(0);
    for (const quality of QUALITIES) {
      // No withMetadata(): sharp then drops EXIF, GPS and colour profiles.
      buffer = await sharp(input, { limitInputPixels: MAX_PIXELS })
        .rotate()
        .resize({ width: target, withoutEnlargement: true })
        .webp({ quality, effort: 4 })
        .toBuffer();
      if (buffer.length <= TARGET_BYTES) break;
    }
    files.push({ width: target, bytes: buffer.length, buffer });
  }

  return {
    id: randomBytes(6).toString("hex"),
    hash: createHash("sha256").update(input).digest("hex"),
    width,
    height,
    files,
  };
}

/** The public path stored in the JSON: "/uploads/<id>-<width>.webp". */
export const variantPath = (id: string, width: number) => `/uploads/${id}-${width}.webp`;

export function toMediaEntry(processed: ProcessedImage, originalName: string): MediaEntry {
  return {
    id: processed.id,
    hash: processed.hash,
    originalName: originalName.replace(/[^\p{L}\p{N}._ -]/gu, "").slice(0, 100) || "image",
    alt: { en: "", fr: "", ar: "" },
    width: processed.width,
    height: processed.height,
    variants: processed.files.map((file) => ({ width: file.width, path: variantPath(processed.id, file.width), bytes: file.bytes })),
    createdAt: new Date().toISOString(),
  };
}
