'use client';

import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { Wallet, ArrowLeftRight, LineChart } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AppState,
  MonthlyFlowConfig,
  PendingItem,
  HistoryRecord,
  PostDcaSummaryItem,
  createBlankState,
  createDemoState,
  getPendingEffectiveAmount,
} from '@/lib/types';
import {
  loadLocalState,
  saveLocalState,
  syncStateToCloud,
  fetchStateFromCloud,
} from '@/lib/supabase';
import { getMonthKeyFromIso } from '@/lib/monthlyFlow';
import {
  applySavingsTransferToState,
  applyDcaPlanToState,
  maybeRunAutoMonthlyFlow,
} from '@/lib/monthlyFlowEngine';
import { HeaderScoreboard } from '@/components/HeaderScoreboard';
import { TabPatrimonio } from '@/components/TabPatrimonio';
import { TabPendientesFlujo } from '@/components/TabPendientesFlujo';
import { TabInversiones } from '@/components/TabInversiones';
import { SettingsSheet } from '@/components/SettingsSheet';

type ActiveTab = 'patrimonio' | 'pendientes' | 'inversiones';
const TAB_ORDER: ActiveTab[] = ['patrimonio', 'pendientes', 'inversiones'];

export default function FinanzaProApp() {
  const [state, setState] = useState<AppState>(() => createBlankState());
  const [undoStack, setUndoStack] = useState<AppState[]>([]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('patrimonio');
  const [tabDirection, setTabDirection] = useState<number>(0);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);
  const swipeStartRef = useRef<{ x: number; y: number; target: EventTarget | null } | null>(null);

  const switchTab = useCallback(
    (nextTab: ActiveTab) => {
      setActiveTab((curr) => {
        if (curr === nextTab) return curr;
        const currIdx = TAB_ORDER.indexOf(curr);
        const nextIdx = TAB_ORDER.indexOf(nextTab);
        setTabDirection(nextIdx > currIdx ? 1 : -1);
        return nextTab;
      });
    },
    []
  );

  // Persist helper with 15-state undo memory + instant localStorage + background Supabase sync
  const commitState = useCallback(
    (updater: (prev: AppState) => AppState, recordUndo = true) => {
      setState((prev) => {
        if (recordUndo) {
          setUndoStack((stack) => [...stack.slice(-14), prev]);
        }
        const next: AppState = {
          ...updater(prev),
          updatedAt: new Date().toISOString(),
        };
        saveLocalState(next);
        syncStateToCloud(next).then((ok) => {
          if (ok) setCloudConnected(true);
        });
        return next;
      });
    },
    []
  );

  const handleUndo = useCallback(() => {
    setUndoStack((stack) => {
      if (stack.length === 0) return stack;
      const previous = stack[stack.length - 1];
      setState(previous);
      saveLocalState(previous);
      syncStateToCloud(previous);
      return stack.slice(0, -1);
    });
  }, []);

  // Fetch live prices in EUR from /api/prices (supports ISIN and Ticker resolution)
  const refreshLivePrices = useCallback(
    async (currentAssets?: AppState['assets'], allowAutoFlow = false) => {
      setIsRefreshingPrices(true);
      try {
        const list = currentAssets || [];
        const codes = list
          .map((a) => a.isin || a.resolvedTicker || a.ticker)
          .filter(Boolean)
          .join(',');
        const res = await fetch(
          `/api/prices${codes ? `?tickers=${encodeURIComponent(codes)}` : ''}`
        );
        const data = await res.json();
        if (data?.prices) {
          setState((prev) => {
            const updatedAssets = prev.assets.map((asset) => {
              const isinKey = (asset.isin || '').toUpperCase();
              const resolvedKey = (asset.resolvedTicker || '').toUpperCase();
              const tickerKey = (asset.ticker || '').toUpperCase();
              const quote =
                (isinKey && data.prices[isinKey]) ||
                (resolvedKey && data.prices[resolvedKey]) ||
                (tickerKey && data.prices[tickerKey]);
              if (!quote || !quote.priceEur) return asset;
              const nextResolved =
                quote.resolvedTicker || asset.resolvedTicker || asset.ticker;
              return {
                ...asset,
                isin: quote.isin || asset.isin || asset.ticker,
                ticker: nextResolved,
                resolvedTicker: nextResolved,
                priceEur: Number(quote.priceEur),
                change24h: Number(quote.change24h ?? asset.change24h ?? 0),
                currency: quote.currency || asset.currency || 'EUR',
              };
            });
            const withLivePrices: AppState = {
              ...prev,
              assets: updatedAssets,
              lastPriceUpdate: data.updatedAt || new Date().toISOString(),
            };
            if (allowAutoFlow) {
              const autoRes = maybeRunAutoMonthlyFlow(withLivePrices);
              if (autoRes.ran) {
                const finalAutoState: AppState = {
                  ...autoRes.next,
                  updatedAt: new Date().toISOString(),
                };
                saveLocalState(finalAutoState);
                syncStateToCloud(finalAutoState);
                return finalAutoState;
              }
            }
            saveLocalState(withLivePrices);
            return withLivePrices;
          });
        }
      } catch {
        // keep existing cached prices
      } finally {
        setIsRefreshingPrices(false);
      }
    },
    []
  );

  // Initial load from localStorage + Cloud Sync + Live Prices (+ Auto Flow check)
  useEffect(() => {
    const local = loadLocalState();
    setState(local);

    // Check Supabase Cloud Sync first so cloud data is never overwritten by a blank local state
    fetchStateFromCloud().then(({ connected, cloudState }) => {
      setCloudConnected(connected);
      if (cloudState) {
        const localIsBlank =
          local.accounts.every((a) => Number(a.balance || 0) === 0) &&
          local.pendingItems.length === 0 &&
          local.assets.every((a) => Number(a.shares || 0) === 0);

        const cloudIsBlank =
          cloudState.accounts.every((a) => Number(a.balance || 0) === 0) &&
          cloudState.pendingItems.length === 0 &&
          cloudState.assets.every((a) => Number(a.shares || 0) === 0);

        const localTime = new Date(local.updatedAt || 0).getTime();
        const cloudTime = new Date(cloudState.updatedAt || 0).getTime();

        if (!cloudIsBlank && (localIsBlank || cloudTime >= localTime)) {
          setState(cloudState);
          saveLocalState(cloudState);
          refreshLivePrices(cloudState.assets, true);
          return;
        } else if (!localIsBlank && cloudTime < localTime) {
          syncStateToCloud(local);
        }
      }
      refreshLivePrices(local.assets, true);
    });
  }, [refreshLivePrices]);

  // Strict Accounting Formulas for Top Scoreboard
  const { liquidezTotal, inversionesTotal, porCobrarTotal, deudasTotal } =
    useMemo(() => {
      const liq = state.accounts.reduce(
        (sum, acc) => sum + Number(acc.balance || 0),
        0
      );
      const inv = state.assets.reduce(
        (sum, ast) =>
          sum + Number(ast.shares || 0) * Number(ast.priceEur || 0),
        0
      );
      const cobrar = state.pendingItems
        .filter((i) => i.type === 'income')
        .reduce((sum, i) => sum + getPendingEffectiveAmount(i), 0);
      const deudas = state.pendingItems
        .filter((i) => i.type === 'debt')
        .reduce((sum, i) => sum + getPendingEffectiveAmount(i), 0);

      return {
        liquidezTotal: liq,
        inversionesTotal: inv,
        porCobrarTotal: cobrar,
        deudasTotal: deudas,
      };
    }, [state.accounts, state.assets, state.pendingItems]);

  // ====================================================================
  // TAB 1 HANDLERS: PATRIMONIO & MOTOR INTERÉS 2,5%
  // ====================================================================
  const handleUpdateAccount = (id: string, name: string, balance: number) => {
    commitState((prev) => ({
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === id ? { ...a, name, balance } : a
      ),
    }));
  };

  const handleAddAccount = (name: string, balance: number) => {
    commitState((prev) => ({
      ...prev,
      accounts: [
        ...prev.accounts,
        {
          id: `acc_${Date.now()}`,
          name,
          balance,
          isTradeRepublic: name.toLowerCase().includes('trade republic'),
        },
      ],
    }));
  };

  const handleDeleteAccount = (id: string) => {
    commitState((prev) => ({
      ...prev,
      accounts: prev.accounts.filter((a) => a.id !== id),
    }));
  };

  const handleTransferBetweenAccounts = (
    fromId: string,
    toId: string,
    amount: number
  ) => {
    commitState((prev) => {
      const fromAcc = prev.accounts.find((a) => a.id === fromId);
      const toAcc = prev.accounts.find((a) => a.id === toId);
      if (!fromAcc || !toAcc) return prev;

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'transfer',
        title: `Transferencia: ${fromAcc.name} ➔ ${toAcc.name}`,
        amountEur: amount,
        reversible: true,
        revertPayload: {
          accountDeltas: [
            { accountId: fromId, delta: amount },
            { accountId: toId, delta: -amount },
          ],
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) => {
          if (a.id === fromId) return { ...a, balance: a.balance - amount };
          if (a.id === toId) return { ...a, balance: a.balance + amount };
          return a;
        }),
        history: [record, ...prev.history],
      };
    });
  };

  const handleUpdateTRRate = (rate: number) => {
    commitState((prev) => ({ ...prev, trInterestRate: rate }));
  };

  const handleUpdateTRAccrued = (accrued: number) => {
    commitState((prev) => ({ ...prev, trAccruedInterest: accrued }));
  };

  const handleClaimTRInterest = () => {
    commitState((prev) => {
      const accrued = Number(prev.trAccruedInterest || 0);
      if (accrued <= 0) return prev;

      const trAcc =
        prev.accounts.find((a) => a.isTradeRepublic) ||
        prev.accounts.find((a) =>
          a.name.toLowerCase().includes('trade republic')
        );
      if (!trAcc) return prev;

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'interest_claim',
        title: 'Cobro Interés Remunerado Trade Republic (Día 1)',
        subtitle: `Sumado a ${trAcc.name}`,
        amountEur: accrued,
        reversible: true,
        revertPayload: {
          accountDeltas: [{ accountId: trAcc.id, delta: -accrued }],
          trAccruedDelta: accrued,
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === trAcc.id
            ? { ...a, balance: Number((a.balance + accrued).toFixed(2)) }
            : a
        ),
        trAccruedInterest: 0,
        history: [record, ...prev.history],
      };
    });
  };

  // ====================================================================
  // FLUJO MENSUAL (AHORRO + DCA) & PENDIENTES HANDLERS
  // ====================================================================
  const handleSaveMonthlyFlowSettings = ({
    monthlySavingsTarget,
    monthlyFlow,
    assetDcaUpdates,
  }: {
    monthlySavingsTarget: number;
    monthlyFlow: MonthlyFlowConfig;
    assetDcaUpdates: { assetId: string; dcaMonthly: number; dcaEnabled: boolean }[];
  }) => {
    commitState((prev) => {
      const updatedAssets = prev.assets.map((asset) => {
        const upd = assetDcaUpdates.find((u) => u.assetId === asset.id);
        if (!upd) return asset;
        return {
          ...asset,
          dcaMonthly: upd.dcaMonthly,
          dcaEnabled: upd.dcaEnabled,
        };
      });
      const updatedState: AppState = {
        ...prev,
        monthlySavingsTarget,
        monthlyFlow,
        assets: updatedAssets,
      };
      if (monthlyFlow.executionMode === 'auto') {
        return maybeRunAutoMonthlyFlow(updatedState).next;
      }
      return updatedState;
    });
  };

  const handleExecuteSavingsTransfer = (): { ok: boolean; error?: string } => {
    const check = applySavingsTransferToState(state, false);
    if (!check.executed) {
      return { ok: false, error: check.error };
    }
    commitState((prev) => applySavingsTransferToState(prev, false).next);
    return { ok: true };
  };

  const handleExecuteDcaPlan = (): {
    ok: boolean;
    error?: string;
    summary?: PostDcaSummaryItem[];
  } => {
    const check = applyDcaPlanToState(state, false);
    if (!check.ok) {
      return { ok: false, error: check.error };
    }
    commitState((prev) => applyDcaPlanToState(prev, false).next);
    return { ok: true, summary: check.summary };
  };

  const handleSavePostDcaAdjustments = (
    adjustments: { assetId: string; finalShares: number }[]
  ) => {
    commitState((prev) => ({
      ...prev,
      assets: prev.assets.map((asset) => {
        const adj = adjustments.find((x) => x.assetId === asset.id);
        if (!adj) return asset;
        return {
          ...asset,
          shares: Number(adj.finalShares.toFixed(8)),
        };
      }),
    }));
  };

  const handleUpsertPendingItem = (item: PendingItem) => {
    commitState((prev) => {
      const exists = prev.pendingItems.some((i) => i.id === item.id);
      const nextItems = exists
        ? prev.pendingItems.map((i) => (i.id === item.id ? item : i))
        : [...prev.pendingItems, item];
      return { ...prev, pendingItems: nextItems };
    });
  };

  const handleDeletePendingItem = (id: string) => {
    commitState((prev) => ({
      ...prev,
      pendingItems: prev.pendingItems.filter((i) => i.id !== id),
    }));
  };

  const handleSettlePending = ({
    itemId,
    subItemId,
    accountId,
    amountToSettle,
  }: {
    itemId: string;
    subItemId?: string;
    accountId: string;
    amountToSettle: number;
  }) => {
    commitState((prev) => {
      const targetItem = prev.pendingItems.find((i) => i.id === itemId);
      const targetAccount = prev.accounts.find((a) => a.id === accountId);
      if (!targetItem || !targetAccount || amountToSettle <= 0) return prev;

      const isIncome = targetItem.type === 'income';
      const accountDelta = isIncome ? amountToSettle : -amountToSettle;
      const backupClone: PendingItem = JSON.parse(JSON.stringify(targetItem));

      let itemDeleted = false;
      const updatedPending: PendingItem[] = [];

      for (const item of prev.pendingItems) {
        if (item.id !== itemId) {
          updatedPending.push(item);
          continue;
        }

        if (item.mode === 'subitems' && subItemId) {
          const nextSubs = item.subItems.map((sub) => {
            if (sub.id !== subItemId) return sub;
            const remainingSub = Number(
              (sub.amount - amountToSettle).toFixed(2)
            );
            if (remainingSub <= 0.004) {
              return { ...sub, amount: 0, completed: true };
            }
            return { ...sub, amount: remainingSub, completed: false };
          });

          const remainingParent = nextSubs
            .filter((s) => !s.completed)
            .reduce((sum, s) => sum + s.amount, 0);

          if (remainingParent <= 0.004) {
            itemDeleted = true;
          } else {
            updatedPending.push({
              ...item,
              amount: Number(remainingParent.toFixed(2)),
              subItems: nextSubs,
            });
          }
        } else {
          const remaining = Number((item.amount - amountToSettle).toFixed(2));
          if (remaining <= 0.004) {
            itemDeleted = true;
          } else {
            updatedPending.push({ ...item, amount: remaining });
          }
        }
      }

      const subLabel = subItemId
        ? targetItem.subItems.find((s) => s.id === subItemId)?.name
        : undefined;

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: isIncome ? 'income_collect' : 'debt_pay',
        title: `${isIncome ? 'Cobro' : 'Pago'}: ${targetItem.name}${
          subLabel ? ` (${subLabel})` : ''
        }`,
        subtitle: `${isIncome ? 'Ingresado en' : 'Pagado desde'} ${
          targetAccount.name
        }`,
        amountEur: amountToSettle,
        reversible: true,
        revertPayload: {
          accountDeltas: [{ accountId, delta: -accountDelta }],
          pendingRestore: {
            itemId,
            subItemId,
            amountDelta: amountToSettle,
            wasDeleted: itemDeleted,
            backupItem: backupClone,
          },
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === accountId
            ? { ...a, balance: Number((a.balance + accountDelta).toFixed(2)) }
            : a
        ),
        pendingItems: updatedPending,
        history: [record, ...prev.history],
      };
    });
  };

  const handleRevertHistoryRecord = (recordId: string) => {
    commitState((prev) => {
      const rec = prev.history.find((h) => h.id === recordId);
      if (!rec || !rec.reversible) return prev;

      const { accountDeltas, trAccruedDelta, pendingRestore, assetDeltas } =
        rec.revertPayload;

      // 1. Revert account balances
      let nextAccounts = [...prev.accounts];
      if (accountDeltas) {
        for (const d of accountDeltas) {
          nextAccounts = nextAccounts.map((acc) =>
            acc.id === d.accountId
              ? { ...acc, balance: Number((acc.balance + d.delta).toFixed(2)) }
              : acc
          );
        }
      }

      // 2. Revert TR accrued interest if applicable
      const nextAccrued =
        trAccruedDelta !== undefined
          ? Number((prev.trAccruedInterest + trAccruedDelta).toFixed(4))
          : prev.trAccruedInterest;

      // 3. Revert pending income/debt item
      let nextPending = [...prev.pendingItems];
      if (pendingRestore) {
        const existing = nextPending.find(
          (i) => i.id === pendingRestore.itemId
        );
        if (!existing && pendingRestore.backupItem) {
          nextPending.push(pendingRestore.backupItem);
        } else if (existing) {
          nextPending = nextPending.map((item) => {
            if (item.id !== pendingRestore.itemId) return item;
            if (item.mode === 'subitems' && pendingRestore.subItemId) {
              const restoredSubs = item.subItems.map((s) =>
                s.id === pendingRestore.subItemId
                  ? {
                      ...s,
                      amount: Number(
                        (s.amount + pendingRestore.amountDelta).toFixed(2)
                      ),
                      completed: false,
                    }
                  : s
              );
              const sum = restoredSubs
                .filter((s) => !s.completed)
                .reduce((acc, s) => acc + s.amount, 0);
              return {
                ...item,
                amount: Number(sum.toFixed(2)),
                subItems: restoredSubs,
              };
            }
            return {
              ...item,
              amount: Number(
                (item.amount + pendingRestore.amountDelta).toFixed(2)
              ),
            };
          });
        }
      }

      // 4. Revert investment asset shares & costBasis
      let nextAssets = [...prev.assets];
      if (assetDeltas) {
        for (const ad of assetDeltas) {
          nextAssets = nextAssets.map((ast) =>
            ast.id === ad.assetId
              ? {
                  ...ast,
                  shares: Math.max(
                    0,
                    Number((ast.shares + ad.sharesDelta).toFixed(8))
                  ),
                  costBasis: Math.max(
                    0,
                    Number((ast.costBasis + ad.costBasisDelta).toFixed(2))
                  ),
                }
              : ast
          );
        }
      }

      const remainingHistory = prev.history.filter((h) => h.id !== recordId);
      const recMonth = getMonthKeyFromIso(rec.timestamp);
      const hasOtherSavingsInMonth =
        !!recMonth &&
        remainingHistory.some(
          (h) =>
            h.type === 'savings_transfer' &&
            getMonthKeyFromIso(h.timestamp) === recMonth
        );
      const hasOtherDcaInMonth =
        !!recMonth &&
        remainingHistory.some(
          (h) =>
            h.type === 'dca_execute' &&
            getMonthKeyFromIso(h.timestamp) === recMonth
        );

      const nextMonthlyFlow = prev.monthlyFlow
        ? {
            ...prev.monthlyFlow,
            ...(rec.type === 'savings_transfer' &&
            prev.monthlyFlow.lastSavingsMonth === recMonth &&
            !hasOtherSavingsInMonth
              ? { lastSavingsMonth: undefined }
              : {}),
            ...(rec.type === 'dca_execute' &&
            prev.monthlyFlow.lastDcaMonth === recMonth &&
            !hasOtherDcaInMonth
              ? { lastDcaMonth: undefined }
              : {}),
          }
        : prev.monthlyFlow;

      return {
        ...prev,
        accounts: nextAccounts,
        trAccruedInterest: nextAccrued,
        pendingItems: nextPending,
        assets: nextAssets,
        monthlyFlow: nextMonthlyFlow,
        history: remainingHistory,
      };
    });
  };

  // ====================================================================
  // TAB 3 HANDLERS: INVERSIONES (PARTICIPACIONES, COMPRA & VENTA)
  // ====================================================================
  const handleAddAsset = (params: {
    isin: string;
    name: string;
    resolvedTicker: string;
    priceEur: number;
    change24h?: number;
    dcaMonthly: number;
    shares?: number;
    costBasis?: number;
  }) => {
    const newId = `ast_${Date.now()}`;
    const cleanCode = params.isin.trim().toUpperCase();
    const cleanTicker = params.resolvedTicker.trim().toUpperCase();
    const newAsset = {
      id: newId,
      name: params.name.trim() || cleanCode,
      isin: cleanCode,
      ticker: cleanTicker,
      resolvedTicker: cleanTicker,
      dcaMonthly: Number((params.dcaMonthly || 0).toFixed(2)),
      shares: Number((params.shares || 0).toFixed(8)),
      costBasis: Number((params.costBasis || 0).toFixed(2)),
      priceEur: Number(params.priceEur > 0 ? params.priceEur : 50),
      change24h: Number(params.change24h || 0),
      currency: 'EUR',
    };

    commitState((prev) => {
      const nextAssets = [...prev.assets, newAsset];
      setTimeout(() => refreshLivePrices(nextAssets), 150);
      return {
        ...prev,
        assets: nextAssets,
      };
    });
  };

  const handleUpdateAssetPosition = ({
    assetId,
    name,
    isin,
    ticker,
    resolvedTicker,
    priceEur,
    shares,
    costBasis,
    dcaMonthly,
  }: {
    assetId: string;
    name: string;
    isin?: string;
    ticker: string;
    resolvedTicker?: string;
    priceEur?: number;
    shares: number;
    costBasis: number;
    dcaMonthly: number;
  }) => {
    commitState((prev) => {
      const nextAssets = prev.assets.map((a) => {
        if (a.id !== assetId) return a;
        const nextTicker = (resolvedTicker || ticker || a.ticker)
          .trim()
          .toUpperCase();
        const nextIsin = (isin || a.isin || nextTicker).trim().toUpperCase();
        return {
          ...a,
          name,
          isin: nextIsin,
          ticker: nextTicker,
          resolvedTicker: nextTicker,
          priceEur:
            priceEur !== undefined && priceEur > 0 ? priceEur : a.priceEur,
          shares,
          costBasis,
          dcaMonthly,
        };
      });
      return {
        ...prev,
        assets: nextAssets,
      };
    });
  };

  const handleDeleteAsset = (assetId: string) => {
    commitState((prev) => ({
      ...prev,
      assets: prev.assets.filter((a) => a.id !== assetId),
    }));
  };

  const handleBuyAssetManual = ({
    assetId,
    accountId,
    amountEur,
    addedShares,
  }: {
    assetId: string;
    accountId: string;
    amountEur: number;
    addedShares: number;
  }) => {
    commitState((prev) => {
      const asset = prev.assets.find((a) => a.id === assetId);
      const account = prev.accounts.find((a) => a.id === accountId);
      if (!asset || !account) return prev;

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'asset_buy',
        title: `Compra: ${asset.name} (+${addedShares.toFixed(6)} part.)`,
        subtitle: `Descontado de ${account.name}`,
        amountEur,
        reversible: true,
        revertPayload: {
          accountDeltas: [{ accountId, delta: amountEur }],
          assetDeltas: [
            {
              assetId,
              sharesDelta: -addedShares,
              costBasisDelta: -amountEur,
            },
          ],
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === accountId
            ? { ...a, balance: Number((a.balance - amountEur).toFixed(2)) }
            : a
        ),
        assets: prev.accounts
          ? prev.assets.map((ast) =>
              ast.id === assetId
                ? {
                    ...ast,
                    shares: Number((ast.shares + addedShares).toFixed(8)),
                    costBasis: Number((ast.costBasis + amountEur).toFixed(2)),
                  }
                : ast
            )
          : prev.assets,
        history: [record, ...prev.history],
      };
    });
  };

  const handleSellAssetManual = ({
    assetId,
    accountId,
    amountEur,
    soldShares,
  }: {
    assetId: string;
    accountId: string;
    amountEur: number;
    soldShares: number;
  }) => {
    commitState((prev) => {
      const asset = prev.assets.find((a) => a.id === assetId);
      const account = prev.accounts.find((a) => a.id === accountId);
      if (!asset || !account) return prev;

      const actualSoldShares = Math.min(asset.shares, soldShares);
      const proportion =
        asset.shares > 0 ? actualSoldShares / asset.shares : 1;
      const costBasisReduced = Number(
        (asset.costBasis * proportion).toFixed(2)
      );

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'asset_sell',
        title: `Venta: ${asset.name} (-${actualSoldShares.toFixed(6)} part.)`,
        subtitle: `Abonado en ${account.name}`,
        amountEur,
        reversible: true,
        revertPayload: {
          accountDeltas: [{ accountId, delta: -amountEur }],
          assetDeltas: [
            {
              assetId,
              sharesDelta: actualSoldShares,
              costBasisDelta: costBasisReduced,
            },
          ],
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === accountId
            ? { ...a, balance: Number((a.balance + amountEur).toFixed(2)) }
            : a
        ),
        assets: prev.assets.map((ast) =>
          ast.id === assetId
            ? {
                ...ast,
                shares: Math.max(
                  0,
                  Number((ast.shares - actualSoldShares).toFixed(8))
                ),
                costBasis: Math.max(
                  0,
                  Number((ast.costBasis - costBasisReduced).toFixed(2))
                ),
              }
            : ast
        ),
        history: [record, ...prev.history],
      };
    });
  };

  return (
    <div
      style={{
        paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 6.5rem)',
      }}
      className="min-h-dvh bg-black text-white flex flex-col pb-32"
    >
      {/* CABECERA SUPERIOR FIJA Y MARCADOR DOBLE */}
      <HeaderScoreboard
        cloudConnected={cloudConnected}
        canUndo={undoStack.length > 0}
        onUndo={handleUndo}
        privacyMode={privacyMode}
        onTogglePrivacy={() => setPrivacyMode((p) => !p)}
        onOpenSettings={() => setIsSettingsOpen(true)}
        liquidezTotal={liquidezTotal}
        inversionesTotal={inversionesTotal}
        porCobrarTotal={porCobrarTotal}
        deudasTotal={deudasTotal}
      />

      {/* CONTENIDO DE LA PESTAÑA ACTIVA (con soporte de deslizamiento horizontal entre pestañas) */}
      <main
        style={{
          paddingBottom: 'calc(env(safe-area-inset-bottom, 0px) + 5rem)',
        }}
        onTouchStart={(e) => {
          const touch = e.touches[0];
          if (!touch) return;
          swipeStartRef.current = {
            x: touch.clientX,
            y: touch.clientY,
            target: e.target,
          };
        }}
        onTouchEnd={(e) => {
          const start = swipeStartRef.current;
          swipeStartRef.current = null;
          if (!start) return;
          const el = start.target as HTMLElement | null;
          if (
            el &&
            el.closest('input, textarea, select, .recharts-wrapper, [role="dialog"]')
          ) {
            return;
          }
          const touch = e.changedTouches[0];
          if (!touch) return;
          const dx = touch.clientX - start.x;
          const dy = touch.clientY - start.y;
          if (Math.abs(dx) > 64 && Math.abs(dx) > Math.abs(dy) * 1.6) {
            const idx = TAB_ORDER.indexOf(activeTab);
            if (dx < 0 && idx < TAB_ORDER.length - 1) {
              switchTab(TAB_ORDER[idx + 1]);
            } else if (dx > 0 && idx > 0) {
              switchTab(TAB_ORDER[idx - 1]);
            }
          }
        }}
        className="relative z-10 pointer-events-auto flex-1 w-full max-w-lg mx-auto px-4 pt-4 pb-32 overflow-x-hidden"
      >
        <AnimatePresence mode="wait" initial={false} custom={tabDirection}>
          <motion.div
            key={activeTab}
            custom={tabDirection}
            initial={{ opacity: 0, x: tabDirection * 18 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: tabDirection * -18 }}
            transition={{ type: 'spring', bounce: 0, duration: 0.28 }}
          >
            {activeTab === 'patrimonio' && (
              <TabPatrimonio
                state={state}
                privacyMode={privacyMode}
                onUpdateAccount={handleUpdateAccount}
                onAddAccount={handleAddAccount}
                onDeleteAccount={handleDeleteAccount}
                onTransferBetweenAccounts={handleTransferBetweenAccounts}
                onUpdateTRRate={handleUpdateTRRate}
                onUpdateTRAccrued={handleUpdateTRAccrued}
                onClaimTRInterest={handleClaimTRInterest}
                onExecuteSavingsTransfer={handleExecuteSavingsTransfer}
                onExecuteDcaPlan={handleExecuteDcaPlan}
                onSavePostDcaAdjustments={handleSavePostDcaAdjustments}
                onSaveMonthlyFlowSettings={handleSaveMonthlyFlowSettings}
              />
            )}

            {activeTab === 'pendientes' && (
              <TabPendientesFlujo
                state={state}
                privacyMode={privacyMode}
                onUpsertPendingItem={handleUpsertPendingItem}
                onDeletePendingItem={handleDeletePendingItem}
                onSettlePending={handleSettlePending}
                onRevertHistoryRecord={handleRevertHistoryRecord}
              />
            )}

            {activeTab === 'inversiones' && (
              <TabInversiones
                state={state}
                privacyMode={privacyMode}
                isRefreshingPrices={isRefreshingPrices}
                onRefreshPrices={() => refreshLivePrices(state.assets)}
                onAddAsset={handleAddAsset}
                onUpdateAssetPosition={handleUpdateAssetPosition}
                onDeleteAsset={handleDeleteAsset}
                onBuyAssetManual={handleBuyAssetManual}
                onSellAssetManual={handleSellAssetManual}
              />
            )}
          </motion.div>
        </AnimatePresence>
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR ESTILO iOS / TRADE REPUBLIC */}
      <nav
        style={{
          paddingBottom: 'max(env(safe-area-inset-bottom, 0px), 0.5rem)',
        }}
        className="fixed bottom-0 inset-x-0 z-40 pointer-events-auto bg-[#0C0C0E]/90 backdrop-blur-2xl border-t border-white/[0.08]"
      >
        <div className="relative z-40 pointer-events-auto max-w-lg mx-auto grid grid-cols-3 gap-1 px-2.5 pt-1.5 pb-1">
          {(
            [
              {
                id: 'patrimonio' as ActiveTab,
                label: 'Patrimonio',
                icon: Wallet,
                activeColor: 'text-[#10B981]',
              },
              {
                id: 'pendientes' as ActiveTab,
                label: 'Pendientes y Flujo',
                icon: ArrowLeftRight,
                activeColor: 'text-[#6366F1]',
              },
              {
                id: 'inversiones' as ActiveTab,
                label: 'Inversiones',
                icon: LineChart,
                activeColor: 'text-[#10B981]',
              },
            ] as const
          ).map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => switchTab(tab.id)}
                className={`relative flex flex-col items-center justify-center py-2 rounded-2xl transition-colors cursor-pointer pointer-events-auto active:scale-[0.97] ${
                  isActive
                    ? tab.activeColor
                    : 'text-zinc-500 hover:text-zinc-300'
                }`}
              >
                {isActive && (
                  <motion.span
                    layoutId="bottomNavActivePill"
                    transition={{ type: 'spring', bounce: 0, duration: 0.34 }}
                    className="absolute inset-0 rounded-2xl bg-white/[0.06] border border-white/[0.07]"
                  />
                )}
                <Icon className="relative z-10 w-5 h-5" />
                <span className="relative z-10 text-[11px] font-semibold mt-1 tracking-[-0.01em]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>

      {/* MODAL DE AJUSTES (BOTTOM SHEET) */}
      <SettingsSheet
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        cloudConnected={cloudConnected}
        onLoadDemoTemplate={() => {
          commitState((prev) => createDemoState(prev.assets));
        }}
        onResetAllToZero={() => {
          commitState((prev) => createBlankState(prev.assets));
        }}
        onImportState={(imported) => {
          commitState(() => imported);
        }}
        onReconnectSupabase={() => {
          fetchStateFromCloud().then(({ connected, cloudState }) => {
            setCloudConnected(connected);
            if (cloudState) {
              commitState(() => cloudState, false);
            } else if (connected) {
              syncStateToCloud(state);
            }
          });
        }}
      />
    </div>
  );
}
