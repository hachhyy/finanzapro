import YahooFinance from 'yahoo-finance2';

const yf = new YahooFinance({ suppressNotices: ['yahooSurvey', 'ripHistorical'] });

export interface ResolvedAssetInfo {
  inputCode: string;
  isin?: string;
  resolvedTicker: string;
  fallbackTicker?: string;
  name: string;
  defaultPriceEur: number;
}

export const ISIN_REGEX = /^[A-Z]{2}[A-Z0-9]{9}[0-9]$/i;

/**
 * Diccionario maestro prioritario (Resolución instantánea en EUR - Xetra)
 */
export const PRIORITY_ISIN_DICTIONARY: Record<string, ResolvedAssetInfo> = {
  IE00B5BMR087: {
    inputCode: 'IE00B5BMR087',
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
  },
  IE00B43HR379: {
    inputCode: 'IE00B43HR379',
    isin: 'IE00B43HR379',
    resolvedTicker: 'QDVG.DE',
    name: 'S&P 500 Health Care Sector',
    defaultPriceEur: 13.92,
  },
  IE00BG0J4C88: {
    inputCode: 'IE00BG0J4C88',
    isin: 'IE00BG0J4C88',
    resolvedTicker: 'L0CK.DE',
    name: 'Digital Security USD (Acc)',
    defaultPriceEur: 11.25,
  },
  IE00B4NCWG09: {
    inputCode: 'IE00B4NCWG09',
    isin: 'IE00B4NCWG09',
    resolvedTicker: '4RT8.DE',
    fallbackTicker: 'ISLN.L',
    name: 'Physical Silver ETC',
    defaultPriceEur: 41.3,
  },
  IE00BKM4GZ66: {
    inputCode: 'IE00BKM4GZ66',
    isin: 'IE00BKM4GZ66',
    resolvedTicker: 'IS3N.DE',
    name: 'Core MSCI EM IMI USD (Acc)',
    defaultPriceEur: 44.32,
  },
  IE00BMC38736: {
    inputCode: 'IE00BMC38736',
    isin: 'IE00BMC38736',
    resolvedTicker: 'VVSM.DE',
    name: 'Semiconductor USD (Acc)',
    defaultPriceEur: 79.89,
  },
  // Soporte adicional para Oro físico e histórico previo
  IE00B4ND3602: {
    inputCode: 'IE00B4ND3602',
    isin: 'IE00B4ND3602',
    resolvedTicker: 'PPFB.DE',
    name: 'Physical Gold USD Acc',
    defaultPriceEur: 70.64,
  },
};

/**
 * Mapa inverso de tickers antiguos o de Xetra hacia su entrada en el diccionario ISIN
 */
export const TICKER_TO_ISIN_MAP: Record<string, string> = {
  'SPYL.DE': 'IE00B5BMR087',
  'VUAA.DE': 'IE00B5BMR087',
  'SXR8.DE': 'IE00B5BMR087',
  'QDVG.DE': 'IE00B43HR379',
  'L0CK.DE': 'IE00BG0J4C88',
  '4RT8.DE': 'IE00B4NCWG09',
  'ISLN.L': 'IE00B4NCWG09',
  'IS3N.DE': 'IE00BKM4GZ66',
  'VVSM.DE': 'IE00BMC38736',
  'PPFB.DE': 'IE00B4ND3602',
};

const dynamicIsinCache = new Map<string, ResolvedAssetInfo>();

export function resolveStaticIsinOrTicker(rawCode: string): ResolvedAssetInfo | null {
  const clean = (rawCode || '').trim().toUpperCase();
  if (!clean) return null;

  if (PRIORITY_ISIN_DICTIONARY[clean]) {
    return PRIORITY_ISIN_DICTIONARY[clean];
  }

  const mappedIsin = TICKER_TO_ISIN_MAP[clean];
  if (mappedIsin && PRIORITY_ISIN_DICTIONARY[mappedIsin]) {
    return PRIORITY_ISIN_DICTIONARY[mappedIsin];
  }

  if (dynamicIsinCache.has(clean)) {
    return dynamicIsinCache.get(clean)!;
  }

  return null;
}

/**
 * Fase 1: Función intermedia resolveIsinToTicker(inputCode)
 * - Resuelve al instante si está en el diccionario maestro prioritario.
 * - Si es un nuevo ISIN, consulta Yahoo Finance search (/v1/finance/search?q={ISIN}),
 *   priorizando bolsas en Euros (.DE, .AS, .MI, .PA) y guarda en caché.
 */
export async function resolveIsinToTicker(
  inputCode: string
): Promise<ResolvedAssetInfo> {
  const clean = (inputCode || '').trim().toUpperCase();

  const staticMatch = resolveStaticIsinOrTicker(clean);
  if (staticMatch) {
    return staticMatch;
  }

  const isIsin = ISIN_REGEX.test(clean);

  try {
    const searchRes: any = await yf.search(clean);
    const quotes: any[] = Array.isArray(searchRes?.quotes)
      ? searchRes.quotes.filter((q: any) => q && typeof q.symbol === 'string')
      : [];

    if (quotes.length > 0) {
      const eurSuffixPriority = ['.DE', '.AS', '.MI', '.PA', '.MC', '.F'];
      let chosen = quotes[0];

      for (const suffix of eurSuffixPriority) {
        const match = quotes.find((q) =>
          String(q.symbol).toUpperCase().endsWith(suffix)
        );
        if (match) {
          chosen = match;
          break;
        }
      }

      const resolved: ResolvedAssetInfo = {
        inputCode: clean,
        isin: isIsin ? clean : undefined,
        resolvedTicker: String(chosen.symbol).toUpperCase(),
        name: String(
          chosen.shortname || chosen.longname || chosen.symbol || clean
        ).trim(),
        defaultPriceEur: 50,
      };

      dynamicIsinCache.set(clean, resolved);
      return resolved;
    }
  } catch {
    // Si falla la búsqueda de red, devolvemos el código como ticker directo
  }

  const fallback: ResolvedAssetInfo = {
    inputCode: clean,
    isin: isIsin ? clean : undefined,
    resolvedTicker: clean,
    name: clean,
    defaultPriceEur: 50,
  };
  return fallback;
}

export function convertRawPriceToEur(
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
