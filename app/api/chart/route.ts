import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export type ChartRange = '1D' | '1S' | '1M' | '1A' | 'MAX';

function convertToEur(
  rawPrice: number,
  currency: string | undefined,
  eurUsd: number,
  eurGbp: number
): number {
  const curr = (currency || 'EUR').trim();
  if (curr === 'EUR') return rawPrice;
  if (curr === 'USD') return rawPrice / (eurUsd || 1.08);
  if (curr === 'GBP') return rawPrice / (eurGbp || 0.85);
  if (curr === 'GBp' || curr === 'GBX') return rawPrice / 100 / (eurGbp || 0.85);
  return rawPrice;
}

function getPeriodConfig(range: ChartRange): {
  period1: Date;
  interval: '5m' | '15m' | '1h' | '1d' | '1wk' | '1mo';
  pointsCount: number;
} {
  const now = new Date();
  switch (range) {
    case '1D':
      return {
        period1: new Date(now.getTime() - 24 * 60 * 60 * 1000),
        interval: '15m',
        pointsCount: 36,
      };
    case '1S':
      return {
        period1: new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000),
        interval: '1h',
        pointsCount: 42,
      };
    case '1M':
      return {
        period1: new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000),
        interval: '1d',
        pointsCount: 30,
      };
    case '1A':
      return {
        period1: new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000),
        interval: '1wk',
        pointsCount: 52,
      };
    case 'MAX':
    default:
      return {
        period1: new Date(now.getTime() - 3 * 365 * 24 * 60 * 60 * 1000),
        interval: '1mo',
        pointsCount: 36,
      };
  }
}

function buildFallbackSeries(
  ticker: string,
  basePriceEur: number,
  range: ChartRange
): { timestamp: string; label: string; priceEur: number }[] {
  const { period1, pointsCount } = getPeriodConfig(range);
  const now = Date.now();
  const start = period1.getTime();
  const step = Math.max(1, Math.floor((now - start) / pointsCount));

  // Deterministic seed based on ticker + range
  let seed = 0;
  const key = `${ticker}_${range}`;
  for (let i = 0; i < key.length; i++) {
    seed = (seed * 31 + key.charCodeAt(i)) % 100000;
  }

  const volatility =
    range === '1D'
      ? 0.012
      : range === '1S'
      ? 0.028
      : range === '1M'
      ? 0.055
      : range === '1A'
      ? 0.16
      : 0.32;

  const series: { timestamp: string; label: string; priceEur: number }[] = [];
  const startFactor = 1 - volatility * 0.45;

  for (let i = 0; i <= pointsCount; i++) {
    const t = start + i * step;
    const progress = i / pointsCount;
    const wave =
      Math.sin(progress * Math.PI * 3 + seed) * (volatility * 0.25) +
      Math.cos(progress * Math.PI * 7 + seed * 0.5) * (volatility * 0.12);
    const factor =
      i === pointsCount
        ? 1
        : startFactor + progress * (1 - startFactor) + wave;
    const price = Math.max(0.01, basePriceEur * factor);
    const dateObj = new Date(t);
    const label =
      range === '1D'
        ? dateObj.toLocaleTimeString('es-ES', {
            hour: '2-digit',
            minute: '2-digit',
          })
        : dateObj.toLocaleDateString('es-ES', {
            day: '2-digit',
            month: 'short',
          });

    series.push({
      timestamp: dateObj.toISOString(),
      label,
      priceEur: Number(price.toFixed(4)),
    });
  }

  return series;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const ticker = (searchParams.get('ticker') || 'BTC-EUR').trim();
  const range = ((searchParams.get('range') || '1M').toUpperCase() as ChartRange);
  const basePriceParam = Number(searchParams.get('basePrice') || 100);

  let eurUsd = 1.08;
  let eurGbp = 0.85;

  try {
    const [usdQuote, gbpQuote]: any[] = await Promise.all([
      yf.quote('EURUSD=X').catch(() => null),
      yf.quote('EURGBP=X').catch(() => null),
    ]);
    if (usdQuote?.regularMarketPrice) eurUsd = Number(usdQuote.regularMarketPrice);
    if (gbpQuote?.regularMarketPrice) eurGbp = Number(gbpQuote.regularMarketPrice);
  } catch {
    // fallback FX rates
  }

  const { period1, interval } = getPeriodConfig(range);

  try {
    const chartRes: any = await yf.chart(ticker, {
      period1,
      interval,
    });

    const currency = String(chartRes?.meta?.currency || 'EUR');
    const quotes: any[] = Array.isArray(chartRes?.quotes) ? chartRes.quotes : [];

    const validPoints = quotes
      .filter((q) => q && typeof q.close === 'number' && q.close > 0 && q.date)
      .map((q) => {
        const d = new Date(q.date);
        const priceEur = convertToEur(Number(q.close), currency, eurUsd, eurGbp);
        const label =
          range === '1D'
            ? d.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })
            : d.toLocaleDateString('es-ES', { day: '2-digit', month: 'short' });
        return {
          timestamp: d.toISOString(),
          label,
          priceEur: Number(priceEur.toFixed(4)),
        };
      });

    if (validPoints.length >= 2) {
      return NextResponse.json({
        ticker,
        range,
        currency: 'EUR',
        originalCurrency: currency,
        source: 'live',
        series: validPoints,
      });
    }
  } catch {
    // Fallback below if Yahoo Finance rate-limits or network blocks
  }

  const fallbackSeries = buildFallbackSeries(
    ticker,
    basePriceParam > 0 ? basePriceParam : 100,
    range
  );

  return NextResponse.json({
    ticker,
    range,
    currency: 'EUR',
    source: 'fallback',
    series: fallbackSeries,
  });
}
