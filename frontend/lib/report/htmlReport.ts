import type { AuditReportPayload } from "./reportTypes";
import {
  escapeHtml,
  getScoreColor,
  getScoreLabel,
  removeExtension,
} from "./reportUtils";
import {
  buildColumnTypesSvg,
  buildMissingValuesSvg,
  buildScoreGauge,
} from "./svgCharts";

export function generateHtmlAuditReport(payload: AuditReportPayload) {
  const { filename, sheetName, loadingOptions, analysis, aiInsights } = payload;

  const generatedAt = new Date().toLocaleString("fr-FR");
  const scoreColor = getScoreColor(analysis.quality_score);
  const scoreLabel = getScoreLabel(analysis.quality_score);

  const issuesHtml =
    analysis.issues.length > 0
      ? analysis.issues
          .map(
            (issue) => `
              <article class="issue-card">
                <span class="pill warning">${escapeHtml(issue.severity)}</span>
                <h3>${escapeHtml(issue.type)}</h3>
                <p>${escapeHtml(issue.message)}</p>
              </article>
            `
          )
          .join("")
      : `<p class="muted">No major issue detected.</p>`;

  const recommendationsHtml =
    analysis.recommendations.length > 0
      ? analysis.recommendations
          .map(
            (recommendation) => `
              <article class="recommendation-card">
                <h3>${escapeHtml(recommendation.label)}</h3>
                <p>${escapeHtml(recommendation.reason)}</p>
                <strong>${escapeHtml(recommendation.action)}</strong>
              </article>
            `
          )
          .join("")
      : `<p class="muted">No critical recommendation.</p>`;

  const aiHtml = aiInsights
    ? `
      <section class="section ai-section">
        <div class="section-title">
          <span class="eyebrow violet">AI INTERPRETATION</span>
          <h2>AI audit insights</h2>
        </div>

        <div class="ai-summary">
          <div>
            <span class="pill violet">${escapeHtml(aiInsights.risk_level)} risk</span>
            <p>${escapeHtml(aiInsights.executive_summary)}</p>
          </div>
          <div>
            <h3>Business impact</h3>
            <p>${escapeHtml(aiInsights.business_impact)}</p>
          </div>
        </div>

        <div class="two-columns">
          <div class="card">
            <h3>Key findings</h3>
            <ul>
              ${aiInsights.key_findings
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}
            </ul>
          </div>

          <div class="card">
            <h3>Priority actions</h3>
            <ul>
              ${aiInsights.priority_actions
                .map((item) => `<li>${escapeHtml(item)}</li>`)
                .join("")}
            </ul>
          </div>
        </div>
      </section>
    `
    : `
      <section class="section ai-section muted-ai">
        <div class="section-title">
          <span class="eyebrow violet">AI INTERPRETATION</span>
          <h2>AI audit insights</h2>
        </div>
        <p class="muted">
          AI insights were not generated for this report. Run “Generate AI insights”
          in the application before exporting the report to include the executive
          interpretation layer.
        </p>
      </section>
    `;

  return `<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Data Quality Audit Report - ${escapeHtml(filename)}</title>
  <style>
    :root {
      --bg: #090909;
      --panel: rgba(255,255,255,0.04);
      --panel-strong: rgba(15,23,42,0.82);
      --border: rgba(255,255,255,0.11);
      --text: #f8fafc;
      --muted: #94a3b8;
      --orange: #fb923c;
      --orange-soft: rgba(251,146,60,0.12);
      --violet: #a78bfa;
      --violet-soft: rgba(167,139,250,0.13);
      --green: #34d399;
      --red: #f87171;
    }

    * { box-sizing: border-box; }

    body {
      margin: 0;
      color: var(--text);
      background:
        radial-gradient(circle at 10% 0%, rgba(251,146,60,0.22), transparent 34rem),
        radial-gradient(circle at 95% 10%, rgba(167,139,250,0.18), transparent 28rem),
        linear-gradient(180deg, #0b0b0b 0%, #060606 100%);
      font-family: Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif;
      line-height: 1.5;
    }

    .page {
      max-width: 1180px;
      margin: 0 auto;
      padding: 56px 24px 84px;
    }

    .topline {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      align-items: center;
      flex-wrap: wrap;
    }

    .badge,
    .pill {
      display: inline-flex;
      width: fit-content;
      align-items: center;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 800;
      letter-spacing: 0.08em;
      text-transform: uppercase;
      padding: 8px 12px;
    }

    .badge {
      border: 1px solid rgba(251,146,60,0.35);
      background: var(--orange-soft);
      color: #fed7aa;
    }

    .pill.warning {
      color: #fed7aa;
      background: var(--orange-soft);
      border: 1px solid rgba(251,146,60,0.30);
    }

    .pill.violet {
      color: #ddd6fe;
      background: var(--violet-soft);
      border: 1px solid rgba(167,139,250,0.35);
    }

    .hero {
      margin-top: 26px;
      display: grid;
      grid-template-columns: minmax(0, 1.55fr) minmax(260px, 0.65fr);
      gap: 24px;
      align-items: stretch;
    }

    .hero-card,
    .score-card,
    .card,
    .metric,
    .section {
      border: 1px solid var(--border);
      background: var(--panel);
      backdrop-filter: blur(18px);
      box-shadow: 0 24px 80px rgba(0,0,0,0.34);
    }

    .hero-card,
    .score-card,
    .section {
      border-radius: 32px;
      padding: 30px;
    }

    h1 {
      margin: 0;
      max-width: 820px;
      font-size: clamp(44px, 7vw, 88px);
      line-height: 0.92;
      letter-spacing: -0.075em;
    }

    .subtitle {
      margin-top: 22px;
      max-width: 760px;
      color: var(--muted);
      font-size: 18px;
    }

    .meta-grid {
      margin-top: 26px;
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px;
    }

    .meta-item {
      border: 1px solid rgba(148,163,184,0.16);
      background: rgba(2,6,23,0.44);
      border-radius: 16px;
      padding: 12px 14px;
      color: var(--muted);
      font-size: 13px;
    }

    .meta-item strong {
      display: block;
      color: var(--text);
      font-size: 14px;
    }

    .score-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      border-color: rgba(251,146,60,0.26);
      background: linear-gradient(145deg, rgba(251,146,60,0.16), rgba(255,255,255,0.04));
      text-align: center;
    }

    .score-label {
      margin-top: 10px;
      color: ${scoreColor};
      font-weight: 900;
      letter-spacing: -0.02em;
    }

    .metrics {
      margin-top: 24px;
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 14px;
    }

    .metric {
      border-radius: 22px;
      padding: 20px;
      background: rgba(15,23,42,0.54);
    }

    .metric span {
      display: block;
      color: var(--muted);
      font-size: 13px;
    }

    .metric strong {
      display: block;
      margin-top: 8px;
      font-size: 30px;
      letter-spacing: -0.05em;
    }

    .section {
      margin-top: 24px;
    }

    .section-title {
      margin-bottom: 20px;
    }

    .eyebrow {
      display: block;
      margin-bottom: 8px;
      color: #fed7aa;
      font-size: 12px;
      font-weight: 900;
      letter-spacing: 0.18em;
    }

    .eyebrow.violet {
      color: #ddd6fe;
    }

    h2 {
      margin: 0;
      font-size: 28px;
      letter-spacing: -0.045em;
    }

    h3 {
      margin: 0 0 8px;
      font-size: 16px;
    }

    .two-columns {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 18px;
    }

    .card {
      border-radius: 24px;
      padding: 22px;
      background: rgba(2,6,23,0.54);
    }

    .issue-card,
    .recommendation-card {
      border: 1px solid rgba(148,163,184,0.18);
      background: rgba(2,6,23,0.58);
      border-radius: 20px;
      padding: 18px;
      margin-top: 12px;
    }

    .issue-card p,
    .recommendation-card p {
      margin: 0;
      color: #cbd5e1;
    }

    .recommendation-card strong {
      display: block;
      margin-top: 10px;
      color: #fed7aa;
    }

    .ai-section {
      border-color: rgba(167,139,250,0.26);
      background:
        radial-gradient(circle at top right, rgba(167,139,250,0.16), transparent 18rem),
        rgba(255,255,255,0.04);
    }

    .ai-summary {
      display: grid;
      grid-template-columns: 1.1fr 0.9fr;
      gap: 18px;
      margin-bottom: 18px;
    }

    .ai-summary > div {
      border: 1px solid rgba(167,139,250,0.18);
      background: rgba(2,6,23,0.52);
      border-radius: 24px;
      padding: 22px;
    }

    ul {
      margin: 12px 0 0;
      padding-left: 20px;
      color: #cbd5e1;
    }

    li + li {
      margin-top: 8px;
    }

    .type-grid {
      display: grid;
      grid-template-columns: repeat(3, minmax(0, 1fr));
      gap: 12px;
    }

    .type-tile {
      border: 1px solid rgba(148,163,184,0.18);
      background: rgba(2,6,23,0.58);
      border-radius: 18px;
      padding: 16px;
    }

    .type-tile span {
      display: block;
      color: #cbd5e1;
      font-weight: 700;
    }

    .type-tile strong {
      display: block;
      margin-top: 10px;
      color: #fed7aa;
      font-size: 32px;
      letter-spacing: -0.06em;
    }

    .type-tile small {
      display: block;
      margin-top: 4px;
      color: var(--muted);
    }

    .empty-chart {
      color: var(--muted);
      border: 1px dashed rgba(148,163,184,0.30);
      border-radius: 18px;
      padding: 24px;
    }

    .muted {
      color: var(--muted);
    }

    .footer {
      margin-top: 28px;
      text-align: center;
      color: var(--muted);
      font-size: 13px;
    }

    @media (max-width: 900px) {
      .hero,
      .two-columns,
      .ai-summary,
      .metrics,
      .type-grid,
      .meta-grid {
        grid-template-columns: 1fr;
      }
    }

    @media print {
      body {
        background: #ffffff;
        color: #111827;
      }

      .page {
        max-width: none;
        padding: 24px;
      }

      .hero-card,
      .score-card,
      .card,
      .metric,
      .section {
        box-shadow: none;
        background: #ffffff;
        color: #111827;
      }
    }
  </style>
</head>
<body>
  <main class="page">
    <div class="topline">
      <div class="badge">AI-assisted Data Quality Auditor</div>
      <div class="muted">Generated ${escapeHtml(generatedAt)}</div>
    </div>

    <section class="hero">
      <div class="hero-card">
        <h1>Dataset quality audit</h1>
        <p class="subtitle">
          Executive audit report for CSV and Excel datasets. This report combines
          deterministic data quality checks with an optional AI interpretation layer.
        </p>

        <div class="meta-grid">
          <div class="meta-item"><strong>Dataset</strong>${escapeHtml(filename)}</div>
          <div class="meta-item"><strong>Sheet</strong>${escapeHtml(sheetName ?? "N/A")}</div>
          <div class="meta-item"><strong>Encoding</strong>${escapeHtml(loadingOptions.encoding)}</div>
          <div class="meta-item"><strong>Separator</strong>${escapeHtml(loadingOptions.separator)}</div>
        </div>
      </div>

      <aside class="score-card">
        ${buildScoreGauge(analysis.quality_score)}
        <div class="score-label">${scoreLabel}</div>
      </aside>
    </section>

    <section class="metrics">
      <div class="metric"><span>Rows</span><strong>${analysis.quality_summary.rows}</strong></div>
      <div class="metric"><span>Columns</span><strong>${analysis.quality_summary.columns}</strong></div>
      <div class="metric"><span>Duplicates</span><strong>${analysis.quality_summary.duplicate_count}</strong></div>
      <div class="metric"><span>Constant columns</span><strong>${analysis.quality_summary.constant_columns_count}</strong></div>
    </section>

    ${aiHtml}

    <section class="section">
      <div class="section-title">
        <span class="eyebrow">VISUAL DIAGNOSTICS</span>
        <h2>Missing values</h2>
      </div>
      ${buildMissingValuesSvg(analysis)}
    </section>

    <section class="section">
      <div class="section-title">
        <span class="eyebrow">SCHEMA PROFILING</span>
        <h2>Column type distribution</h2>
      </div>
      ${buildColumnTypesSvg(analysis)}
    </section>

    <section class="section">
      <div class="section-title">
        <span class="eyebrow">QUALITY FINDINGS</span>
        <h2>Detected issues and recommendations</h2>
      </div>

      <div class="two-columns">
        <div class="card">
          <h3>Detected issues</h3>
          ${issuesHtml}
        </div>

        <div class="card">
          <h3>Recommendations</h3>
          ${recommendationsHtml}
        </div>
      </div>
    </section>

    <p class="footer">
      Generated by AI-assisted Data Quality Auditor · Static standalone HTML report · SVG diagnostics included
    </p>
  </main>
</body>
</html>`;
}