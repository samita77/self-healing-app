import type { EChartsOption } from "echarts";
import EChart from "@/components/ui/EChart";
import { chart } from "@/lib/chartTheme";
type Props = { score: number; warning?: number; healthy?: number };
export default function HealthGauge({ score, warning = 50, healthy = 80 }: Props) {
  const clamped = Math.max(0, Math.min(100, score));
  const tone = clamped >= healthy ? "text-healthy" : clamped >= warning ? "text-warning" : "text-failed";
  const option: EChartsOption = { animationDuration: 700, series: [{ type: "gauge", min: 0, max: 100, startAngle: 210, endAngle: -30, center: ["50%", "58%"], radius: "90%", pointer: { show: true, length: "58%", width: 4, itemStyle: { color: chart.ink } }, progress: { show: false }, axisLine: { lineStyle: { width: 14, color: [[warning / 100, chart.failed], [healthy / 100, chart.warning], [1, chart.healthy]] } }, axisTick: { show: false }, splitLine: { show: false }, axisLabel: { show: false }, detail: { show: false }, title: { show: false }, data: [{ value: clamped }] }] };
  return <div className="flex flex-col items-center gap-1 sm:flex-row sm:gap-6"><EChart option={option} height={170} className="max-w-[240px]" label={`Health score ${clamped} out of 100`} /><div className="text-center sm:text-left"><p className={`text-4xl font-semibold tabular-nums ${tone}`}>{clamped}</p><p className="mt-1 text-xs text-ink-muted">out of 100 · target {healthy}</p></div></div>;
}
