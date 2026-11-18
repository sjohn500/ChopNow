export async function compressFoodPhoto(
  file: File,
  maxWidth = 900,
  quality = 0.82
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () =>
      reject(new Error('Could not read the selected photo. Please try again.'));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () =>
        reject(new Error('Please select a valid JPG, PNG, or WebP food photo.'));
      img.onload = () => {
        const scale = Math.min(1, maxWidth / img.width);
        const width = Math.round(img.width * scale);
        const height = Math.round(img.height * scale);

        const canvas = document.createElement('canvas');
        canvas.width = width;
        canvas.height = height;

        const ctx = canvas.getContext('2d');
        if (!ctx) {
          reject(new Error('Image processing is unavailable in this browser.'));
          return;
        }

        ctx.drawImage(img, 0, 0, width, height);
        resolve(canvas.toDataURL('image/jpeg', quality));
      };
      img.src = String(reader.result);
    };
    reader.readAsDataURL(file);
  });
}

export function isValidNigerianPhone(phone: string): boolean {
  const cleaned = phone.replace(/[\s-]/g, '');
  return /^(\+234|0)[789][01]\d{8}$/.test(cleaned);
}
