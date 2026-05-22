'use client';

/**
 * Atlas Analytics — SVG chart primitives (inline SVG, no external chart libs)
 * Ported from atlas-analytics-charts.jsx
 * All charts scale to their container via viewBox + preserveAspectRatio.
 */

import React from 'react';

// ─────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────

export interface SparklineProps {
  data: number[];
  color?: string;
  area?: boolean;
  height?: number;
}

export interface ChartSeries {
  name: string;
  color: string;
  data: number[];
}

export interface ChartPadding {
  t: number;
  r: number;
  b: number;
  l: number;
}

export interface LineChartProps {
  series: ChartSeries[];
  xLabels: string[];
  yTicks?: number[];
  height?: number;
  area?: boolean;
  dotted?: boolean;
  showAxis?: boolean;
  padding?: ChartPadding;
}

export interface BarChartProps {
  data: number[];
  xLabels: string[];
  color?: string;
  height?: number;
  padding?: ChartPadding;
}

export interface DonutSegment {
  name: string;
  value: number;
  color: string;
}

export interface DonutProps {
  segments: DonutSegment[];
  size?: number;
  stroke?: number;
}

// ─────────────────────────────────────────────
// Sparkline — small inline trend line
// ─────────────────────────────────────────────
export function Sparkline({ data, color = 'var(--at-accent)', area = true, height = 28 }: SparklineProps) {
  const w = 100;
  const h = height;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const stepX = w / (data.length - 1);
  const points = data.map((v, i): [number, number] => [
    i * stepX,
    h - ((v - min) / range) * (h - 4) - 2,
  ]);
  const linePath = 'M ' + points.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join(' L ');
  const areaPath = linePath + ` L ${w} ${h} L 0 ${h} Z`;
  const last = points[points.length - 1];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block' }}>
      {area && <path d={areaPath} fill={color} fillOpacity="0.12" />}
      <path d={linePath} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
      <circle cx={last[0]} cy={last[1]} r="2" fill={color} />
    </svg>
  );
}

// ─────────────────────────────────────────────
// Line / area chart — full-size with axis labels
// ─────────────────────────────────────────────
export function LineChart({
  series,
  xLabels,
  yTicks,
  height = 200,
  area = true,
  dotted,
  showAxis = true,
  padding = { t: 8, r: 8, b: 18, l: 28 },
}: LineChartProps) {
  const w = 400;
  const h = height;
  const p = padding;
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const allVals = series.flatMap((s) => s.data);
  const max = Math.max(...allVals);
  const min = 0; // anchor at 0
  const range = max - min || 1;
  const len = series[0].data.length;
  const stepX = innerW / (len - 1);

  const yTickVals: number[] = yTicks ?? [0, max * 0.25, max * 0.5, max * 0.75, max].map((v) => Math.round(v));

  const pathFor = (d: number[], asArea: boolean): string => {
    const pts = d.map((v, i): [number, number] => [
      p.l + i * stepX,
      p.t + innerH - ((v - min) / range) * innerH,
    ]);
    const linePath = 'M ' + pts.map((pt) => `${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' L ');
    if (!asArea) return linePath;
    return linePath + ` L ${p.l + innerW} ${p.t + innerH} L ${p.l} ${p.t + innerH} Z`;
  };

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
      {showAxis && yTickVals.map((v, i) => {
        const y = p.t + innerH - ((v - min) / range) * innerH;
        return (
          <g key={i}>
            <line x1={p.l} x2={p.l + innerW} y1={y} y2={y} stroke="var(--at-rule-soft)" strokeWidth="1" />
            <text x={p.l - 4} y={y + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" fill="var(--at-ink-faint)" letterSpacing=".04em">
              {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            </text>
          </g>
        );
      })}
      {showAxis && (
        <line x1={p.l} x2={p.l + innerW} y1={p.t + innerH} y2={p.t + innerH} stroke="var(--at-rule)" strokeWidth="1" />
      )}

      {area && series.map((s, si) => (
        <path key={si} d={pathFor(s.data, true)} fill={s.color} fillOpacity={si === 0 ? 0.12 : 0.06} />
      ))}
      {series.map((s, si) => (
        <path
          key={si}
          d={pathFor(s.data, false)}
          fill="none"
          stroke={s.color}
          strokeWidth="1.5"
          vectorEffect="non-scaling-stroke"
          strokeDasharray={dotted && si > 0 ? '3 3' : undefined}
        />
      ))}

      {showAxis && xLabels.map((l, i) => {
        const skip = Math.ceil(xLabels.length / 6);
        if (i % skip !== 0 && i !== xLabels.length - 1) return null;
        return (
          <text key={i} x={p.l + i * stepX} y={h - 4} textAnchor="middle" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" fill="var(--at-ink-faint)" letterSpacing=".04em">
            {l}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Bar chart — vertical, single series
// ─────────────────────────────────────────────
export function BarChart({
  data,
  xLabels,
  color = 'var(--at-accent)',
  height = 200,
  padding = { t: 8, r: 8, b: 18, l: 28 },
}: BarChartProps) {
  const w = 400;
  const h = height;
  const p = padding;
  const innerW = w - p.l - p.r;
  const innerH = h - p.t - p.b;
  const max = Math.max(...data);
  const barW = innerW / data.length;
  const gap = barW * 0.18;
  const yTicks = [0, Math.round(max * 0.5), max];

  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" style={{ width: '100%', height: '100%', display: 'block', overflow: 'visible' }}>
      {yTicks.map((v, i) => {
        const y = p.t + innerH - (v / max) * innerH;
        return (
          <g key={i}>
            <line x1={p.l} x2={p.l + innerW} y1={y} y2={y} stroke="var(--at-rule-soft)" strokeWidth="1" />
            <text x={p.l - 4} y={y + 3} textAnchor="end" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" fill="var(--at-ink-faint)" letterSpacing=".04em">
              {v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
            </text>
          </g>
        );
      })}
      <line x1={p.l} x2={p.l + innerW} y1={p.t + innerH} y2={p.t + innerH} stroke="var(--at-rule)" strokeWidth="1" />
      {data.map((v, i) => {
        const hh = (v / max) * innerH;
        return (
          <rect
            key={i}
            x={p.l + i * barW + gap / 2}
            y={p.t + innerH - hh}
            width={barW - gap}
            height={hh}
            fill={color}
            rx="1"
          />
        );
      })}
      {xLabels.map((l, i) => {
        const skip = Math.ceil(xLabels.length / 8);
        if (i % skip !== 0 && i !== xLabels.length - 1) return null;
        return (
          <text key={i} x={p.l + i * barW + barW / 2} y={h - 4} textAnchor="middle" fontSize="9" fontFamily="var(--font-geist-mono, monospace)" fill="var(--at-ink-faint)" letterSpacing=".04em">
            {l}
          </text>
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Donut — segmented circle
// ─────────────────────────────────────────────
export function Donut({ segments, size = 140, stroke = 18 }: DonutProps) {
  const total = segments.reduce((a, s) => a + s.value, 0);
  const r = size / 2 - stroke / 2;
  const c = 2 * Math.PI * r;
  let acc = 0;

  return (
    <svg viewBox={`0 0 ${size} ${size}`} style={{ width: '100%', height: '100%' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--at-paper-3)" strokeWidth={stroke} />
      {segments.map((s, i) => {
        const len = (s.value / total) * c;
        const dash = `${len} ${c - len}`;
        const offset = -acc;
        acc += len;
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={s.color}
            strokeWidth={stroke}
            strokeDasharray={dash}
            strokeDashoffset={offset}
            transform={`rotate(-90 ${size / 2} ${size / 2})`}
            strokeLinecap="butt"
          />
        );
      })}
    </svg>
  );
}

// ─────────────────────────────────────────────
// Mini chart icons for the widget palette
// ─────────────────────────────────────────────
export function MiniLine() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <path d="M 2 22 L 12 14 L 22 18 L 32 8 L 42 12 L 58 4" fill="none" stroke="currentColor" strokeWidth="1.5" />
      <circle cx="58" cy="4" r="1.6" fill="currentColor" />
    </svg>
  );
}

export function MiniArea() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <path d="M 2 22 L 12 14 L 22 18 L 32 8 L 42 12 L 58 4 L 58 26 L 2 26 Z" fill="currentColor" fillOpacity="0.2" stroke="currentColor" strokeWidth="1.2" />
    </svg>
  );
}

export function MiniBar() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {([18, 10, 14, 6, 12, 4, 9] as number[]).map((v, i) => (
        <rect key={i} x={2 + i * 8} y={26 - v} width="5" height={v} fill="currentColor" />
      ))}
    </svg>
  );
}

export function MiniDonut() {
  return (
    <svg viewBox="0 0 28 28" style={{ width: '85%', height: '85%' }}>
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeOpacity="0.25" strokeWidth="5" />
      <circle cx="14" cy="14" r="9" fill="none" stroke="currentColor" strokeWidth="5" strokeDasharray="30 60" transform="rotate(-90 14 14)" />
    </svg>
  );
}

export function MiniKpi() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', gap: 2 }}>
      <div style={{ fontFamily: 'var(--font-display, Spectral, serif)', fontSize: 18, lineHeight: 1, color: 'currentColor' }}>$24k</div>
      <div style={{ fontFamily: 'var(--font-geist-mono, monospace)', fontSize: 7, color: 'currentColor', opacity: 0.6, letterSpacing: '.08em' }}>+12%</div>
    </div>
  );
}

export function MiniTable() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {([6, 11, 16, 21] as number[]).map((y, i) => (
        <g key={i}>
          <rect x="2" y={y} width="20" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
          <rect x="26" y={y} width="14" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
          <rect x="44" y={y} width="14" height="3" fill="currentColor" fillOpacity={i === 0 ? 0.5 : 0.25} />
        </g>
      ))}
    </svg>
  );
}

export function MiniFunnel() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      <rect x="2"  y="3"  width="56" height="4" fill="currentColor" fillOpacity="0.7" />
      <rect x="8"  y="9"  width="44" height="4" fill="currentColor" fillOpacity="0.55" />
      <rect x="16" y="15" width="28" height="4" fill="currentColor" fillOpacity="0.4" />
      <rect x="22" y="21" width="16" height="4" fill="currentColor" fillOpacity="0.25" />
    </svg>
  );
}

export function MiniFeed() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {([4, 10, 16, 22] as number[]).map((y, i) => (
        <g key={i}>
          <circle cx="6" cy={y + 2} r="1.5" fill="currentColor" />
          <rect x="12" y={y + 0.5} width={30 + i * 4} height="3" fill="currentColor" fillOpacity="0.4" />
        </g>
      ))}
    </svg>
  );
}

export function MiniHeat() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '90%', height: '85%' }}>
      {([0, 1, 2, 3] as number[]).map((r) =>
        ([0, 1, 2, 3, 4, 5, 6, 7] as number[]).map((c) => {
          const v = Math.abs(Math.sin(r * 1.7 + c * 0.9));
          return (
            <rect key={`${r}-${c}`} x={2 + c * 7} y={2 + r * 6} width="6" height="5" fill="currentColor" fillOpacity={0.15 + v * 0.75} />
          );
        })
      )}
    </svg>
  );
}

export function MiniMap() {
  return (
    <svg viewBox="0 0 60 28" style={{ width: '85%', height: '85%' }}>
      <path d="M 4 14 Q 12 4 24 8 T 44 6 Q 54 8 56 18 T 30 24 Q 14 22 4 14 Z" fill="currentColor" fillOpacity="0.18" stroke="currentColor" strokeWidth="1" />
      <circle cx="18" cy="13" r="1.5" fill="currentColor" />
      <circle cx="34" cy="11" r="2.5" fill="currentColor" />
      <circle cx="46" cy="16" r="1.8" fill="currentColor" />
    </svg>
  );
}
