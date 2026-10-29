/**
 * Chart palette for ECharts. Kept as plain hexes (ECharts configs don't read
 * CSS variables) — mirrored from `--color-*` tokens in styles/globals.css.
 */
export const chart = {
  primary: "#1e40af", // blue-600
  healthy: "#16a34a", // green-600
  warning: "#f59e0b", // amber-500
  failed: "#dc2626", // red-500
  ink: "#0f172a",
  inkMuted: "#64748b",
  grid: "#e2e8f0",
  fontFamily:
    '"Geist Variable", ui-sans-serif, system-ui, sans-serif',
} as const;

/** Shared light-mode ECharts defaults: fonts, grid, tooltip. */
export function baseGrid() {
  return {
    left: 12,
    right: 16,
    top: 32,
    bottom: 8,
    containLabel: true,
  };
}

export function baseTooltip() {
  return {
    trigger: "axis" as const,
    backgroundColor: "#ffffff",
    borderColor: chart.grid,
    borderWidth: 1,
    padding: [8, 10] as [number, number],
    textStyle: { color: chart.ink, fontFamily: chart.fontFamily, fontSize: 12 },
  };
}

export function baseCategoryAxis(categories: string[]) {
  return {
    type: "category" as const,
    data: categories,
    axisLine: { lineStyle: { color: chart.grid } },
    axisTick: { show: false },
    axisLabel: { color: chart.inkMuted, fontFamily: chart.fontFamily, fontSize: 11 },
  };
}

export function baseValueAxis() {
  return {
    type: "value" as const,
    splitLine: { lineStyle: { color: chart.grid } },
    axisLabel: { color: chart.inkMuted, fontFamily: chart.fontFamily, fontSize: 11 },
  };
}
