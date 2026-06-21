const fileSizeFormatter = new Intl.NumberFormat("en", {
  maximumFractionDigits: 1,
});

export function formatFileSize(bytes: number) {
  if (bytes < 1024 * 1024) {
    return `${fileSizeFormatter.format(bytes / 1024)} KB`;
  }

  return `${fileSizeFormatter.format(bytes / (1024 * 1024))} MB`;
}

export function isPdfFile(file: File) {
  return file.type === "application/pdf" || file.name.toLowerCase().endsWith(".pdf");
}
