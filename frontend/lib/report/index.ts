import type { AuditReportPayload } from "./reportTypes";
import { generateHtmlAuditReport } from "./htmlReport";
import { downloadFile, removeExtension } from "./reportUtils";

export function downloadAnalysisReport(payload: AuditReportPayload) {
  const report = {
    generated_at: new Date().toISOString(),
    filename: payload.filename,
    sheet_name: payload.sheetName,
    loading_options: payload.loadingOptions,
    analysis: payload.analysis,
    ai_insights: payload.aiInsights ?? null,
  };

  downloadFile({
    content: JSON.stringify(report, null, 2),
    filename: `${removeExtension(payload.filename)}_quality_report.json`,
    type: "application/json",
  });
}

export function downloadHtmlAuditReport(payload: AuditReportPayload) {
  const html = generateHtmlAuditReport(payload);

  downloadFile({
    content: html,
    filename: `${removeExtension(payload.filename)}_quality_audit.html`,
    type: "text/html",
  });
}