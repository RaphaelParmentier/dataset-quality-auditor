export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

export function removeExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

export function getScoreLabel(score: number) {
  if (score >= 85) return "Strong data quality";
  if (score >= 65) return "Moderate data quality";
  return "High-risk dataset";
}

export function getScoreColor(score: number) {
  if (score >= 85) return "#34d399";
  if (score >= 65) return "#fb923c";
  return "#f87171";
}

export function formatColumnType(dtype?: string | null) {
  const normalizedDtype = String(dtype ?? "unknown").toLowerCase();

  if (
    normalizedDtype.includes("int") ||
    normalizedDtype.includes("float") ||
    normalizedDtype.includes("number") ||
    normalizedDtype.includes("numeric")
  ) {
    return "Numeric columns";
  }

  if (normalizedDtype.includes("bool")) {
    return "Boolean columns";
  }

  if (normalizedDtype.includes("datetime") || normalizedDtype.includes("date")) {
    return "Date columns";
  }

  if (
    normalizedDtype.includes("object") ||
    normalizedDtype.includes("string") ||
    normalizedDtype.includes("str") ||
    normalizedDtype.includes("text")
  ) {
    return "Text columns";
  }

  return "Other columns";
}

export function downloadFile({
  content,
  filename,
  type,
}: {
  content: string;
  filename: string;
  type: string;
}) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = filename;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}