"use client";

import { useState } from "react";
import { Upload, AlertTriangle, CheckCircle2, Sparkles } from "lucide-react";

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

export default function Home() {
  const [file, setFile] = useState<File | null>(null);
  const [separator, setSeparator] = useState(",");
  const [encoding, setEncoding] = useState("utf-8");
  const [skiprows, setSkiprows] = useState(0);
  const [result, setResult] = useState<PreviewResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handlePreview() {
    if (!file) {
      setError("Ajoute un fichier avant de lancer l’analyse.");
      return;
    }

    setLoading(true);
    setError(null);
    setResult(null);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("separator", separator);
    formData.append("encoding", encoding);
    formData.append("skiprows", String(skiprows));

    try {
      const response = await fetch("http://127.0.0.1:8000/preview", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const payload = await response.json();
        throw new Error(payload.detail ?? "Erreur API inconnue.");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erreur inconnue.");
    } finally {
      setLoading(false);
    }
  }

  const columns = result?.preview_table?.[0]
    ? Object.keys(result.preview_table[0])
    : [];

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <section className="mx-auto flex max-w-7xl flex-col gap-10 px-6 py-10">
        <header className="flex flex-col gap-4">
          <div className="inline-flex w-fit items-center gap-2 rounded-full border border-cyan-400/30 bg-cyan-400/10 px-4 py-2 text-sm text-cyan-200">
            <Sparkles className="h-4 w-4" />
            AI Data Report Generator
          </div>

          <div className="max-w-3xl">
            <h1 className="text-4xl font-semibold tracking-tight md:text-6xl">
              Inspecte un dataset en quelques secondes.
            </h1>
            <p className="mt-4 text-lg text-slate-400">
              Upload CSV ou Excel, détection des problèmes de lecture,
              score qualité, recommandations et preview exploitable.
            </p>
          </div>
        </header>

        <section className="grid gap-6 lg:grid-cols-[420px_1fr]">
          <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6 shadow-2xl">
            <h2 className="text-xl font-medium">Dataset upload</h2>
            <p className="mt-2 text-sm text-slate-400">
              Commence par un fichier de démonstration ou ton propre dataset.
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
                }}
              />
            </label>

            <div className="mt-6 grid gap-4">
              <div>
                <label className="text-sm text-slate-300">Séparateur CSV</label>
                <input
                  value={separator}
                  onChange={(event) => setSeparator(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="text-sm text-slate-300">Encoding</label>
                <input
                  value={encoding}
                  onChange={(event) => setEncoding(event.target.value)}
                  className="mt-2 w-full rounded-xl border border-slate-700 bg-slate-950 px-4 py-3 text-sm outline-none focus:border-cyan-400"
                />
              </div>

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
              disabled={loading}
              className="mt-6 w-full rounded-xl bg-cyan-400 px-5 py-3 font-medium text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Analyse en cours..." : "Analyser le fichier"}
            </button>

            {error && (
              <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
                {error}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-6">
            {!result && (
              <div className="flex min-h-[420px] items-center justify-center rounded-3xl border border-slate-800 bg-slate-900/40 p-10 text-center text-slate-500">
                Les résultats apparaîtront ici après analyse.
              </div>
            )}

            {result && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <MetricCard
                    label="Quality score"
                    value={`${result.quality_score}/100`}
                  />
                  <MetricCard
                    label="Rows"
                    value={String(result.dataset_info.rows)}
                  />
                  <MetricCard
                    label="Columns"
                    value={String(result.dataset_info.columns)}
                  />
                  <MetricCard
                    label="Missing cells"
                    value={String(result.dataset_info.missing_cells)}
                  />
                </div>

                <div className="rounded-3xl border border-slate-800 bg-slate-900/80 p-6">
                  <h2 className="text-xl font-medium">Diagnostic rapide</h2>
                  <div className="mt-4 grid gap-3">
                    {result.user_report.map((item) => (
                      <div
                        key={item.question}
                        className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4"
                      >
                        <div className="flex items-start gap-3">
                          {item.status === "ok" ? (
                            <CheckCircle2 className="mt-1 h-5 w-5 text-emerald-400" />
                          ) : (
                            <AlertTriangle className="mt-1 h-5 w-5 text-amber-400" />
                          )}
                          <div>
                            <p className="font-medium">{item.question}</p>
                            <p className="mt-1 text-sm text-slate-300">
                              {item.answer}
                            </p>
                            {item.suggestion && (
                              <p className="mt-2 text-sm text-cyan-300">
                                {item.suggestion}
                              </p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {result.recommended_actions.length > 0 && (
                  <div className="rounded-3xl border border-cyan-400/30 bg-cyan-400/10 p-6">
                    <h2 className="text-xl font-medium text-cyan-100">
                      Actions recommandées
                    </h2>
                    <div className="mt-4 grid gap-3">
                      {result.recommended_actions.map((action) => (
                        <div
                          key={action.label}
                          className="rounded-2xl bg-slate-950/70 p-4"
                        >
                          <p className="font-medium">{action.label}</p>
                          <p className="mt-1 text-sm text-slate-300">
                            {action.reason}
                          </p>
                          <p className="mt-2 text-sm text-cyan-300">
                            {action.parameter}: {String(action.current_value)} →{" "}
                            {String(action.recommended_value)}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
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
                          {result.preview_table.map((row, rowIndex) => (
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
          </div>
        </section>
      </section>
    </main>
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