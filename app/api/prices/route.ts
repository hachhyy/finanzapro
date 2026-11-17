import { NextRequest, NextResponse } from 'next/server';
import YahooFinance from 'yahoo-finance2';
import {
  resolveIsinToTicker,
  convertRawPriceToEur,
  PRIORITY_ISIN_DICTIONARY,
} from '@/lib/isinResolver';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

const FALLBACK_PRICES_EUR: Record<
  string,
  { priceEur: number; change24h: number; currency: string; name?: string }
> = {
  'BTC-EUR': { priceEur: 68003.28, change24h: 1.85, currency: 'EUR', name: 'Bitcoin' },
  'SXR8.DE': {
    priceEur: 733.22,
    change24h: 0.62,
    currency: 'EUR',
    name: 'Core S&P 500 USD (Acc)',
  },
  'QDVG.DE': {
    priceEur: 13.92,
    change24h: 0.15,
    currency: 'EUR',
    name: 'S&P 500 Health Care Sector',
  },
  'L0CK.DE': {
    priceEur: 11.25,
    change24h: 1.12,
    currency: 'EUR',
    name: 'Digital Security USD (Acc)',
  },
  '4RT8.DE': {
    priceEur: 41.3,
    change24h: -0.35,
    currency: 'EUR',
    name: 'Physical Silver ETC',
  },
  'ISLN.L': {
    priceEur: 41.3,
    change24h: -0.35,
    currency: 'USD',
    name: 'Physical Silver ETC',
  },
  'IS3N.DE': {
    priceEur: 44.32,
    change24h: 0.28,
    currency: 'EUR',
    name: 'Core MSCI EM IMI USD (Acc)',
  },
  'VVSM.DE': {
    priceEur: 79.89,
    change24h: 1.94,
    currency: 'EUR',
    name: 'Semiconductor USD (Acc)',
  },
  'PPFB.DE': {
    priceEur: 70.64,
    change24h: 0.41,
    currency: 'EUR',
    name: 'Physical Gold USD Acc',
  },
};

async function fetchFxRates(): Promise<{ eurUsd: number; eurGbp: number }> {
  let eurUsd = 1.08;
  let eurGbp = 0.85;
  try {
    const [usdRes, gbpRes] = await Promise.allSettled([
      yf.quote('EURUSD=X'),
      yf.quote('EURGBP=X'),
    ]);
    if (usdRes.status === 'fulfilled' && usdRes.value?.regularMarketPrice) {
      eurUsd = Number(usdRes.value.regularMarketPrice);
    }
    if (gbpRes.status === 'fulfilled' && gbpRes.value?.regularMarketPrice) {
      eurGbp = Number(gbpRes.value.regularMarketPrice);
    }
  } catch {
    // use safe FX defaults
  }
  return { eurUsd, eurGbp };
}

async function fetchQuoteInEur(
  symbol: string,
  fallbackSymbol: string | undefined,
  eurUsd: number,
  eurGbp: number
): Promise<{
  usedSymbol: string;
  priceEur: number;
  change24h: number;
  currency: string;
  shortName?: string;
} | null> {
  const candidates = [symbol, fallbackSymbol].filter(Boolean) as string[];

  for (const candidate of candidates) {
    try {
      const quote: any = await yf.quote(candidate);
      const rawPrice = Number(quote?.regularMarketPrice ?? 0);
      if (rawPrice > 0) {
        const currency = String(quote?.currency || 'EUR');
        const change24h = Number(quote?.regularMarketChangePercent ?? 0);
        const priceEur = convertRawPriceToEur(rawPrice, currency, eurUsd, eurGbp);
        return {
          usedSymbol: candidate,
          priceEur: Number(priceEur.toFixed(4)),
          change24h: Number(change24h.toFixed(2)),
          currency,
          shortName: quote?.shortName || quote?.longName,
        };
      }
    } catch {
      // try next candidate
    }
  }
  return null;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Modo resolución individual para alta rápida por ISIN (?resolve=IE00B5BMR087)
  const resolveQuery = searchParams.get('resolve');
  const { eurUsd, eurGbp } = await fetchFxRates();

  if (resolveQuery) {
    const resolved = await resolveIsinToTicker(resolveQuery);
    const liveQuote = await fetchQuoteInEur(
      resolved.resolvedTicker,
      resolved.fallbackTicker,
      eurUsd,
      eurGbp
    );

    const fb =
      FALLBACK_PRICES_EUR[resolved.resolvedTicker] ||
      (resolved.fallbackTicker
        ? FALLBACK_PRICES_EUR[resolved.fallbackTicker]
        : undefined);

    const priceEur =
      liveQuote?.priceEur ?? fb?.priceEur ?? resolved.defaultPriceEur ?? 50;
    const change24h = liveQuote?.change24h ?? fb?.change24h ?? 0;
    const finalName =
      PRIORITY_ISIN_DICTIONARY[resolved.inputCode]?.name ||
      liveQuote?.shortName ||
      resolved.name;

    return NextResponse.json({
      inputCode: resolved.inputCode,
      isin: resolved.isin || resolved.inputCode,
      resolvedTicker: liveQuote?.usedSymbol || resolved.resolvedTicker,
      name: finalName,
      priceEur: Number(priceEur.toFixed(4)),
      change24h: Number(change24h.toFixed(2)),
      currency: 'EUR',
      source: liveQuote ? 'live' : 'fallback',
    });
  }

  // Modo lote (?tickers=IE00B5BMR087,SXR8.DE,BTC-EUR...)
  const tickersParam = searchParams.get('tickers') || '';
  const requestedCodes = tickersParam
    .split(',')
    .map((t) => t.trim())
    .filter(Boolean);

  const codes =
    requestedCodes.length > 0
      ? requestedCodes
      : Object.keys(PRIORITY_ISIN_DICTIONARY);

  const results: Record<
    string,
    {
      inputCode: string;
      isin?: string;
      ticker: string;
      resolvedTicker: string;
      name: string;
      priceEur: number;
      change24h: number;
      currency: string;
      source: 'live' | 'fallback';
    }
  > = {};

  await Promise.all(
    codes.map(async (code) => {
      const resolved = await resolveIsinToTicker(code);
      const liveQuote = await fetchQuoteInEur(
        resolved.resolvedTicker,
        resolved.fallbackTicker,
        eurUsd,
        eurGbp
      );

      if (liveQuote) {
        const entry = {
          inputCode: code,
          isin: resolved.isin,
          ticker: liveQuote.usedSymbol,
          resolvedTicker: liveQuote.usedSymbol,
          name:
            PRIORITY_ISIN_DICTIONARY[resolved.inputCode]?.name ||
            resolved.name ||
            liveQuote.shortName ||
            code,
          priceEur: liveQuote.priceEur,
          change24h: liveQuote.change24h,
          currency: liveQuote.currency,
          source: 'live' as const,
        };
        results[code] = entry;
        results[resolved.resolvedTicker] = entry;
        if (resolved.isin) results[resolved.isin] = entry;
        return;
      }

      const fb = FALLBACK_PRICES_EUR[resolved.resolvedTicker] || {
        priceEur: resolved.defaultPriceEur || 25.0,
        change24h: 0.0,
        currency: 'EUR',
      };
      const fallbackEntry = {
        inputCode: code,
        isin: resolved.isin,
        ticker: resolved.resolvedTicker,
        resolvedTicker: resolved.resolvedTicker,
        name: resolved.name,
        priceEur: fb.priceEur,
        change24h: fb.change24h,
        currency: fb.currency,
        source: 'fallback' as const,
      };
      results[code] = fallbackEntry;
      results[resolved.resolvedTicker] = fallbackEntry;
      if (resolved.isin) results[resolved.isin] = fallbackEntry;
    })
  );

  return NextResponse.json({
    rates: { EURUSD: eurUsd, EURGBP: eurGbp },
    prices: results,
    updatedAt: new Date().toISOString(),
  });
}
