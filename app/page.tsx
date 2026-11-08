'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Wallet, ArrowLeftRight, LineChart } from 'lucide-react';
import {
  AppState,
  PendingItem,
  HistoryRecord,
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
import { HeaderScoreboard } from '@/components/HeaderScoreboard';
import { TabPatrimonio } from '@/components/TabPatrimonio';
import {
  TabPendientesFlujo,
  PostDcaSummaryItem,
} from '@/components/TabPendientesFlujo';
import { TabInversiones } from '@/components/TabInversiones';
import { SettingsSheet } from '@/components/SettingsSheet';

type ActiveTab = 'patrimonio' | 'pendientes' | 'inversiones';

export default function FinanzaProApp() {
  const [state, setState] = useState<AppState>(() => createBlankState());
  const [undoStack, setUndoStack] = useState<AppState[]>([]);
  const [privacyMode, setPrivacyMode] = useState(false);
  const [cloudConnected, setCloudConnected] = useState(false);
  const [activeTab, setActiveTab] = useState<ActiveTab>('patrimonio');
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isRefreshingPrices, setIsRefreshingPrices] = useState(false);

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

  // Fetch live prices in EUR from /api/prices
  const refreshLivePrices = useCallback(async (currentAssets?: AppState['assets']) => {
    setIsRefreshingPrices(true);
    try {
      const list = currentAssets || [];
      const tickers = list.map((a) => a.ticker).join(',');
      const res = await fetch(
        `/api/prices${tickers ? `?tickers=${encodeURIComponent(tickers)}` : ''}`
      );
      const data = await res.json();
      if (data?.prices) {
        setState((prev) => {
          const updatedAssets = prev.assets.map((asset) => {
            const quote = data.prices[asset.ticker];
            if (!quote || !quote.priceEur) return asset;
            return {
              ...asset,
              priceEur: Number(quote.priceEur),
              change24h: Number(quote.change24h ?? asset.change24h ?? 0),
              currency: quote.currency || asset.currency,
            };
          });
          const next: AppState = {
            ...prev,
            assets: updatedAssets,
            lastPriceUpdate: data.updatedAt || new Date().toISOString(),
          };
          saveLocalState(next);
          return next;
        });
      }
    } catch {
      // keep existing cached prices
    } finally {
      setIsRefreshingPrices(false);
    }
  }, []);

  // Initial load from localStorage + Cloud Sync + Live Prices
  useEffect(() => {
    const local = loadLocalState();
    setState(local);

    // Fetch live Yahoo Finance prices on startup in background
    refreshLivePrices(local.assets);

    // Check Supabase Cloud Sync in background
    fetchStateFromCloud().then(({ connected, cloudState }) => {
      setCloudConnected(connected);
      if (cloudState) {
        const localTime = new Date(local.updatedAt || 0).getTime();
        const cloudTime = new Date(cloudState.updatedAt || 0).getTime();
        if (cloudTime > localTime) {
          setState(cloudState);
          saveLocalState(cloudState);
        } else {
          syncStateToCloud(local);
        }
      } else if (connected) {
        syncStateToCloud(local);
      }
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
  // TAB 2 HANDLERS: PENDIENTES, FLUJO MENSUAL, DCA & REVERTIR HISTORIAL
  // ====================================================================
  const handleUpdateMonthlySavingsTarget = (amount: number) => {
    commitState((prev) => ({ ...prev, monthlySavingsTarget: amount }));
  };

  const handleExecuteSavingsTransfer = () => {
    commitState((prev) => {
      const amt = Number(prev.monthlySavingsTarget || 0);
      if (amt <= 0) return prev;

      const imaginAcc =
        prev.accounts.find((a) => a.name.toLowerCase().includes('imagin')) ||
        prev.accounts[0];
      const trAcc =
        prev.accounts.find((a) => a.isTradeRepublic) ||
        prev.accounts.find((a) =>
          a.name.toLowerCase().includes('trade republic')
        ) ||
        prev.accounts[1];

      if (!imaginAcc || !trAcc) return prev;

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'savings_transfer',
        title: 'Traspaso Ahorro Mensual (Imagin ➔ Trade Republic)',
        amountEur: amt,
        reversible: true,
        revertPayload: {
          accountDeltas: [
            { accountId: imaginAcc.id, delta: amt },
            { accountId: trAcc.id, delta: -amt },
          ],
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) => {
          if (a.id === imaginAcc.id)
            return { ...a, balance: Number((a.balance - amt).toFixed(2)) };
          if (a.id === trAcc.id)
            return { ...a, balance: Number((a.balance + amt).toFixed(2)) };
          return a;
        }),
        history: [record, ...prev.history],
      };
    });
  };

  const handleExecuteDcaPlan = (): {
    ok: boolean;
    error?: string;
    summary?: PostDcaSummaryItem[];
  } => {
    const totalDca = state.assets.reduce(
      (sum, a) => sum + Number(a.dcaMonthly || 0),
      0
    );
    if (totalDca <= 0) {
      return {
        ok: false,
        error: 'El importe total de DCA es 0,00 €. Configura un DCA mayor a cero.',
      };
    }

    const trAcc =
      state.accounts.find((a) => a.isTradeRepublic) ||
      state.accounts.find((a) =>
        a.name.toLowerCase().includes('trade republic')
      );

    if (!trAcc || trAcc.balance < totalDca) {
      return {
        ok: false,
        error: `Saldo insuficiente en Trade Republic (Efectivo remunerado). Necesitas ${totalDca.toFixed(
          2
        )} € y tienes ${(trAcc?.balance || 0).toFixed(2)} €.`,
      };
    }

    const summary: PostDcaSummaryItem[] = [];
    const assetDeltas: NonNullable<
      HistoryRecord['revertPayload']['assetDeltas']
    > = [];

    commitState((prev) => {
      const updatedAssets = prev.assets.map((asset) => {
        const dca = Number(asset.dcaMonthly || 0);
        if (dca <= 0) return asset;
        const price = asset.priceEur > 0 ? asset.priceEur : 1;
        const boughtShares = Number((dca / price).toFixed(8));
        const newTotal = Number((asset.shares + boughtShares).toFixed(8));

        summary.push({
          assetId: asset.id,
          name: asset.name,
          ticker: asset.ticker,
          dcaAmountEur: dca,
          priceEur: price,
          addedShares: boughtShares,
          newTotalShares: newTotal,
        });

        assetDeltas.push({
          assetId: asset.id,
          sharesDelta: -boughtShares,
          costBasisDelta: -dca,
        });

        return {
          ...asset,
          shares: newTotal,
          costBasis: Number((asset.costBasis + dca).toFixed(2)),
        };
      });

      const record: HistoryRecord = {
        id: `hist_${Date.now()}`,
        timestamp: new Date().toISOString(),
        type: 'dca_execute',
        title: 'Ejecución Plan DCA Mensual Trade Republic',
        subtitle: `${summary.length} activos comprados desde Efectivo remunerado`,
        amountEur: totalDca,
        reversible: true,
        revertPayload: {
          accountDeltas: [{ accountId: trAcc.id, delta: totalDca }],
          assetDeltas,
        },
      };

      return {
        ...prev,
        accounts: prev.accounts.map((a) =>
          a.id === trAcc.id
            ? { ...a, balance: Number((a.balance - totalDca).toFixed(2)) }
            : a
        ),
        assets: updatedAssets,
        history: [record, ...prev.history],
      };
    });

    return { ok: true, summary };
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

      return {
        ...prev,
        accounts: nextAccounts,
        trAccruedInterest: nextAccrued,
        pendingItems: nextPending,
        assets: nextAssets,
        history: prev.history.filter((h) => h.id !== recordId),
      };
    });
  };

  // ====================================================================
  // TAB 3 HANDLERS: INVERSIONES (PARTICIPACIONES, COMPRA & VENTA)
  // ====================================================================
  const handleAddAsset = (name: string, ticker: string, dcaMonthly: number) => {
    const newId = `ast_${Date.now()}`;
    commitState((prev) => ({
      ...prev,
      assets: [
        ...prev.assets,
        {
          id: newId,
          name,
          ticker,
          dcaMonthly,
          shares: 0,
          costBasis: 0,
          priceEur: 25,
          change24h: 0,
          currency: 'EUR',
        },
      ],
    }));
    setTimeout(() => refreshLivePrices(), 150);
  };

  const handleUpdateAssetPosition = ({
    assetId,
    name,
    ticker,
    shares,
    costBasis,
    dcaMonthly,
  }: {
    assetId: string;
    name: string;
    ticker: string;
    shares: number;
    costBasis: number;
    dcaMonthly: number;
  }) => {
    commitState((prev) => ({
      ...prev,
      assets: prev.assets.map((a) =>
        a.id === assetId
          ? { ...a, name, ticker, shares, costBasis, dcaMonthly }
          : a
      ),
    }));
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
    <div className="min-h-dvh bg-black text-white flex flex-col pb-28">
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

      {/* CONTENIDO DE LA PESTAÑA ACTIVA */}
      <main className="relative z-10 pointer-events-auto flex-1 w-full max-w-lg mx-auto px-4 pt-4">
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
          />
        )}

        {activeTab === 'pendientes' && (
          <TabPendientesFlujo
            state={state}
            privacyMode={privacyMode}
            onUpdateMonthlySavingsTarget={handleUpdateMonthlySavingsTarget}
            onExecuteSavingsTransfer={handleExecuteSavingsTransfer}
            onExecuteDcaPlan={handleExecuteDcaPlan}
            onSavePostDcaAdjustments={handleSavePostDcaAdjustments}
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
      </main>

      {/* BARRA DE NAVEGACIÓN INFERIOR ESTILO iOS / TRADE REPUBLIC */}
      <nav className="fixed bottom-0 inset-x-0 z-50 pointer-events-auto bg-[#1C1C1E]/95 backdrop-blur-xl border-t border-[#2C2C2E]">
        <div className="relative z-50 pointer-events-auto max-w-lg mx-auto grid grid-cols-3 px-2 py-2">
          <button
            type="button"
            onClick={() => setActiveTab('patrimonio')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition cursor-pointer pointer-events-auto ${
              activeTab === 'patrimonio'
                ? 'text-[#10B981] bg-white/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <Wallet className="w-5 h-5" />
            <span className="text-[11px] font-semibold mt-1">Patrimonio</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('pendientes')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition cursor-pointer pointer-events-auto ${
              activeTab === 'pendientes'
                ? 'text-[#6366F1] bg-white/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <ArrowLeftRight className="w-5 h-5" />
            <span className="text-[11px] font-semibold mt-1">
              Pendientes y Flujo
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('inversiones')}
            className={`flex flex-col items-center justify-center py-2 rounded-2xl transition cursor-pointer pointer-events-auto ${
              activeTab === 'inversiones'
                ? 'text-[#10B981] bg-white/5'
                : 'text-zinc-400 hover:text-zinc-200'
            }`}
          >
            <LineChart className="w-5 h-5" />
            <span className="text-[11px] font-semibold mt-1">Inversiones</span>
          </button>
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
