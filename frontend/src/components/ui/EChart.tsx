import { useEffect, useRef } from "react";
import * as echarts from "echarts/core";
import type { EChartsOption, EChartsType } from "echarts";
import { CanvasRenderer } from "echarts/renderers";
import { BarChart, GaugeChart, LineChart } from "echarts/charts";
import { GridComponent, LegendComponent, TooltipComponent } from "echarts/components";

echarts.use([CanvasRenderer, BarChart, GaugeChart, LineChart, GridComponent, LegendComponent, TooltipComponent]);
export default function EChart({ option, height = 260, className = "", label }: { option: EChartsOption; height?: number; className?: string; label: string }) {
  const el = useRef<HTMLDivElement>(null);
  const chart = useRef<EChartsType | null>(null);
  useEffect(() => {
    if (!el.current) return;
    chart.current = echarts.init(el.current, undefined, { renderer: "canvas" });
    const resize = new ResizeObserver(() => chart.current?.resize());
    resize.observe(el.current);
    return () => { resize.disconnect(); chart.current?.dispose(); chart.current = null; };
  }, []);
  useEffect(() => { chart.current?.setOption(option, { notMerge: true }); }, [option]);
  return <div ref={el} role="img" aria-label={label} className={className} style={{ width: "100%", height }} />;
}
