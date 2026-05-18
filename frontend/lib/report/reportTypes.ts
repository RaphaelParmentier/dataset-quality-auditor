export type AiInsights = {
  executive_summary: string;
  risk_level: "low" | "medium" | "high";
  business_impact: string;
  key_findings: string[];
  priority_actions: string[];
  technical_notes: string[];
};

export type AnalysisReport = {
  status: "ok" | "warning";
  quality_score: number;
  quality_summary: {
    rows: number;
    columns: number;
    memory_usage_mb: number;
    duplicate_count: number;
    duplicate_percent: number;
    constant_columns_count: number;
  };
  issues: {
    type: string;
    severity: string;
    message: string;
  }[];
  recommendations: {
    label: string;
    reason: string;
    action: string;
  }[];
  chart_data: {
    missing_values_by_column: {
      column: string;
      missing_count: number;
      missing_percent: number;
    }[];
    column_types_distribution: {
      dtype: string;
      count: number;
    }[];
  };
};

export type AuditReportPayload = {
  filename: string;
  sheetName: string | null;
  loadingOptions: {
    separator: string;
    encoding: string;
    skiprows: number;
  };
  analysis: AnalysisReport;
  aiInsights?: AiInsights | null;
};