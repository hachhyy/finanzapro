export interface BankAccount {
  id: string;
  name: string;
  balance: number;
  isTradeRepublic?: boolean;
}

export interface SubItem {
  id: string;
  name: string;
  amount: number;
  completed: boolean;
}

export interface PendingItem {
  id: string;
  type: 'income' | 'debt';
  name: string;
  amount: number;
  folder?: string;
  mode: 'single' | 'subitems';
  subItems: SubItem[];
}

export interface InvestmentAsset {
  id: string;
  name: string;
  isin?: string;
  ticker: string;
  resolvedTicker?: string;
  dcaMonthly: number;
  dcaEnabled?: boolean;
  shares: number;
  costBasis: number;
  priceEur: number;
  change24h: number;
  currency?: string;
}

export interface MonthlyFlowConfig {
  savingsFromAccountId?: string;
  savingsToAccountId?: string;
  executionMode: 'manual' | 'auto';
  scheduledDay: number;
  dcaAccountId?: string;
  lastSavingsMonth?: string;
  lastDcaMonth?: string;
  lastAutoError?: string;
}

export interface PostDcaSummaryItem {
  assetId: string;
  name: string;
  ticker: string;
  dcaAmountEur: number;
  priceEur: number;
  addedShares: number;
  newTotalShares: number;
}

export interface HistoryRecord {
  id: string;
  timestamp: string;
  type:
    | 'transfer'
    | 'savings_transfer'
    | 'interest_claim'
    | 'income_collect'
    | 'debt_pay'
    | 'dca_execute'
    | 'asset_buy'
    | 'asset_sell'
    | 'balance_edit';
  title: string;
  subtitle?: string;
  amountEur: number;
  reversible: boolean;
  revertPayload: {
    accountDeltas?: { accountId: string; delta: number }[];
    trAccruedDelta?: number;
    pendingRestore?: {
      itemId: string;
      subItemId?: string;
      amountDelta: number;
      wasDeleted?: boolean;
      backupItem?: PendingItem;
    };
    assetDeltas?: {
      assetId: string;
      sharesDelta: number;
      costBasisDelta: number;
    }[];
  };
}

export interface AppState {
  accounts: BankAccount[];
  trInterestRate: number;
  trAccruedInterest: number;
  lastInterestCalcDate: string;
  monthlySavingsTarget: number;
  monthlyFlow?: MonthlyFlowConfig;
  pendingItems: PendingItem[];
  assets: InvestmentAsset[];
  history: HistoryRecord[];
  lastPriceUpdate?: string;
  updatedAt: string;
}

const todayISO = () =>
  typeof window !== 'undefined'
    ? new Date().toISOString().split('T')[0]
    : '2026-01-01';

const EPOCH_ISO = '1970-01-01T00:00:00.000Z';

export const DEFAULT_ACCOUNTS: BankAccount[] = [
  { id: 'acc_imagin', name: 'Imagin (Banco principal)', balance: 0 },
  {
    id: 'acc_tr',
    name: 'Trade Republic (Efectivo remunerado)',
    balance: 0,
    isTradeRepublic: true,
  },
  { id: 'acc_wise', name: 'Wise (Banco de viajes)', balance: 0 },
  { id: 'acc_cash', name: 'Efectivo (Metálico)', balance: 0 },
];

export const DEFAULT_ASSETS: InvestmentAsset[] = [
  {
    id: 'ast_sp500',
    name: 'Core S&P 500 USD (Acc)',
    isin: 'IE00B5BMR087',
    ticker: 'SXR8.DE',
    resolvedTicker: 'SXR8.DE',
    dcaMonthly: 75,
    shares: 0,
    costBasis: 0,
    priceEur: 733.22,
    change24h: 0.62,
    currency: 'EUR',
  },
  {
    id: 'ast_qdvg',
    name: 'S&P 500 Health Care Sector',
    isin: 'IE00B43HR379',
    ticker: 'QDVG.DE',
    resolvedTicker: 'QDVG.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 13.92,
    change24h: 0.88,
    currency: 'EUR',
  },
  {
    id: 'ast_l0ck',
    name: 'Digital Security USD (Acc)',
    isin: 'IE00BG0J4C88',
    ticker: 'L0CK.DE',
    resolvedTicker: 'L0CK.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 11.25,
    change24h: -0.37,
    currency: 'EUR',
  },
  {
    id: 'ast_isln',
    name: 'Physical Silver ETC',
    isin: 'IE00B4NCWG09',
    ticker: '4RT8.DE',
    resolvedTicker: '4RT8.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 41.3,
    change24h: -0.35,
    currency: 'EUR',
  },
  {
    id: 'ast_is3n',
    name: 'Core MSCI EM IMI USD (Acc)',
    isin: 'IE00BKM4GZ66',
    ticker: 'IS3N.DE',
    resolvedTicker: 'IS3N.DE',
    dcaMonthly: 85,
    shares: 0,
    costBasis: 0,
    priceEur: 44.32,
    change24h: 0.28,
    currency: 'EUR',
  },
  {
    id: 'ast_vvsm',
    name: 'Semiconductor USD (Acc)',
    isin: 'IE00BMC38736',
    ticker: 'VVSM.DE',
    resolvedTicker: 'VVSM.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 79.89,
    change24h: 1.94,
    currency: 'EUR',
  },
];

const LEGACY_MIGRATION_MAP: Record<
  string,
  {
    isin: string;
    resolvedTicker: string;
    name: string;
    defaultPriceEur: number;
    legacyNames: string[];
  }
> = {
  'SPYL.DE': {
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
    legacyNames: ['S&P 500 USD Acc', 'S&P 500', 'SPYL.DE'],
  },
  'VUAA.DE': {
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
    legacyNames: ['S&P 500 USD Acc', 'S&P 500', 'VUAA.DE'],
  },
  'SXR8.DE': {
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
    legacyNames: ['S&P 500 USD Acc', 'S&P 500', 'SXR8.DE'],
  },
  IE00B5BMR087: {
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
    legacyNames: ['S&P 500 USD Acc', 'S&P 500', 'SPYL.DE'],
  },
  'QDVG.DE': {
    isin: 'IE00B43HR379',
    resolvedTicker: 'QDVG.DE',
    name: 'S&P 500 Health Care Sector',
    defaultPriceEur: 13.92,
    legacyNames: ['S&P 500 Health Care USD Acc', 'QDVG.DE'],
  },
  IE00B43HR379: {
    isin: 'IE00B43HR379',
    resolvedTicker: 'QDVG.DE',
    name: 'S&P 500 Health Care Sector',
    defaultPriceEur: 13.92,
    legacyNames: ['S&P 500 Health Care USD Acc', 'QDVG.DE'],
  },
  'L0CK.DE': {
    isin: 'IE00BG0J4C88',
    resolvedTicker: 'L0CK.DE',
    name: 'Digital Security USD (Acc)',
    defaultPriceEur: 11.25,
    legacyNames: ['Digital Security USD Acc', 'L0CK.DE'],
  },
  IE00BG0J4C88: {
    isin: 'IE00BG0J4C88',
    resolvedTicker: 'L0CK.DE',
    name: 'Digital Security USD (Acc)',
    defaultPriceEur: 11.25,
    legacyNames: ['Digital Security USD Acc', 'L0CK.DE'],
  },
  'ISLN.L': {
    isin: 'IE00B4NCWG09',
    resolvedTicker: '4RT8.DE',
    name: 'Physical Silver ETC',
    defaultPriceEur: 41.3,
    legacyNames: ['Physical Silver', 'ISLN.L', '4RT8.DE'],
  },
  '4RT8.DE': {
    isin: 'IE00B4NCWG09',
    resolvedTicker: '4RT8.DE',
    name: 'Physical Silver ETC',
    defaultPriceEur: 41.3,
    legacyNames: ['Physical Silver', 'ISLN.L', '4RT8.DE'],
  },
  IE00B4NCWG09: {
    isin: 'IE00B4NCWG09',
    resolvedTicker: '4RT8.DE',
    name: 'Physical Silver ETC',
    defaultPriceEur: 41.3,
    legacyNames: ['Physical Silver', 'ISLN.L', '4RT8.DE'],
  },
  'IS3N.DE': {
    isin: 'IE00BKM4GZ66',
    resolvedTicker: 'IS3N.DE',
    name: 'Core MSCI EM IMI USD (Acc)',
    defaultPriceEur: 44.32,
    legacyNames: ['Core MSCI EM IMI USD Acc', 'IS3N.DE'],
  },
  IE00BKM4GZ66: {
    isin: 'IE00BKM4GZ66',
    resolvedTicker: 'IS3N.DE',
    name: 'Core MSCI EM IMI USD (Acc)',
    defaultPriceEur: 44.32,
    legacyNames: ['Core MSCI EM IMI USD Acc', 'IS3N.DE'],
  },
  'VVSM.DE': {
    isin: 'IE00BMC38736',
    resolvedTicker: 'VVSM.DE',
    name: 'Semiconductor USD (Acc)',
    defaultPriceEur: 79.89,
    legacyNames: ['Semiconductor USD Acc', 'VVSM.DE'],
  },
  IE00BMC38736: {
    isin: 'IE00BMC38736',
    resolvedTicker: 'VVSM.DE',
    name: 'Semiconductor USD (Acc)',
    defaultPriceEur: 79.89,
    legacyNames: ['Semiconductor USD Acc', 'VVSM.DE'],
  },
  'PPFB.DE': {
    isin: 'IE00B4ND3602',
    resolvedTicker: 'PPFB.DE',
    name: 'Physical Gold USD Acc',
    defaultPriceEur: 70.64,
    legacyNames: ['Physical Gold USD Acc', 'PPFB.DE'],
  },
  IE00B4ND3602: {
    isin: 'IE00B4ND3602',
    resolvedTicker: 'PPFB.DE',
    name: 'Physical Gold USD Acc',
    defaultPriceEur: 70.64,
    legacyNames: ['Physical Gold USD Acc', 'PPFB.DE'],
  },
};

/**
 * Fase 2: Migración automática de activos a códigos ISIN y reemplazo de SPYL.DE / VUAA.DE -> IE00B5BMR087 (SXR8.DE),
 * preservando participaciones (shares), capital invertido (costBasis) y DCA mensual del usuario.
 */
export function migrateAssetsState(state: AppState): {
  state: AppState;
  migrated: boolean;
} {
  if (!state || !Array.isArray(state.assets)) {
    return { state, migrated: false };
  }

  let migrated = false;

  const updatedAssets: InvestmentAsset[] = state.assets.map((asset) => {
    const rawKey = (asset.isin || asset.ticker || '').trim().toUpperCase();
    const tickerKey = (asset.ticker || '').trim().toUpperCase();
    const rule = LEGACY_MIGRATION_MAP[rawKey] || LEGACY_MIGRATION_MAP[tickerKey];

    if (rule) {
      const isSp500StalePrice =
        rule.isin === 'IE00B5BMR087' && Number(asset.priceEur || 0) < 100;
      const shouldUpdateName =
        !asset.name || rule.legacyNames.includes(asset.name.trim());
      const nextName = shouldUpdateName ? rule.name : asset.name;
      const nextPrice = isSp500StalePrice
        ? rule.defaultPriceEur
        : Number(asset.priceEur || rule.defaultPriceEur);

      if (
        asset.isin !== rule.isin ||
        asset.resolvedTicker !== rule.resolvedTicker ||
        asset.ticker !== rule.resolvedTicker ||
        asset.name !== nextName ||
        asset.priceEur !== nextPrice ||
        asset.currency !== 'EUR'
      ) {
        migrated = true;
      }

      return {
        ...asset,
        name: nextName,
        isin: rule.isin,
        ticker: rule.resolvedTicker,
        resolvedTicker: rule.resolvedTicker,
        priceEur: nextPrice,
        currency: 'EUR',
      };
    }

    // Cualquier otro activo (ej. BTC-EUR o ISIN personalizado) conserva sus campos garantizando isin y resolvedTicker
    const nextIsin = asset.isin || asset.ticker;
    const nextResolved = asset.resolvedTicker || asset.ticker;
    if (asset.isin !== nextIsin || asset.resolvedTicker !== nextResolved) {
      migrated = true;
      return {
        ...asset,
        isin: nextIsin,
        resolvedTicker: nextResolved,
      };
    }

    return asset;
  });

  if (!migrated) {
    return { state, migrated: false };
  }

  return {
    state: {
      ...state,
      assets: updatedAssets,
    },
    migrated: true,
  };
}

export function createBlankState(existingAssets?: InvestmentAsset[]): AppState {
  const sourceAssets =
    existingAssets && existingAssets.length > 0 ? existingAssets : DEFAULT_ASSETS;
  const baseAssets = sourceAssets.map((a) => ({
    ...a,
    shares: 0,
    costBasis: 0,
  }));

  const rawState: AppState = {
    accounts: DEFAULT_ACCOUNTS.map((acc) => ({ ...acc, balance: 0 })),
    trInterestRate: 2.5,
    trAccruedInterest: 0,
    lastInterestCalcDate: todayISO(),
    monthlySavingsTarget: 1000,
    monthlyFlow: {
      executionMode: 'manual',
      scheduledDay: 2,
    },
    pendingItems: [],
    assets: baseAssets,
    history: [],
    updatedAt: EPOCH_ISO,
  };

  return migrateAssetsState(rawState).state;
}

export function createDemoState(currentAssets?: InvestmentAsset[]): AppState {
  const baseList =
    currentAssets && currentAssets.length > 0 ? currentAssets : DEFAULT_ASSETS;
  const migratedList = migrateAssetsState({
    accounts: [],
    trInterestRate: 2.5,
    trAccruedInterest: 0,
    lastInterestCalcDate: todayISO(),
    monthlySavingsTarget: 1000,
    pendingItems: [],
    assets: baseList,
    history: [],
    updatedAt: EPOCH_ISO,
  }).state.assets;

  const sp500Price =
    migratedList.find((a) => a.isin === 'IE00B5BMR087')?.priceEur || 733.22;
  const sp500Shares = Number((368.85 / sp500Price).toFixed(8));

  const assets = migratedList.map((a) => {
    if (a.isin === 'IE00B5BMR087' || a.ticker === 'SXR8.DE') {
      return {
        ...a,
        shares: sp500Shares,
        costBasis: 350.0,
      };
    }
    return {
      ...a,
      shares: 0,
      costBasis: 0,
    };
  });

  const pendingItems: PendingItem[] = [
    {
      id: 'inc_hotel',
      type: 'income',
      name: 'Nómina Hotel',
      amount: 1480.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_lidl',
      type: 'income',
      name: 'Nómina Lidl',
      amount: 203.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_violeta',
      type: 'income',
      name: 'Violeta',
      amount: 160.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_zara',
      type: 'income',
      name: 'Zara',
      amount: 40.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_pegajosa_fianza',
      type: 'income',
      name: 'Fianza',
      folder: 'Pegajosa Halloween',
      amount: 270.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_pegajosa_ingresos',
      type: 'income',
      name: 'Ingresos',
      folder: 'Pegajosa Halloween',
      amount: 280.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'inc_pegajosa_gastos',
      type: 'income',
      name: 'Gastos',
      folder: 'Pegajosa Halloween',
      amount: 80.0,
      mode: 'subitems',
      subItems: [
        { id: 'sub_pg_1', name: 'Sub-pago 1', amount: 25.0, completed: false },
        { id: 'sub_pg_2', name: 'Sub-pago 2', amount: 25.0, completed: false },
        { id: 'sub_pg_3', name: 'Sub-pago 3', amount: 10.0, completed: false },
        { id: 'sub_pg_4', name: 'Sub-pago 4', amount: 20.0, completed: false },
      ],
    },
    {
      id: 'debt_coche',
      type: 'debt',
      name: 'Coche',
      amount: 150.0,
      mode: 'single',
      subItems: [],
    },
    {
      id: 'debt_ipad',
      type: 'debt',
      name: 'iPad',
      amount: 70.0,
      mode: 'subitems',
      subItems: [
        { id: 'sub_ipad_1', name: 'Cuota 1', amount: 35.0, completed: false },
        { id: 'sub_ipad_2', name: 'Cuota 2', amount: 35.0, completed: false },
      ],
    },
  ];

  return {
    accounts: [
      { id: 'acc_imagin', name: 'Imagin (Banco principal)', balance: 334.0 },
      {
        id: 'acc_tr',
        name: 'Trade Republic (Efectivo remunerado)',
        balance: 1250.0,
        isTradeRepublic: true,
      },
      { id: 'acc_wise', name: 'Wise (Banco de viajes)', balance: 0 },
      { id: 'acc_cash', name: 'Efectivo (Metálico)', balance: 0 },
    ],
    trInterestRate: 2.5,
    trAccruedInterest: 0.09,
    lastInterestCalcDate: todayISO(),
    monthlySavingsTarget: 1000.0,
    monthlyFlow: {
      executionMode: 'manual',
      scheduledDay: 2,
    },
    pendingItems,
    assets,
    history: [],
    updatedAt: new Date().toISOString(),
  };
}

export function getPendingEffectiveAmount(item: PendingItem): number {
  if (item.mode === 'subitems' && item.subItems.length > 0) {
    return item.subItems
      .filter((s) => !s.completed)
      .reduce((sum, s) => sum + Number(s.amount || 0), 0);
  }
  return Number(item.amount || 0);
}

export function formatEUR(value: number, privacyMode = false): string {
  if (privacyMode) return '•••• €';
  const safeVal = Number.isFinite(value) ? value : 0;
  return new Intl.NumberFormat('es-ES', {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(safeVal);
}

export function formatSignedEUR(value: number, privacyMode = false): string {
  if (privacyMode) return '•••• €';
  const safeVal = Number.isFinite(value) ? value : 0;
  const sign = safeVal > 0 ? '+' : '';
  return `${sign}${formatEUR(safeVal, false)}`;
}
