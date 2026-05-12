"use client";

import { useState } from "react";
import {
  Upload,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  BarChart3,
  Loader2,
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
      const response = await fetch("http://127.0.0.1:8000/preview", {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail ?? "Erreur API inconnue.");
      }

      const data = await response.json();
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
      const response = await fetch("http://127.0.0.1:8000/analyze", {
        method: "POST",
        body: buildFormData(),
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail ?? "Erreur API inconnue.");
      }

      const data = await response.json();
      setAnalysis(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setAnalysisLoading(false);
    }
  }

  const columns = preview?.preview_table?.[0]
    ? Object.keys(preview.preview_table[0])
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
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
          <aside className="h-fit rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <h2 className="text-xl font-medium">Dataset upload</h2>
            <p className="mt-2 text-sm text-slate-400">
              Utilise un fichier de démonstration ou ton propre dataset.
            </p>

            <label className="mt-6 flex cursor-pointer flex-col items-center justify-center rounded-2xl border border-dashed border-slate-700 bg-slate-950/60 p-8 text-center transition hover:border-cyan-400/60 hover:bg-cyan-400/5">
              <Upload className="mb-3 h-8 w-8 text-cyan-300" />
              <span className="text-sm font-medium">
                {file ? file.name : "Choisir un fichier CSV / Excel"}
              </span>
              <span className="mt-1 text-xs text-slate-500">
                CSV, XLSX ou XLS
              </span>
              <input
                type="file"
                className="hidden"
                accept=".csv,.xlsx,.xls"
                onChange={(event) => {
                  setFile(event.target.files?.[0] ?? null);
                  setPreview(null);
                  setAnalysis(null);
                  setError(null);
                }}
              />
            </label>

            <div className="mt-6 grid gap-4">
              <InputField label="Séparateur CSV" value={separator} onChange={setSeparator} />
              <InputField label="Encoding" value={encoding} onChange={setEncoding} />
              <div>
                <label className="text-sm text-slate-300">Skip rows</label>
                <input
                  type="number"
                  value={skiprows}
                  onChange={(event) => setSkiprows(Number(event.target.value))}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                />
              </div>
            </div>

            <button
              onClick={handlePreview}
              disabled={previewLoading}
              className="mt-6 flex w-full items-center justify-center gap-2 rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {previewLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {previewLoading ? "Prévisualisation..." : "Preview dataset"}
            </button>

            <button
              onClick={handleAnalyze}
              disabled={analysisLoading || !preview}
              className="mt-3 flex w-full items-center justify-center gap-2 rounded-xl border border-slate-700 bg-slate-950 px-5 py-3 font-medium text-slate-100 transition hover:border-cyan-400 disabled:cursor-not-allowed disabled:opacity-40"
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
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-500">
                Les résultats apparaîtront ici après preview.
              </div>
            )}

            {preview && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard label="Quality score" value={`${preview.quality_score}/100`} />
                  <MetricCard label="Rows" value={String(preview.dataset_info.rows)} />
                  <MetricCard label="Columns" value={String(preview.dataset_info.columns)} />
                  <MetricCard label="Missing cells" value={String(preview.dataset_info.missing_cells)} />
                </div>

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
                        <div key={action.label} className="rounded-2xl bg-slate-950/70 p-4">
                          <p className="font-medium">{action.label}</p>
                          <p className="mt-1 text-sm text-slate-300">{action.reason}</p>
                          <p className="mt-2 text-sm text-cyan-300">
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
                          <BarChart data={analysis.chart_data.missing_values_by_column}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                            <XAxis dataKey="column" stroke="#94a3b8" />
                            <YAxis stroke="#94a3b8" />
                            <Tooltip
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: "12px",
                              }}
                            />
                            <Bar dataKey="missing_percent" fill="#22d3ee" radius={[8, 8, 0, 0]} />
                          </BarChart>
                        </ResponsiveContainer>
                      </ChartCard>

                      <ChartCard title="Distribution des types de colonnes">
                        <ResponsiveContainer width="100%" height={260}>
                          <PieChart>
                            <Pie
                              data={analysis.chart_data.column_types_distribution}
                              dataKey="count"
                              nameKey="dtype"
                              outerRadius={95}
                              label
                            >
                              {analysis.chart_data.column_types_distribution.map((_, index) => (
                                <Cell
                                  key={index}
                                  fill={["#22d3ee", "#818cf8", "#34d399", "#fbbf24"][index % 4]}
                                />
                              ))}
                            </Pie>
                            <Tooltip
                              contentStyle={{
                                background: "#020617",
                                border: "1px solid #334155",
                                borderRadius: "12px",
                              }}
                            />
                          </PieChart>
                        </ResponsiveContainer>
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
                              <div key={issue.message} className="rounded-2xl border border-amber-400/20 bg-amber-400/10 p-4 text-sm text-amber-100">
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
                              <div key={recommendation.label} className="rounded-2xl border border-slate-800 bg-slate-950/70 p-4 text-sm">
                                <p className="font-medium text-slate-100">
                                  {recommendation.label}
                                </p>
                                <p className="mt-1 text-slate-400">
                                  {recommendation.reason}
                                </p>
                                <p className="mt-2 text-cyan-300">
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
                  <div className="overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/80">
                    <div className="border-b border-slate-800 p-6">
                      <h2 className="text-xl font-medium">Preview table</h2>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead className="bg-slate-950">
                          <tr>
                            {columns.map((column) => (
                              <th key={column} className="whitespace-nowrap px-4 py-3 text-left font-medium text-slate-300">
                                {column}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {preview.preview_table.map((row, rowIndex) => (
                            <tr key={rowIndex} className="border-t border-slate-800">
                              {columns.map((column) => (
                                <td key={column} className="whitespace-nowrap px-4 py-3 text-slate-400">
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
        className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
      />
    </div>
  );
}

function MetricCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-5 shadow-xl">
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
          ? "rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6"
          : "rounded-3xl border border-slate-800 bg-slate-900/80 p-6"
      }
    >
      <h2 className={accent ? "text-xl font-medium text-cyan-100" : "text-xl font-medium"}>
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
            <p className="mt-2 text-sm text-cyan-300">{item.suggestion}</p>
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