type DownloadAnalysisReportParams = {
  filename: string;
  sheetName: string | null;
  loadingOptions: {
    separator: string;
    encoding: string;
    skiprows: number;
  };
  analysis: unknown;
};

export function downloadAnalysisReport({
  filename,
  sheetName,
  loadingOptions,
  analysis,
}: DownloadAnalysisReportParams) {
  const report = {
    generated_at: new Date().toISOString(),
    filename,
    sheet_name: sheetName,
    loading_options: loadingOptions,
    analysis,
  };

  const blob = new Blob([JSON.stringify(report, null, 2)], {
    type: "application/json",
  });

  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = `${filename.replace(/\.[^/.]+$/, "")}_quality_report.json`;

  document.body.appendChild(link);
  link.click();
  link.remove();

  URL.revokeObjectURL(url);
}