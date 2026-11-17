import { AppState, HistoryRecord, PostDcaSummaryItem } from './types';
import {
  getActiveMonthlyDcaTotal,
  getCurrentDayOfMonth,
  getCurrentMonthKey,
  getMonthlySavingsAmount,
  getNormalizedMonthlyFlow,
  getShortAccountName,
} from './monthlyFlow';

export function applySavingsTransferToState(
  prev: AppState,
  isAuto = false
): { next: AppState; executed: boolean; error?: string } {
  const amt = getMonthlySavingsAmount(prev);
  if (amt <= 0) {
    return {
      next: prev,
      executed: false,
      error: 'El importe de ahorro mensual es 0,00 €. Configúralo en Ajustes (⚙️).',
    };
  }

  const flow = getNormalizedMonthlyFlow(prev);
  const fromAcc = prev.accounts.find((a) => a.id === flow.savingsFromAccountId);
  const toAcc = prev.accounts.find((a) => a.id === flow.savingsToAccountId);

  if (!fromAcc || !toAcc) {
    return {
      next: prev,
      executed: false,
      error: 'Configura una cuenta de origen y otra de destino en Ajustes (⚙️).',
    };
  }

  if (fromAcc.id === toAcc.id) {
    return {
      next: prev,
      executed: false,
      error: 'La cuenta origen y destino del traspaso no pueden ser la misma.',
    };
  }

  const record: HistoryRecord = {
    id: `hist_${Date.now()}_sav`,
    timestamp: new Date().toISOString(),
    type: 'savings_transfer',
    title: `${isAuto ? '[Auto] ' : ''}Traspaso Ahorro Mensual (${getShortAccountName(
      fromAcc
    )} ➔ ${getShortAccountName(toAcc)})`,
    amountEur: amt,
    reversible: true,
    revertPayload: {
      accountDeltas: [
        { accountId: fromAcc.id, delta: amt },
        { accountId: toAcc.id, delta: -amt },
      ],
    },
  };

  return {
    executed: true,
    next: {
      ...prev,
      accounts: prev.accounts.map((a) => {
        if (a.id === fromAcc.id)
          return { ...a, balance: Number((a.balance - amt).toFixed(2)) };
        if (a.id === toAcc.id)
          return { ...a, balance: Number((a.balance + amt).toFixed(2)) };
        return a;
      }),
      monthlyFlow: {
        ...flow,
        lastSavingsMonth: getCurrentMonthKey(),
        lastAutoError: undefined,
      },
      history: [record, ...prev.history],
    },
  };
}

export function applyDcaPlanToState(
  prev: AppState,
  isAuto = false
): {
  next: AppState;
  ok: boolean;
  error?: string;
  summary?: PostDcaSummaryItem[];
} {
  const totalDca = getActiveMonthlyDcaTotal(prev.assets);
  if (totalDca <= 0) {
    return {
      next: prev,
      ok: false,
      error:
        'El importe total de DCA activo es 0,00 €. Activa o configura algún activo en Ajustes (⚙️).',
    };
  }

  const flow = getNormalizedMonthlyFlow(prev);
  const chargeAcc = prev.accounts.find((a) => a.id === flow.dcaAccountId);
  const chargeName = chargeAcc ? getShortAccountName(chargeAcc) : 'Trade Republic';

  if (!chargeAcc || chargeAcc.balance < totalDca) {
    return {
      next: prev,
      ok: false,
      error: `Saldo insuficiente en ${chargeName}. Necesitas ${totalDca.toFixed(
        2
      )} € y tienes ${(chargeAcc?.balance || 0).toFixed(2)} €.`,
    };
  }

  const summary: PostDcaSummaryItem[] = [];
  const assetDeltas: NonNullable<HistoryRecord['revertPayload']['assetDeltas']> =
    [];

  const updatedAssets = prev.assets.map((asset) => {
    if (asset.dcaEnabled === false) return asset;
    const dca = Number(asset.dcaMonthly || 0);
    if (dca <= 0) return asset;
    const price = asset.priceEur > 0 ? asset.priceEur : 1;
    const boughtShares = Number((dca / price).toFixed(8));
    const newTotal = Number((asset.shares + boughtShares).toFixed(8));

    summary.push({
      assetId: asset.id,
      name: asset.name,
      ticker: asset.resolvedTicker || asset.ticker,
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
    id: `hist_${Date.now()}_dca`,
    timestamp: new Date().toISOString(),
    type: 'dca_execute',
    title: `${isAuto ? '[Auto] ' : ''}Ejecución Plan DCA Mensual (${chargeName})`,
    subtitle: `${summary.length} activos comprados desde ${chargeName}`,
    amountEur: totalDca,
    reversible: true,
    revertPayload: {
      accountDeltas: [{ accountId: chargeAcc.id, delta: totalDca }],
      assetDeltas,
    },
  };

  return {
    ok: true,
    summary,
    next: {
      ...prev,
      accounts: prev.accounts.map((a) =>
        a.id === chargeAcc.id
          ? { ...a, balance: Number((a.balance - totalDca).toFixed(2)) }
          : a
      ),
      assets: updatedAssets,
      monthlyFlow: {
        ...flow,
        lastDcaMonth: getCurrentMonthKey(),
        lastAutoError: undefined,
      },
      history: [record, ...prev.history],
    },
  };
}

export function maybeRunAutoMonthlyFlow(prev: AppState): {
  next: AppState;
  ran: boolean;
} {
  const flow = getNormalizedMonthlyFlow(prev);
  if (flow.executionMode !== 'auto') return { next: prev, ran: false };
  if (getCurrentDayOfMonth() < flow.scheduledDay) return { next: prev, ran: false };

  const currentMonth = getCurrentMonthKey();
  let working = prev;
  let ran = false;

  if (flow.lastSavingsMonth !== currentMonth && getMonthlySavingsAmount(working) > 0) {
    const savRes = applySavingsTransferToState(working, true);
    if (savRes.executed) {
      working = savRes.next;
      ran = true;
    } else if (savRes.error && savRes.error !== flow.lastAutoError) {
      working = {
        ...working,
        monthlyFlow: { ...flow, lastAutoError: savRes.error },
      };
      ran = true;
    }
  }

  const flowAfterSav = getNormalizedMonthlyFlow(working);
  if (
    flowAfterSav.lastDcaMonth !== currentMonth &&
    getActiveMonthlyDcaTotal(working.assets) > 0
  ) {
    const dcaRes = applyDcaPlanToState(working, true);
    if (dcaRes.ok) {
      working = dcaRes.next;
      ran = true;
    } else if (dcaRes.error && dcaRes.error !== flowAfterSav.lastAutoError) {
      working = {
        ...working,
        monthlyFlow: { ...flowAfterSav, lastAutoError: dcaRes.error },
      };
      ran = true;
    }
  }

  return { next: working, ran };
}
