import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey'] });

const FALLBACK_PRICES_EUR: Record<string, { priceEur: number; change24h: number; currency: string }> = {
  'BTC-EUR': { priceEur: 82500.0, change24h: 1.85, currency: 'EUR' },
  'SPYL.DE': { priceEur: 13.45, change24h: 0.62, currency: 'EUR' },
  'PPFB.DE': { priceEur: 49.8, change24h: 0.41, currency: 'EUR' },
  'ISLN.L': { priceEur: 28.9, change24h: -0.35, currency: 'USD' },
  'IS3N.DE': { priceEur: 33.15, change24h: 0.28, currency: 'EUR' },
  'QDVG.DE': { priceEur: 11.2, change24h: 0.15, currency: 'EUR' },
  'L0CK.DE': { priceEur: 8.45, change24h: 1.12, currency: 'EUR' },
  'VVSM.DE': { priceEur: 42.6, change24h: 1.94, currency: 'EUR' },
};

function convertToEur(
  rawPrice: number,
  currency: string | undefined,
  eurUsd: number,
  eurGbp: number
): number {
  const curr = (currency || 'EUR').trim();
  if (curr === 'EUR') {
    return rawPrice;
  }
  if (curr === 'USD') {
    return rawPrice / (eurUsd || 1.08);
  }
  if (curr === 'GBP') {
    return rawPrice / (eurGbp || 0.85);
  }
  if (curr === 'GBp' || curr === 'GBX') {
    return rawPrice / 100 / (eurGbp || 0.85);
  }
  return rawPrice;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const tickersParam = searchParams.get('tickers') || '';
  const requestedTickers = tickersParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const tickers =
    requestedTickers.length > 0
      ? requestedTickers
      : Object.keys(FALLBACK_PRICES_EUR);

  let eurUsd = 1.08;
  let eurGbp = 0.85;

  try {
    const fxQuotes = await Promise.allSettled([
      yf.quote('EURUSD=X'),
      yf.quote('EURGBP=X'),
    ]);

    if (
      fxQuotes[0].status === 'fulfilled' &&
      fxQuotes[0].value?.regularMarketPrice
    ) {
      eurUsd = Number(fxQuotes[0].value.regularMarketPrice);
    }
    if (
      fxQuotes[1].status === 'fulfilled' &&
      fxQuotes[1].value?.regularMarketPrice
    ) {
      eurGbp = Number(fxQuotes[1].value.regularMarketPrice);
    }
  } catch {
    // Use safe FX defaults if offline/blocked
  }

  const results: Record<
    string,
    {
      ticker: string;
      priceEur: number;
      change24h: number;
      currency: string;
      source: 'live' | 'fallback';
    }
  > = {};

  await Promise.all(
    tickers.map(async (ticker) => {
      try {
        const quote: any = await yf.quote(ticker);
        const rawPrice = Number(quote?.regularMarketPrice ?? 0);
        const currency = String(quote?.currency || 'EUR');
        const change24h = Number(quote?.regularMarketChangePercent ?? 0);

        if (rawPrice > 0) {
          const priceEur = convertToEur(rawPrice, currency, eurUsd, eurGbp);
          results[ticker] = {
            ticker,
            priceEur: Number(priceEur.toFixed(4)),
            change24h: Number(change24h.toFixed(2)),
            currency,
            source: 'live',
          };
          return;
        }
      } catch {
        // Fallback below
      }

      const fb = FALLBACK_PRICES_EUR[ticker] || {
        priceEur: 25.0,
        change24h: 0.0,
        currency: 'EUR',
      };
      results[ticker] = {
        ticker,
        priceEur: fb.priceEur,
        change24h: fb.change24h,
        currency: fb.currency,
        source: 'fallback',
      };
    })
  );

  return NextResponse.json({
    rates: { EURUSD: eurUsd, EURGBP: eurGbp },
    prices: results,
    updatedAt: new Date().toISOString(),
  });
}
