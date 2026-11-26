'use client';

import React, { useMemo, useState, useEffect, useId } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ReferenceLine,
} from 'recharts';
import { motion } from 'framer-motion';
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
  onScrubPoint?: (point: ChartPoint | null) => void;
}

const RANGES: ChartRange[] = ['1D', '1S', '1M', '1A', 'MAX'];

export function TRChart({
  series,
  range,
  onRangeChange,
  privacyMode = false,
  height = 200,
  loading = false,
  onScrubPoint,
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

  useEffect(() => {
    setHoverPoint(null);
    onScrubPoint?.(null);
  }, [range, series, onScrubPoint]);

  const handleUpdateHover = (pt: ChartPoint | null) => {
    setHoverPoint(pt);
    onScrubPoint?.(pt);
  };

  const { isPositive, diffEur, diffPct, minVal, maxVal, firstVal } =
    useMemo(() => {
      try {
        if (!series || series.length < 2) {
          return {
            isPositive: true,
            diffEur: 0,
            diffPct: 0,
            minVal: 0,
            maxVal: 100,
            firstVal: 0,
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
        const pad = (max - min) * 0.1 || 1;

        return {
          isPositive: diff >= 0,
          diffEur: diff,
          diffPct: pct,
          minVal: min - pad,
          maxVal: max + pad,
          firstVal: first,
        };
      } catch {
        return {
          isPositive: true,
          diffEur: 0,
          diffPct: 0,
          minVal: 0,
          maxVal: 100,
          firstVal: 0,
        };
      }
    }, [series, hoverPoint]);

  const strokeColor = isPositive ? '#10B981' : '#F43F5E';

  return (
    <div className="w-full select-none pointer-events-auto">
      {/* Period performance subtitle */}
      <div className="flex items-center justify-between mb-2.5 px-0.5">
        <div className="flex items-center gap-2 text-xs font-medium tabular-nums">
          <span
            className="px-2 py-0.5 rounded-md font-semibold tracking-tight transition-colors"
            style={{
              backgroundColor: isPositive
                ? 'rgba(16, 185, 129, 0.14)'
                : 'rgba(244, 63, 94, 0.14)',
              color: strokeColor,
            }}
          >
            {privacyMode
              ? '•••• €'
              : `${diffEur >= 0 ? '+' : ''}${formatEUR(diffEur)} (${
                  diffPct >= 0 ? '+' : ''
                }${diffPct.toFixed(2)}%)`}
          </span>
          <span className="text-zinc-500 text-[11px] font-medium">
            {hoverPoint ? hoverPoint.label : `Periodo ${range}`}
          </span>
        </div>
        {loading && (
          <span className="text-[11px] text-zinc-500 animate-pulse">
            Actualizando...
          </span>
        )}
      </div>

      {/* Chart Area with touch-pan-y so horizontal scrubbing and vertical scroll coexist cleanly */}
      <div
        style={{ width: '100%', height }}
        onTouchEnd={() => handleUpdateHover(null)}
        onTouchCancel={() => handleUpdateHover(null)}
        className="relative touch-pan-y"
      >
        {mounted && series && series.length > 0 ? (
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={series}
              margin={{ top: 8, right: 4, left: 4, bottom: 4 }}
              onMouseMove={(state: any) => {
                try {
                  if (state?.activePayload?.[0]?.payload) {
                    handleUpdateHover(
                      state.activePayload[0].payload as ChartPoint
                    );
                  }
                } catch {
                  // ignore
                }
              }}
              onTouchMove={(state: any) => {
                try {
                  if (state?.activePayload?.[0]?.payload) {
                    handleUpdateHover(
                      state.activePayload[0].payload as ChartPoint
                    );
                  }
                } catch {
                  // ignore
                }
              }}
              onMouseLeave={() => handleUpdateHover(null)}
            >
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor={strokeColor} stopOpacity={0.25} />
                  <stop offset="85%" stopColor={strokeColor} stopOpacity={0.02} />
                  <stop offset="100%" stopColor={strokeColor} stopOpacity={0.0} />
                </linearGradient>
              </defs>
              <XAxis dataKey="label" hide />
              <YAxis domain={[minVal, maxVal]} hide />
              {firstVal > 0 && (
                <ReferenceLine
                  y={firstVal}
                  stroke="rgba(255,255,255,0.14)"
                  strokeDasharray="3 3"
                  strokeWidth={1}
                />
              )}
              <Tooltip
                isAnimationActive={false}
                content={({ active, payload }) => {
                  if (!active || !payload || !payload.length) return null;
                  const pt = payload[0].payload as ChartPoint;
                  return (
                    <div className="rounded-xl bg-[#141416]/95 border border-white/[0.1] px-2.5 py-1.5 shadow-xl backdrop-blur-md tabular-nums">
                      <div className="text-[10px] font-medium text-zinc-400">
                        {pt.label}
                      </div>
                      <div className="text-xs font-bold text-white mt-0.5">
                        {formatEUR(pt.priceEur, privacyMode)}
                      </div>
                    </div>
                  );
                }}
                cursor={{
                  stroke: 'rgba(255, 255, 255, 0.28)',
                  strokeWidth: 1,
                  strokeDasharray: '2 2',
                }}
              />
              <Area
                type="monotone"
                dataKey="priceEur"
                stroke={strokeColor}
                strokeWidth={2}
                fillOpacity={1}
                fill={`url(#${gradientId})`}
                isAnimationActive={false}
                activeDot={{
                  r: 4.5,
                  fill: strokeColor,
                  stroke: '#000000',
                  strokeWidth: 2,
                }}
              />
            </AreaChart>
          </ResponsiveContainer>
        ) : (
          <div className="w-full h-full rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-center justify-center text-xs text-zinc-500">
            Cargando serie en Euros...
          </div>
        )}
      </div>

      {/* Range Selectors (1D, 1S, 1M, 1A, MAX) with spring sliding pill */}
      <div className="flex items-center justify-between gap-1 mt-3 p-1 rounded-xl bg-white/[0.03] border border-white/[0.06]">
        {RANGES.map((r) => {
          const active = r === range;
          return (
            <button
              key={r}
              type="button"
              onClick={() => onRangeChange(r)}
              className={`relative flex-1 py-1.5 rounded-lg text-[11px] font-semibold transition-colors cursor-pointer ${
                active ? 'text-white' : 'text-zinc-500 hover:text-zinc-300'
              }`}
            >
              {active && (
                <motion.span
                  layoutId={`chartRangePill_${gradientId}`}
                  transition={{ type: 'spring', bounce: 0, duration: 0.3 }}
                  className="absolute inset-0 rounded-lg bg-white/[0.1] border border-white/[0.08]"
                />
              )}
              <span className="relative z-10">{r}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
