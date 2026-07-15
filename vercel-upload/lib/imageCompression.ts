export async function fileToDataUrl(file: File) {
  return new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => resolve(String(reader.result ?? ""));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

export async function compressImageToDataUrl(file: File) {
  const rawDataUrl = await fileToDataUrl(file);

  if (!file.type.startsWith("image/")) {
    return rawDataUrl;
  }

  // TODO: 可继续将 canvas 压缩逻辑扩展为更细的格式控制。
  return new Promise<string>((resolve) => {
    const image = new Image();

    image.onload = () => {
      const maxWidth = 1280;
      const scale = Math.min(1, maxWidth / image.width);
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(image.width * scale);
      canvas.height = Math.round(image.height * scale);

      const context = canvas.getContext("2d");

      if (!context) {
        resolve(rawDataUrl);
        return;
      }

      context.drawImage(image, 0, 0, canvas.width, canvas.height);
      resolve(canvas.toDataURL("image/jpeg", 0.82));
    };

    image.onerror = () => resolve(rawDataUrl);
    image.src = rawDataUrl;
  });
}
