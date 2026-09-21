import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Modern phone cameras routinely capture 3000-4000px, multi-megabyte photos —
// far more detail than a report thumbnail or a NIC review ever needs. Capping
// the longer edge at 1600px and re-encoding at 0.8 JPEG quality cuts upload
// size dramatically while staying visually close to lossless; photos already
// smaller than that are left alone instead of being degraded further.
const MAX_DIMENSION = 1600;
const JPEG_QUALITY = 0.8;

export type CompressedImage = {
  uri: string;
  width: number;
  height: number;
};

/**
 * Downscales (only if needed) and re-compresses an image for upload.
 * @param sourceSize The picker asset's reported width/height, when known —
 * used to decide whether a resize is needed at all, and on which axis, so a
 * portrait photo isn't capped by its (shorter) width.
 */
export async function compressImage(uri: string, sourceSize?: { width: number; height: number }): Promise<CompressedImage> {
  const context = ImageManipulator.manipulate(uri);

  const knownSize = sourceSize && sourceSize.width > 0 && sourceSize.height > 0 ? sourceSize : null;
  const needsResize = knownSize ? Math.max(knownSize.width, knownSize.height) > MAX_DIMENSION : true;

  if (needsResize) {
    if (knownSize && knownSize.height > knownSize.width) {
      context.resize({ height: MAX_DIMENSION });
    } else {
      context.resize({ width: MAX_DIMENSION });
    }
  }

  const rendered = await context.renderAsync();
  const result = await rendered.saveAsync({ compress: JPEG_QUALITY, format: SaveFormat.JPEG });

  return { uri: result.uri, width: result.width, height: result.height };
}
