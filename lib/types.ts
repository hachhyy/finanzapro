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
  ticker: string;
  dcaMonthly: number;
  shares: number;
  costBasis: number;
  priceEur: number;
  change24h: number;
  currency?: string;
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
    id: 'ast_btc',
    name: 'Bitcoin',
    ticker: 'BTC-EUR',
    dcaMonthly: 30,
    shares: 0,
    costBasis: 0,
    priceEur: 82500,
    change24h: 1.85,
    currency: 'EUR',
  },
  {
    id: 'ast_spyl',
    name: 'S&P 500 USD Acc',
    ticker: 'SPYL.DE',
    dcaMonthly: 85,
    shares: 0,
    costBasis: 0,
    priceEur: 13.45,
    change24h: 0.62,
    currency: 'EUR',
  },
  {
    id: 'ast_ppfb',
    name: 'Physical Gold USD Acc',
    ticker: 'PPFB.DE',
    dcaMonthly: 20,
    shares: 0,
    costBasis: 0,
    priceEur: 49.8,
    change24h: 0.41,
    currency: 'EUR',
  },
  {
    id: 'ast_isln',
    name: 'Physical Silver',
    ticker: 'ISLN.L',
    dcaMonthly: 20,
    shares: 0,
    costBasis: 0,
    priceEur: 28.9,
    change24h: -0.35,
    currency: 'USD',
  },
  {
    id: 'ast_is3n',
    name: 'Core MSCI EM IMI USD Acc',
    ticker: 'IS3N.DE',
    dcaMonthly: 20,
    shares: 0,
    costBasis: 0,
    priceEur: 33.15,
    change24h: 0.28,
    currency: 'EUR',
  },
  {
    id: 'ast_qdvg',
    name: 'S&P 500 Health Care USD Acc',
    ticker: 'QDVG.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 11.2,
    change24h: 0.15,
    currency: 'EUR',
  },
  {
    id: 'ast_l0ck',
    name: 'Digital Security USD Acc',
    ticker: 'L0CK.DE',
    dcaMonthly: 10,
    shares: 0,
    costBasis: 0,
    priceEur: 8.45,
    change24h: 1.12,
    currency: 'EUR',
  },
  {
    id: 'ast_vvsm',
    name: 'Semiconductor USD Acc',
    ticker: 'VVSM.DE',
    dcaMonthly: 5,
    shares: 0,
    costBasis: 0,
    priceEur: 42.6,
    change24h: 1.94,
    currency: 'EUR',
  },
];

export function createBlankState(existingAssets?: InvestmentAsset[]): AppState {
  const baseAssets = (existingAssets && existingAssets.length > 0 ? existingAssets : DEFAULT_ASSETS).map(
    (a) => ({
      ...a,
      shares: 0,
      costBasis: 0,
    })
  );

  return {
    accounts: DEFAULT_ACCOUNTS.map((acc) => ({ ...acc, balance: 0 })),
    trInterestRate: 2.5,
    trAccruedInterest: 0,
    lastInterestCalcDate: todayISO(),
    monthlySavingsTarget: 900,
    pendingItems: [],
    assets: baseAssets,
    history: [],
    updatedAt: EPOCH_ISO,
  };
}

export function createDemoState(currentAssets?: InvestmentAsset[]): AppState {
  const btcPrice =
    currentAssets?.find((a) => a.ticker === 'BTC-EUR')?.priceEur || 82500;
  const btcShares = Number((368.85 / btcPrice).toFixed(8));

  const assets = (currentAssets && currentAssets.length > 0 ? currentAssets : DEFAULT_ASSETS).map(
    (a) => {
      if (a.ticker === 'BTC-EUR') {
        return {
          ...a,
          shares: btcShares,
          costBasis: 350.0,
        };
      }
      return {
        ...a,
        shares: 0,
        costBasis: 0,
      };
    }
  );

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
    monthlySavingsTarget: 900.0,
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
