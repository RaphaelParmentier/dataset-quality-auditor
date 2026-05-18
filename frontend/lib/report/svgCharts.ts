import type { AnalysisReport } from "./reportTypes";
import { escapeHtml, formatColumnType, getScoreColor } from "./reportUtils";

export function buildScoreGauge(score: number) {
  const radius = 72;
  const circumference = 2 * Math.PI * radius;
  const progress = Math.max(0, Math.min(100, score));
  const dashOffset = circumference - (progress / 100) * circumference;
  const color = getScoreColor(score);

  return `
    <svg class="score-svg" width="220" height="220" viewBox="0 0 220 220" role="img">
      <circle cx="110" cy="110" r="${radius}" fill="none" stroke="rgba(255,255,255,0.10)" stroke-width="18" />
      <circle
        cx="110"
        cy="110"
        r="${radius}"
        fill="none"
        stroke="${color}"
        stroke-width="18"
        stroke-linecap="round"
        stroke-dasharray="${circumference}"
        stroke-dashoffset="${dashOffset}"
        transform="rotate(-90 110 110)"
      />
      <text x="110" y="102" text-anchor="middle" fill="#f8fafc" font-size="44" font-weight="900">${score}</text>
      <text x="110" y="132" text-anchor="middle" fill="#94a3b8" font-size="14">QUALITY SCORE</text>
    </svg>
  `;
}

export function buildMissingValuesSvg(analysis: AnalysisReport) {
  const data = analysis.chart_data.missing_values_by_column.filter(
    (item) => item.missing_count > 0
  );

  if (data.length === 0) {
    return `<div class="empty-chart">No missing values detected.</div>`;
  }

  const width = 760;
  const rowHeight = 42;
  const height = Math.max(120, data.length * rowHeight + 40);
  const maxValue = Math.max(...data.map((item) => item.missing_count), 1);

  const rows = data
    .map((item, index) => {
      const y = index * rowHeight + 28;
      const barWidth = Math.max(4, (item.missing_count / maxValue) * 420);

      return `
        <text x="0" y="${y + 15}" fill="#cbd5e1" font-size="13">${escapeHtml(item.column)}</text>
        <rect x="220" y="${y}" width="${barWidth}" height="22" rx="11" fill="#fb923c" opacity="0.92" />
        <text x="${230 + barWidth}" y="${y + 16}" fill="#fed7aa" font-size="13" font-weight="700">
          ${item.missing_count} (${item.missing_percent}%)
        </text>
      `;
    })
    .join("");

  return `
    <svg width="100%" height="${height}" viewBox="0 0 ${width} ${height}" role="img">
      ${rows}
    </svg>
  `;
}

export function buildColumnTypesSvg(analysis: AnalysisReport) {
  const items = analysis.chart_data.column_types_distribution;

  if (items.length === 0) {
    return `<div class="empty-chart">No column type data available.</div>`;
  }

  return `
    <div class="type-grid">
      ${items
        .map(
          (item) => `
            <div class="type-tile">
              <span>${escapeHtml(formatColumnType(item.dtype))}</span>
              <strong>${item.count}</strong>
              <small>${escapeHtml(item.dtype)}</small>
            </div>
          `
        )
        .join("")}
    </div>
  `;
}