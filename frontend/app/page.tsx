"use client";

import { postFormData } from "@/lib/api";
import { useState } from "react";
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
  PieChart,
  Pie,
  Cell,
} from "recharts";

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

  const [preview, setPreview] = useState<PreviewResponse | null>(null);
  const [analysis, setAnalysis] = useState<AnalyzeResponse | null>(null);

  const [previewLoading, setPreviewLoading] = useState(false);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function resetResults() {
    setPreview(null);
    setAnalysis(null);
    setError(null);
  }

  function handleFileSelection(selectedFile: File | null) {
    setFile(selectedFile);
    resetResults();
  }

  async function loadSampleDataset() {
  setError(null);
  setPreview(null);
  setAnalysis(null);
  setPreviewLoading(true);

  try {
    const response = await fetch("/samples/customer_quality_sample.csv");

    if (!response.ok) {
      throw new Error("Impossible de charger le dataset d'exemple.");
    }

    const blob = await response.blob();

    const sampleFile = new File([blob], "customer_quality_sample.csv", {
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
    setError(err instanceof Error ? err.message : "Erreur inconnue.");
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
      multiple: false,
      onDrop: (acceptedFiles) => {
        handleFileSelection(acceptedFiles[0] ?? null);
      },
      onDropRejected: () => {
        setError("Format non supporté. Utilise un fichier CSV, XLS ou XLSX.");
      },
    });

  function buildFormData() {
    if (!file) {
      throw new Error("Ajoute un fichier avant de lancer l’analyse.");
    }

    const formData = new FormData();
    formData.append("file", file);
    formData.append("separator", separator);
    formData.append("encoding", encoding);
    formData.append("skiprows", String(skiprows));

    return formData;
  }

  async function handlePreview() {
    setPreviewLoading(true);
    setError(null);
    setPreview(null);
    setAnalysis(null);

    try {
      const data = await postFormData<PreviewResponse>(
        "/preview",
        buildFormData()
      );

      setPreview(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setPreviewLoading(false);
    }
  }

  async function handleAnalyze() {
    setAnalysisLoading(true);
    setError(null);
    setAnalysis(null);

    try {
      const data = await postFormData<AnalyzeApiResponse>(
        "/analyze",
        buildFormData()
      );

      setAnalysis(data.analysis);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setAnalysisLoading(false);
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


  const isBusy = previewLoading || analysisLoading;

  return (
    <main className="min-h-screen bg-[#090909] text-neutral-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-orange-400/30 bg-orange-400/10 px-4 py-2 text-sm text-orange-200">
            <Sparkles className="h-4 w-4" />
            AI Data Report Generator
          </div>

          <div className="max-w-4xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Transforme un fichier brut en diagnostic data exploitable.
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Upload CSV ou Excel, vérifie la lecture, détecte les problèmes,
              puis génère une analyse qualité visuelle.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <aside className="h-fit rounded-2xl border border-white/10 bg-white/[0.03] p-6 shadow-2xl">
            <h2 className="text-xl font-medium">Dataset upload</h2>
            <p className="mt-2 text-sm text-slate-400">
              Glisse-dépose un fichier ou utilise le sélecteur classique.
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
                ? "Dépose le fichier ici"
                : "Drag & drop ou clique pour upload"}
            </span>

            <span className="mt-1 text-xs text-slate-500">CSV, XLSX ou XLS</span>
          </div>

          <button
            type="button"
            onClick={loadSampleDataset}
            disabled={previewLoading}
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-orange-400/30 bg-orange-400/10 px-5 py-3 text-sm font-medium text-orange-200 transition hover:border-orange-300 hover:bg-orange-400/20 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {previewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {previewLoading ? "Loading sample..." : "Use sample dataset"}
          </button>

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
                  onClick={() => handleFileSelection(null)}
                  className="rounded-full border border-slate-700 p-2 text-slate-400 transition hover:border-red-400 hover:text-red-300"
                  aria-label="Remove selected file"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            )}

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm text-slate-300">Séparateur CSV</label>

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
                    const value = event.target.value === "\\t" ? "\t" : event.target.value;
                    setSeparator(value);
                    resetResults();
                  }}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-orange-400"
                />
              </div>

              <InputField
                label="Encoding"
                value={encoding}
                onChange={setEncoding}
              />

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
              {previewLoading ? "Prévisualisation..." : "Preview dataset"}
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
              {analysisLoading ? "Analyse..." : "Run full analysis"}
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
                      ? "Analyse du dataset en cours..."
                      : "Aucun dataset analysé pour le moment"}
                  </p>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    Ajoute un fichier CSV ou Excel, vérifie les paramètres de
                    lecture, puis lance la prévisualisation.
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
                    <p className="font-medium">Possible problème de séparateur CSV détecté.</p>
                    <p className="mt-1 text-amber-100/80">
                      Le fichier semble avoir été lu comme une seule colonne. Essaie un autre
                      séparateur, par exemple <span className="font-semibold">Semicolon</span>{" "}
                      ou <span className="font-semibold">Comma</span>, puis relance la preview.
                    </p>
                  </div>
                )}


                <Panel title="Diagnostic rapide">
                  <div className="grid gap-3">
                    {preview.user_report.map((item) => (
                      <StatusCard key={item.question} item={item} />
                    ))}
                  </div>
                </Panel>

                {preview.recommended_actions.length > 0 && (
                  <Panel title="Actions recommandées" accent>
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
                  <Panel title="Analyse qualité visuelle">
                    <div className="grid gap-6 lg:grid-cols-2">
                      <ChartCard title="Valeurs manquantes par colonne">
                        <ResponsiveContainer width="100%" height={260}>
                          <BarChart
                            data={analysis.chart_data.missing_values_by_column}
                          >
                            <CartesianGrid
                              strokeDasharray="3 3"
                              stroke="#1e293b"
                            />
                            <XAxis dataKey="column" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar
                              dataKey="missing_percent"
                              fill="#fb923c"
                              radius={[8, 8, 0, 0]}
                            />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Distribution des types de colonnes">
                        <div className="grid gap-3">
                          {analysis.chart_data.column_types_distribution.map((item, index) => {
                            const rawType =
                              item.dtype ??
                              (item as { type?: string }).type ??
                              (item as { column_type?: string }).column_type ??
                              "unknown";

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
                          })}
                        </div>
                      </ChartCard>
                    </div>

                    <div className="mt-6 grid gap-4 lg:grid-cols-2">
                      <div>
                        <h3 className="font-medium">Issues détectées</h3>
                        <div className="mt-3 grid gap-3">
                          {analysis.issues.length === 0 ? (
                            <p className="text-sm text-emerald-300">
                              Aucun problème qualité majeur détecté.
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
                        <h3 className="font-medium">Recommandations</h3>
                        <div className="mt-3 grid gap-3">
                          {analysis.recommendations.length === 0 ? (
                            <p className="text-sm text-slate-400">
                              Aucune recommandation critique.
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
        onChange={(event) => {
          onChange(event.target.value);
        }}
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
    normalizedDtype.includes("text")
  ) {
    return "Text columns";
  }

  return "Other columns";
}