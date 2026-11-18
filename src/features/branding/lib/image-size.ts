/** Natural size of a picked image, or `null` when the browser cannot tell (e.g. an SVG without width/height). */
export function readImageSize(
  file: File,
): Promise<{ width: number; height: number } | null> {
  return new Promise((resolve) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    const done = (size: { width: number; height: number } | null) => {
      URL.revokeObjectURL(url);
      resolve(size);
    };
    img.onload = () =>
      done(
        img.naturalWidth && img.naturalHeight
          ? { width: img.naturalWidth, height: img.naturalHeight }
          : null,
      );
    img.onerror = () => done(null);
    img.src = url;
  });
}
