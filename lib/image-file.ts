const ACCEPTED_IMAGE_PREFIX = 'image/';

export async function imageFileToDataUrl(file: File, maxSizeMb = 2): Promise<string> {
  if (!file.type.startsWith(ACCEPTED_IMAGE_PREFIX)) {
    throw new Error('Please select a valid image file.');
  }

  const maxSizeBytes = maxSizeMb * 1024 * 1024;
  if (file.size > maxSizeBytes) {
    throw new Error(`Image size must be ${maxSizeMb}MB or less.`);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = () => reject(new Error('Failed to read the selected image.'));
    reader.readAsDataURL(file);
  });

  if (!dataUrl) {
    throw new Error('Failed to process the selected image.');
  }

  return dataUrl;
}

/**
 * Compress image in the browser/server to reduce OCR processing time
 * @param imageDataUrl Base64 data URL of the image
 * @param maxWidth Maximum width for resized image (default 640px)
 * @param quality JPEG quality 0-1 (default 0.7)
 * @returns Compressed image as data URL
 */
export async function compressImageForOcr(
  imageDataUrl: string,
  maxWidth = 640,
  quality = 0.7
): Promise<string> {
  if (typeof window === 'undefined') {
    // Server-side (Node.js): compression not supported yet, return as-is
    return imageDataUrl;
  }

  // Client-side compression using Canvas
  return new Promise<string>((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const aspectRatio = img.height / img.width;
      const width = Math.min(img.width, maxWidth);
      const height = width * aspectRatio;

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        reject(new Error('Could not get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);
      const compressed = canvas.toDataURL('image/jpeg', quality);
      resolve(compressed);
    };
    img.onerror = () => {
      reject(new Error('Failed to load image for compression'));
    };
    img.src = imageDataUrl;
  });
}