"use client";

import { postFormData, postJson } from "@/lib/api";
import {
  downloadAnalysisReport,
  downloadHtmlAuditReport,
} from "@/lib/report";
import { useEffect, useState } from "react";
import { useDropzone } from "react-dropzone";
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Loader2,
  FileSpreadsheet,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const MAX_FILE_SIZE_MB = 5;
const MAX_FILE_SIZE_BYTES = MAX_FILE_SIZE_MB * 1024 * 1024;

type ApiStatus = "checking" | "ready" | "error";

type SheetsResponse = {
  file_type: string;
  sheets: string[];
  message?: string;
};

type AiInsights = {
  executive_summary: string;
  risk_level: "low" | "medium" | "high";
  business_impact: string;
  key_findings: string[];
  priority_actions: string[];
  technical_notes: string[];
};

type AiInsightsResponse = {
  status: "ok";
  insights: AiInsights;
};

type AnalyzeApiResponse = {
  filename: string;
  sheet_name: string | null;
  loading_options: {
    separator: string;
    encoding: string;
    skiprows: number;
  };
  analysis: AnalyzeResponse;
};

type UserReportItem = {
  question: string;
  answer: string;
  status: "ok" | "warning" | "error" | "info";
  suggestion: string | null;
};

type RecommendedAction = {
  label: string;
  parameter: string;
  current_value: string | number | null;
  recommended_value: string | number | null;
  reason: string;
};

type PreviewResponse = {
  status: "ok" | "warning" | "error";
  quality_score: number;
  user_report: UserReportItem[];
  recommended_actions: RecommendedAction[];
  suggestions: string[];
  warnings: string[];
  dataset_info: {
    rows: number;
    columns: number;
    missing_cells: number;
    duplicated_rows: number;
  };
  preview_table: Record<string, string | number | null>[];
};

type AnalyzeResponse = {
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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState(",");
  const [encoding, setEncoding] = useState("utf-8");
  const [skiprows, setSkiprows] = useState(0);
  const [sheetName, setSheetName] = useState<string | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);
  const [aiInsights, setAiInsights] = useState<AiInsights | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [sheetsLoading, setSheetsLoading] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);

  const [apiStatus, setApiStatus] = useState<ApiStatus>("checking");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function checkApiHealth() {
      try {
        const response = await fetch("/api/health");

        if (!response.ok) {
          setApiStatus("error");
          return;
        }

        setApiStatus("ready");
      } catch {
        setApiStatus("error");
      }
    }

    checkApiHealth();
  }, []);

  function resetResults() {
    setPreview(null);
    setAnalysis(null);
    setAiInsights(null);
    setError(null);
  }

  function resetWorkspace() {
    setFile(null);
    setSeparator(",");
    setEncoding("utf-8");
    setSkiprows(0);
    setSheetName(null);
    setSheets([]);
    resetResults();
  }

  async function loadExcelSheets(selectedFile: File) {
    setSheetsLoading(true);
    setSheets([]);
    setSheetName(null);

    try {
      const formData = new FormData();
      formData.append("file", selectedFile);

      const data = await postFormData<SheetsResponse>("/sheets", formData);

      if (data.sheets.length > 0) {
        setSheets(data.sheets);
        setSheetName(data.sheets[0]);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to read Excel sheets."
      );
    } finally {
      setSheetsLoading(false);
    }
  }

  async function handleFileSelection(selectedFile: File | null) {
    if (!selectedFile) {
      setFile(null);
      setSheetName(null);
      setSheets([]);
      resetResults();
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_BYTES) {
      setFile(null);
      setSheetName(null);
      setSheets([]);
      setPreview(null);
      setAnalysis(null);
      setAiInsights(null);
      setError(
        `File too large. Maximum allowed size: ${MAX_FILE_SIZE_MB} MB.`
      );
      return;
    }

    setFile(selectedFile);
    setSheetName(null);
    setSheets([]);
    resetResults();

    if (isExcelFile(selectedFile.name)) {
      await loadExcelSheets(selectedFile);
    }
  }

  async function loadSampleDataset(samplePath: string) {
    setError(null);
    setPreview(null);
    setAnalysis(null);
    setAiInsights(null);
    setSheets([]);
    setSheetName(null);
    setPreviewLoading(true);

    try {
      const response = await fetch(samplePath);

      if (!response.ok) {
        throw new Error("Unable to load the sample dataset.");
      }

      const blob = await response.blob();
      const filename = samplePath.split("/").pop() ?? "sample.csv";

      const sampleFile = new File([blob], filename, {
        type: "text/csv",
      });

      setFile(sampleFile);
      setSeparator(";");
      setEncoding("utf-8");
      setSkiprows(0);

      const formData = new FormData();
      formData.append("file", sampleFile);
      formData.append("separator", ";");
      formData.append("encoding", "utf-8");
      formData.append("skiprows", "0");

      const data = await postFormData<PreviewResponse>("/preview", formData);

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setPreviewLoading(false);
    }
  }

  const { getRootProps, getInputProps, isDragActive, isDragReject } =
    useDropzone({
      accept: {
        "text/csv": [".csv"],
        "application/vnd.ms-excel": [".xls"],
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet": [
          ".xlsx",
        ],
      },
      maxFiles: 1,
      maxSize: MAX_FILE_SIZE_BYTES,
      multiple: false,
      onDrop: (acceptedFiles) => {
        void handleFileSelection(acceptedFiles[0] ?? null);
      },
      onDropRejected: (fileRejections) => {
        const firstError = fileRejections[0]?.errors[0];

        if (firstError?.code === "file-too-large") {
          setError(
            `File too large. Maximum allowed size: ${MAX_FILE_SIZE_MB} MB.`
          );
          return;
        }

        setError("Unsupported format. Please use a CSV, XLS or XLSX file.");
      },
    });

  function buildFormData() {
    if (!file) {
      throw new Error("Upload a file before running the analysis.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("separator", separator);
    formData.append("encoding", encoding);
    formData.append("skiprows", String(skiprows));

    if (sheetName) {
      formData.append("sheet_name", sheetName);
    }

    return formData;
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    setPreview(null);
    setAnalysis(null);
    setAiInsights(null);

    try {
      const data = await postFormData<PreviewResponse>(
        "/preview",
        buildFormData()
      );

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalysisLoading(true);
    setError(null);
    setAnalysis(null);
    setAiInsights(null);

    try {
      const data = await postFormData<AnalyzeApiResponse>(
        "/analyze",
        buildFormData()
      );

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown error.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  async function handleGenerateAiInsights() {
    if (!analysis) return;

    setAiLoading(true);
    setError(null);

    try {
      const data = await postJson<AiInsightsResponse>("/ai-insights", {
        analysis,
      });

      setAiInsights(data.insights);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unknown AI error.");
    } finally {
      setAiLoading(false);
    }
  }

  const columns = preview?.preview_table?.[0]
    ? Object.keys(preview.preview_table[0])
    : [];

  const isLikelyWrongSeparator =
    preview !== null &&
    preview.dataset_info.columns === 1 &&
    columns.some((column) =>
      [",", ";", "|", "\t"].some((separatorCandidate) =>
        column.includes(separatorCandidate)
      )
    );

  const isBusy = previewLoading || analysisLoading || sheetsLoading || aiLoading;

  return (
    <main className="min-h-screen bg-[#090909] text-neutral-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="flex flex-wrap gap-3">
            <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm text-orange-200">
              <Sparkles className="h-4 w-4" />
              AI Dataset Auditor
            </div>

            <ApiStatusBadge status={apiStatus} />
          </div>

          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Automated dataset quality auditing for CSV and Excel files.
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Inspect structure, detect quality issues, generate recommendations and create professional audit reports in seconds.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            <h2 className="text-xl font-medium">Dataset upload</h2>
            <p className="mt-2 text-sm text-slate-400">
              Drag and drop a file or use the file picker.
            </p>

            <div
              {...getRootProps()}
              className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed p-8 text-center transition ${
                isDragReject
                  ? "border-red-400 bg-red-400/10"
                  : isDragActive
                    ? "border-orange-400 bg-orange-400/10"
                    : "border-slate-700 bg-slate-950/60 hover:border-orange-400/60 hover:bg-orange-400/5"
              }`}
            >
              <input {...getInputProps()} />

              <Upload className="mb-3 h-8 w-8 text-orange-300" />

              <span className="text-sm font-medium">
                {file
                  ? file.name
                  : isDragActive
                    ? "Drop the file here"
                    : "Drag & drop or click to upload"}
              </span>

              <span className="mt-1 text-xs text-slate-500">
                CSV, XLSX or XLS · max {MAX_FILE_SIZE_MB} MB
              </span>
            </div>

            <div className="mt-3 grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  loadSampleDataset("/samples/customer_clean_sample.csv")
                }
                disabled={previewLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-emerald-400/30 bg-emerald-400/10 px-4 py-3 text-sm font-medium text-emerald-200 transition hover:border-emerald-300 hover:bg-emerald-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Clean sample
              </button>

              <button
                type="button"
                onClick={() =>
                  loadSampleDataset("/samples/customer_messy_sample.csv")
                }
                disabled={previewLoading}
                className="flex items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-3 text-sm font-medium text-orange-200 transition hover:border-orange-300 hover:bg-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Messy sample
              </button>
            </div>

            {file && (
              <div className="mt-4 flex items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950/60 px-4 py-3">
                <div className="flex min-w-0 items-center gap-3">
                  <FileSpreadsheet className="h-5 w-5 shrink-0 text-orange-300" />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-slate-100">
                      {file.name}
                    </p>
                    <p className="text-xs text-slate-500">
                      {(file.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => void handleFileSelection(null)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:border-red-400 hover:text-red-300"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm text-slate-300">CSV delimiter</label>

                <div className="mt-2 grid grid-cols-4 gap-2">
                  {[
                    { label: "Comma", value: "," },
                    { label: "Semicolon", value: ";" },
                    { label: "Tab", value: "\t" },
                    { label: "Pipe", value: "|" },
                  ].map((option) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => {
                        setSeparator(option.value);
                        resetResults();
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs transition ${
                        separator === option.value
                          ? "border-orange-400 bg-orange-400/10 text-orange-200"
                          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-orange-400/60 hover:text-orange-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <input
                  value={separator === "\t" ? "\\t" : separator}
                  onChange={(event) => {
                    const value =
                      event.target.value === "\\t" ? "\t" : event.target.value;

                    setSeparator(value);
                    resetResults();
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Encoding</label>

                <div className="mt-2 grid grid-cols-3 gap-2">
                  {[
                    { label: "UTF-8", value: "utf-8" },
                    { label: "Latin-1", value: "latin-1" },
                    { label: "Win-1252", value: "cp1252" },
                  ].map((option) => (
                    <button
                      key={option.value}
                      type="button"
                      onClick={() => {
                        setEncoding(option.value);
                        resetResults();
                      }}
                      className={`rounded-xl border px-3 py-2 text-xs transition ${
                        encoding === option.value
                          ? "border-orange-400 bg-orange-400/10 text-orange-200"
                          : "border-slate-700 bg-slate-950 text-slate-400 hover:border-orange-400/60 hover:text-orange-200"
                      }`}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>

                <input
                  value={encoding}
                  onChange={(event) => {
                    setEncoding(event.target.value);
                    resetResults();
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              {sheetsLoading && (
                <div className="rounded-xl border border-orange-400/20 bg-orange-400/10 p-3 text-sm text-orange-100">
                  Loading Excel sheets...
                </div>
              )}

              {sheets.length > 0 && (
                <div>
                  <label className="text-sm text-slate-300">Excel sheet</label>
                  <select
                    value={sheetName ?? ""}
                    onChange={(event) => {
                      setSheetName(event.target.value || null);
                      resetResults();
                    }}
                    className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
                  >
                    {sheets.map((sheet) => (
                      <option key={sheet} value={sheet}>
                        {sheet}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="text-sm text-slate-300">Skip rows</label>
                <input
                  type="number"
                  min={0}
                  value={skiprows}
                  onChange={(event) => {
                    setSkiprows(Number(event.target.value));
                    resetResults();
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>
            </div>

            <button
              onClick={handlePreview}
              disabled={previewLoading || !file}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-orange-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-orange-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {previewLoading
                ? "API waking up... loading dataset"
                : "Preview dataset"}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={analysisLoading || !preview}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-medium text-slate-100 transition hover:border-orange-400 disabled:cursor-not-allowed disabled:opacity-40"
            >
              {analysisLoading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <BarChart3 className="h-4 w-4" />
              )}
              {analysisLoading ? "Running full analysis..." : "Run full analysis"}
            </button>

            {(previewLoading || analysisLoading || aiLoading) && (
              <div className="mt-4 rounded-xl border border-orange-400/20 bg-orange-400/10 p-4 text-sm text-orange-100">
                The hosted API may take up to 60 seconds to wake up on the free
                tier. This is expected on the first request.
              </div>
            )}

            <button
              type="button"
              onClick={resetWorkspace}
              disabled={isBusy && !error}
              className="mt-3 w-full rounded-xl border border-slate-700 px-5 py-3 text-sm font-medium text-slate-300 transition hover:border-red-400 hover:text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Reset workspace
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
          </aside>

          <section className="flex flex-col gap-6">
            {!preview && (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center">
                <div className="max-w-md">
                  {isBusy ? (
                    <Loader2 className="mx-auto mb-4 h-8 w-8 animate-spin text-orange-300" />
                  ) : (
                    <FileSpreadsheet className="mx-auto mb-4 h-10 w-10 text-slate-600" />
                  )}

                  <p className="text-lg font-medium text-slate-300">
                    {isBusy
                      ? "Dataset analysis in progress..."
                      : "No dataset analyzed yet"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Upload a CSV or Excel file, review the loading options, then launch the preview.
                  </p>
                </div>
              </div>
            )}

            {preview && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Quality score"
                    value={`${preview.quality_score}/100`}
                  />
                  <MetricCard
                    label="Rows"
                    value={String(preview.dataset_info.rows)}
                  />
                  <MetricCard
                    label="Columns"
                    value={String(preview.dataset_info.columns)}
                  />
                  <MetricCard
                    label="Missing cells"
                    value={String(preview.dataset_info.missing_cells)}
                  />
                </div>

                {isLikelyWrongSeparator && (
                  <div className="rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4 text-sm text-amber-100">
                    <p className="font-medium">
                      Potential CSV delimiter issue detected.
                    </p>
                    <p className="mt-1 text-amber-100/80">
                      The dataset appears to have been parsed as a single column. Try another delimiter, for example{" "}
                      <span className="font-semibold">Semicolon</span> ou{" "}
                      <span className="font-semibold">Comma</span>, puis relance
                      la preview.
                    </p>
                  </div>
                )}

                <Panel title="Quick Assessment">
                  <div className="grid gap-3">
                    {preview.user_report.map((item) => (
                      <StatusCard key={item.question} item={item} />
                    ))}
                  </div>
                </Panel>

                {preview.recommended_actions.length > 0 && (
                  <Panel title="Recommended Actions" accent>
                    <div className="grid gap-3">
                      {preview.recommended_actions.map((action) => (
                        <div
                          key={action.label}
                          className="rounded-2xl bg-slate-950/70 p-4"
                        >
                          <p className="font-medium">{action.label}</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {action.reason}
                          </p>
                          <p className="mt-2 text-sm text-orange-300">
                            {action.parameter}: {String(action.current_value)} →{" "}
                            {String(action.recommended_value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </Panel>
                )}

                {analysis && (
                  <Panel title="Data Quality Analysis">
                    <div className="mb-6 flex flex-wrap justify-end gap-3">
                      <button
                        type="button"
                        onClick={() =>
                          downloadAnalysisReport({
                            filename: file?.name ?? "unknown_file",
                            sheetName,
                            loadingOptions: {
                              separator,
                              encoding,
                              skiprows,
                            },
                            analysis,
                          })
                        }
                        className="rounded-xl border border-slate-700 bg-slate-950 px-4 py-2 text-sm font-medium text-slate-200 transition hover:border-orange-400 hover:text-orange-200"
                      >
                        Download JSON
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          downloadHtmlAuditReport({
                            filename: file?.name ?? "unknown_file",
                            sheetName,
                            loadingOptions: {
                              separator,
                              encoding,
                              skiprows,
                            },
                            analysis,
                            aiInsights,
                          })
                        }
                        className="rounded-xl border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm font-medium text-orange-200 transition hover:border-orange-300 hover:bg-orange-400/20"
                      >
                        Download HTML report
                      </button>

                      <button
                        type="button"
                        onClick={handleGenerateAiInsights}
                        disabled={aiLoading || !analysis}
                        className="rounded-xl border border-violet-400/30 bg-violet-400/10 px-4 py-2 text-sm font-medium text-violet-200 transition hover:border-violet-300 hover:bg-violet-400/20 disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {aiLoading
                          ? "Generating AI insights..."
                          : "Generate AI insights"}
                      </button>
                    </div>

                    <div className="grid gap-6 lg:grid-cols-2">
                      <ChartCard title="Missing Values by Column">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={analysis.chart_data.missing_values_by_column}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1e293b"
                            />
                            <XAxis dataKey="column" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" allowDecimals={false} />
                            <Tooltip
                              formatter={(value) => [value, "Missing values"]}
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar
                              dataKey="missing_count"
                              fill="#fb923c"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Column Type Distribution">
                        <div className="grid gap-3">
                          {analysis.chart_data.column_types_distribution.map(
                            (item, index) => {
                              const rawType = item.dtype ?? "unknown";

                              return (
                                <div
                                  key={`${rawType}-${index}`}
                                  className="flex items-center justify-between rounded-2xl border border-slate-800 bg-slate-950/70 px-4 py-3"
                                >
                                  <div>
                                    <p className="font-medium text-slate-100">
                                      {formatColumnType(rawType)}
                                    </p>
                                    <p className="text-xs text-slate-500">
                                      Raw dtype: {rawType}
                                    </p>
                                  </div>

                                  <div className="rounded-xl bg-orange-400/10 px-3 py-2 text-lg font-semibold text-orange-200">
                                    {item.count}
                                  </div>
                                </div>
                              );
                            }
                          )}
                        </div>
                      </ChartCard>
                    </div>

                    {aiInsights && (
                      <div className="mt-6">
                        <Panel title="AI audit insights" accent>
                          <div className="grid gap-4">
                            <div className="rounded-2xl bg-slate-950/70 p-4">
                              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                                Executive summary
                              </p>
                              <p className="mt-2 text-slate-200">
                                {aiInsights.executive_summary}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-950/70 p-4">
                              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                                Risk level
                              </p>
                              <p className="mt-2 text-slate-200">
                                {aiInsights.risk_level}
                              </p>
                            </div>

                            <div className="rounded-2xl bg-slate-950/70 p-4">
                              <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
                                Business impact
                              </p>
                              <p className="mt-2 text-slate-200">
                                {aiInsights.business_impact}
                              </p>
                            </div>

                            <div className="grid gap-4 lg:grid-cols-2">
                              <AiList
                                title="Key findings"
                                items={aiInsights.key_findings}
                              />
                              <AiList
                                title="Priority actions"
                                items={aiInsights.priority_actions}
                              />
                            </div>
                          </div>
                        </Panel>
                      </div>
                    )}

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div>
                        <h3 className="font-medium">Detected Issues</h3>
                        <div className="mt-3 grid gap-3">
                          {analysis.issues.length === 0 ? (
                            <p className="text-sm text-emerald-300">
                              No major data quality issue detected.
                            </p>
                          ) : (
                            analysis.issues.map((issue) => (
                              <div
                                key={issue.message}
                                className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100"
                              >
                                {issue.message}
                              </div>
                            ))
                          )}
                        </div>
                      </div>

                      <div>
                        <h3 className="font-medium">Recommendations</h3>
                        <div className="mt-3 grid gap-3">
                          {analysis.recommendations.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              No critical recommendation.
                            </p>
                          ) : (
                            analysis.recommendations.map((recommendation) => (
                              <div
                                key={recommendation.label}
                                className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm"
                              >
                                <p className="font-medium text-slate-100">
                                  {recommendation.label}
                                </p>
                                <p className="mt-1 text-slate-400">
                                  {recommendation.reason}
                                </p>
                                <p className="mt-2 text-orange-300">
                                  {recommendation.action}
                                </p>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    </div>
                  </Panel>
                )}

                {columns.length > 0 && (
                  <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/[0.03]">
                    <div className="border-b border-slate-800 p-6">
                      <h2 className="text-xl font-medium">Preview table</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950">
                          <tr>
                            {columns.map((column) => (
                              <th
                                key={column}
                                className="whitespace-nowrap px-4 py-3 text-left font-medium text-slate-300"
                              >
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview_table.map((row, rowIndex) => (
                            <tr
                              key={rowIndex}
                              className="border-t border-slate-800"
                            >
                              {columns.map((column) => (
                                <td
                                  key={column}
                                  className="whitespace-nowrap px-4 py-3 text-slate-400"
                                >
                                  {String(row[column] ?? "")}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                )}
              </>
            )}
          </section>
        </section>
      </section>
    </main>
  );
}

function InputField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <div>
      <label className="text-sm text-slate-300">{label}</label>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 shadow-xl">
      <p className="text-sm text-slate-500">{label}</p>
      <p className="mt-2 text-3xl font-semibold text-slate-100">{value}</p>
    </div>
  );
}

function Panel({
  title,
  children,
  accent = false,
}: {
  title: string;
  children: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      className={
        accent
          ? "rounded-3xl border border-orange-400/30 bg-orange-400/10 p-6"
          : "rounded-2xl border border-white/10 bg-white/[0.03] p-6"
      }
    >
      <h2
        className={
          accent ? "text-xl font-medium text-orange-100" : "text-xl font-medium"
        }
      >
        {title}
      </h2>
      <div className="mt-4">{children}</div>
    </div>
  );
}

function StatusCard({ item }: { item: UserReportItem }) {
  const isOk = item.status === "ok";

  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
      <div className="flex items-start gap-3">
        {isOk ? (
          <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
        ) : (
          <AlertTriangle className="mt-1 h-5 w-5 text-amber-400" />
        )}

        <div>
          <p className="font-medium">{item.question}</p>
          <p className="mt-1 text-sm text-slate-300">{item.answer}</p>
          {item.suggestion && (
            <p className="mt-2 text-sm text-orange-300">{item.suggestion}</p>
          )}
        </div>
      </div>
    </div>
  );
}

function ChartCard({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <div className="rounded-2xl border border-slate-800 bg-slate-950/60 p-5">
      <h3 className="mb-4 font-medium">{title}</h3>
      {children}
    </div>
  );
}

function ApiStatusBadge({ status }: { status: ApiStatus }) {
  if (status === "checking") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-slate-700 bg-slate-900/70 px-4 py-2 text-sm text-slate-300">
        <Loader2 className="h-4 w-4 animate-spin" />
        API waking up
      </div>
    );
  }

  if (status === "ready") {
    return (
      <div className="inline-flex w-fit items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-4 py-2 text-sm text-emerald-300">
        <CheckCircle2 className="h-4 w-4" />
        API ready
      </div>
    );
  }

  return (
    <div className="inline-flex w-fit items-center gap-2 rounded-full border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-300">
      <AlertTriangle className="h-4 w-4" />
      API unavailable
    </div>
  );
}

function AiList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl bg-slate-950/70 p-4">
      <p className="text-sm uppercase tracking-[0.2em] text-violet-300">
        {title}
      </p>

      {items.length === 0 ? (
        <p className="mt-2 text-sm text-slate-400">No item generated.</p>
      ) : (
        <ul className="mt-3 grid gap-2 text-sm text-slate-300">
          {items.map((item) => (
            <li key={item} className="flex gap-2">
              <span className="text-violet-300">•</span>
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function formatColumnType(dtype?: string | null) {
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

  if (
    normalizedDtype.includes("datetime") ||
    normalizedDtype.includes("date")
  ) {
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

function isExcelFile(filename: string) {
  const lowerFilename = filename.toLowerCase();
  return lowerFilename.endsWith(".xlsx") || lowerFilename.endsWith(".xls");
}