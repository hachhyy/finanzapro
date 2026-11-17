import {
  AppState,
  BankAccount,
  InvestmentAsset,
  MonthlyFlowConfig,
} from './types';

export function getMonthKeyFromDate(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  return `${y}-${m}`;
}

export function getCurrentMonthKey(): string {
  return getMonthKeyFromDate(new Date());
}

export function getMonthKeyFromIso(iso: string): string {
  const parsed = new Date(iso);
  if (Number.isNaN(parsed.getTime())) return '';
  return getMonthKeyFromDate(parsed);
}

export function getCurrentDayOfMonth(): number {
  return new Date().getDate();
}

export function findImaginAccount(accounts: BankAccount[]): BankAccount | undefined {
  return accounts.find((a) => a.name.toLowerCase().includes('imagin')) || accounts[0];
}

export function findTradeRepublicAccount(
  accounts: BankAccount[]
): BankAccount | undefined {
  return (
    accounts.find((a) => a.isTradeRepublic) ||
    accounts.find((a) => a.name.toLowerCase().includes('trade republic')) ||
    accounts[1] ||
    accounts[0]
  );
}

export function getNormalizedMonthlyFlow(state: AppState): MonthlyFlowConfig {
  const cfg = state.monthlyFlow;
  const defaultFrom = findImaginAccount(state.accounts)?.id;
  const defaultTo = findTradeRepublicAccount(state.accounts)?.id;

  const validFrom = state.accounts.some((a) => a.id === cfg?.savingsFromAccountId)
    ? cfg?.savingsFromAccountId
    : defaultFrom;
  const validTo = state.accounts.some((a) => a.id === cfg?.savingsToAccountId)
    ? cfg?.savingsToAccountId
    : defaultTo;
  const validDcaAcc = state.accounts.some((a) => a.id === cfg?.dcaAccountId)
    ? cfg?.dcaAccountId
    : defaultTo;

  const rawDay = Number(cfg?.scheduledDay ?? 2);
  const clampedDay = Math.min(
    28,
    Math.max(1, Number.isFinite(rawDay) ? Math.round(rawDay) : 2)
  );

  return {
    savingsFromAccountId: validFrom,
    savingsToAccountId: validTo,
    executionMode: cfg?.executionMode === 'auto' ? 'auto' : 'manual',
    scheduledDay: clampedDay,
    dcaAccountId: validDcaAcc,
    lastSavingsMonth: cfg?.lastSavingsMonth,
    lastDcaMonth: cfg?.lastDcaMonth,
    lastAutoError: cfg?.lastAutoError,
  };
}

export function getShortAccountName(acc?: BankAccount): string {
  if (!acc) return 'Cuenta';
  const beforeParen = acc.name.split('(')[0].trim();
  return beforeParen || acc.name;
}

export function getActiveMonthlyDcaTotal(assets: InvestmentAsset[]): number {
  return Number(
    assets
      .reduce(
        (sum, a) =>
          a.dcaEnabled !== false ? sum + Number(a.dcaMonthly || 0) : sum,
        0
      )
      .toFixed(2)
  );
}

export function getMonthlySavingsAmount(state: AppState): number {
  const raw = state.monthlySavingsTarget;
  if (raw === undefined || raw === null || !Number.isFinite(Number(raw))) {
    return 1000;
  }
  return Number(raw);
}
