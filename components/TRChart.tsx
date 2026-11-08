'use client';

import React, { useMemo, useState, useEffect, useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
} from 'recharts';
import { formatEUR } from '@/lib/types';
import { ChartRange } from '@/app/api/chart/route';

export interface ChartPoint {
  timestamp: string;
  label: string;
  priceEur: number;
}

interface TRChartProps {
  series: ChartPoint[];
  range: ChartRange;
  onRangeChange: (r: ChartRange) => void;
  privacyMode?: boolean;
  height?: number;
  loading?: boolean;
}

const RANGES: ChartRange[] = ['1D', '1S', '1M', '1A', 'MAX'];

export function TRChart({
  series,
  range,
  onRangeChange,
  privacyMode = false,
  height = 200,
  loading = false,
}: TRChartProps) {
  const [mounted, setMounted] = useState(false);
  const [hoverPoint, setHoverPoint] = useState<ChartPoint | null>(null);
  const reactId = useId();
  const gradientId = useMemo(
    () => `trGrad_${reactId.replace(/[^a-zA-Z0-9]/g, '')}`,
    [reactId]
  );

  useEffect(() => {
    setMounted(true);
  }, []);

  const { isPositive, diffEur, diffPct, minVal, maxVal } = useMemo(() => {
    try {
      if (!series || series.length < 2) {
        return {
          isPositive: true,
          diffEur: 0,
          diffPct: 0,
          minVal: 0,
          maxVal: 100,
        };
      }
      const first = Number(series[0]?.priceEur || 0);
      const last = hoverPoint
        ? Number(hoverPoint.priceEur || 0)
        : Number(series[series.length - 1]?.priceEur || 0);
      const diff = last - first;
      const pct = first > 0 ? (diff / first) * 100 : 0;

      const prices = series.map((s) => Number(s.priceEur || 0));
      const min = Math.min(...prices);
      const max = Math.max(...prices);
      const pad = (max - min) * 0.08 || 1;

      return {
        isPositive: diff >= 0,
        diffEur: diff,
        diffPct: pct,
        minVal: min - pad,
        maxVal: max + pad,
      };
    } catch {
      return {
        isPositive: true,
        diffEur: 0,
        diffPct: 0,
        minVal: 0,
        maxVal: 100,
      };
    }
  }, [series, hoverPoint]);

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';

  return (
    <div className="w-full select-none pointer-events-auto">
      {/* Period performance subtitle */}
      <div className="flex items-center justify-between mb-2 px-1">
        <div className="flex items-center gap-2 text-xs font-medium">
          <span
            className="px-2 py-0.5 rounded-md font-semibold"
            style={{
              backgroundColor: isPositive
                ? 'rgba(16, 185, 129, 0.15)'
                : 'rgba(244, 63, 94, 0.15)',
              color: strokeColor,
            }}
          >
            {privacyMode
              ? '•••• €'
              : `${diffEur >= 0 ? '+' : ''}${formatEUR(diffEur)} (${
                  diffPct >= 0 ? '+' : ''
                }${diffPct.toFixed(2)}%)`}
          </span>
          <span className="text-zinc-400">
            {hoverPoint ? hoverPoint.label : `Periodo ${range}`}
          </span>
        </div>
        {loading && (
          <span className="text-[11px] text-zinc-500 animate-pulse">
            Sincronizando gráfico...
          </span>
        )}
      </div>

      {/* Chart Area (Safe Client-Only Mount to Prevent Hydration Mismatch) */}
      <div style={{ width: '100%', height }} className="relative">
        {mounted && series && series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
              onMouseMove={(state: any) => {
                try {
                  if (state?.activePayload?.[0]?.payload) {
                    setHoverPoint(state.activePayload[0].payload as ChartPoint);
                  }
                } catch {
                  // ignore
                }
              }}
              onMouseLeave={() => setHoverPoint(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.32} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis domain={[minVal, maxVal]} hide />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-xl bg-[#1C1C1E]/95 border border-[#2C2C2E] px-3 py-1.5 shadow-lg backdrop-blur-md">
                      <div className="text-[11px] text-zinc-400">{pt.label}</div>
                      <div className="text-sm font-bold text-white">
                        {formatEUR(pt.priceEur, privacyMode)}
                      </div>
                    </div>
                  );
                }}
                cursor={{
                  stroke: '#52525B',
                  strokeWidth: 1,
                  strokeDasharray: '3 3',
                }}
              />
              <Area
                type="monotone"
                dataKey="priceEur"
                stroke={strokeColor}
                strokeWidth={2.25}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full rounded-xl bg-zinc-900/40 border border-[#2C2C2E]/40 flex items-center justify-center text-xs text-zinc-500">
            Cargando serie en Euros...
          </div>
        )}
      </div>

      {/* Range Selectors (1D, 1S, 1M, 1A, MAX) */}
      <div className="flex items-center justify-between gap-1 mt-3 pt-2 border-t border-[#2C2C2E]/60">
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`flex-1 py-1.5 rounded-xl text-xs font-semibold transition cursor-pointer ${
                active
                  ? 'bg-zinc-800 text-white shadow-sm'
                  : 'text-zinc-400 hover:text-zinc-200'
              }`}
            >
              {r}
            </button>
          );
        })}
      </div>
    </div>
  );
}
