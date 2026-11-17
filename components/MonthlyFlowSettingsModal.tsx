'use client';

import React, { useState, useMemo } from 'react';
import { Wallet } from 'lucide-react';
import { AppState, MonthlyFlowConfig, formatEUR } from '@/lib/types';
import {
  getMonthlySavingsAmount,
  getNormalizedMonthlyFlow,
  getShortAccountName,
} from '@/lib/monthlyFlow';
import { BottomSheet } from './BottomSheet';
import { MonthlyFlowScheduleSection } from './MonthlyFlowScheduleSection';
import { DcaBreakdownEditor, AssetDcaDraft } from './DcaBreakdownEditor';

interface MonthlyFlowSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  privacyMode: boolean;
  onSaveSettings: (params: {
    monthlySavingsTarget: number;
    monthlyFlow: MonthlyFlowConfig;
    assetDcaUpdates: { assetId: string; dcaMonthly: number; dcaEnabled: boolean }[];
  }) => void;
}

function MonthlyFlowSettingsForm({
  state,
  privacyMode,
  onSaveSettings,
  onClose,
}: Omit<MonthlyFlowSettingsModalProps, 'isOpen'>) {
  const initialFlow = getNormalizedMonthlyFlow(state);
  const [savingsInput, setSavingsInput] = useState(() =>
    String(getMonthlySavingsAmount(state))
  );
  const [fromAccId, setFromAccId] = useState(
    () => initialFlow.savingsFromAccountId || ''
  );
  const [toAccId, setToAccId] = useState(
    () => initialFlow.savingsToAccountId || ''
  );
  const [executionMode, setExecutionMode] = useState<'manual' | 'auto'>(
    () => initialFlow.executionMode
  );
  const [scheduledDay, setScheduledDay] = useState(() =>
    String(initialFlow.scheduledDay)
  );
  const [dcaAccountId, setDcaAccountId] = useState(
    () => initialFlow.dcaAccountId || ''
  );
  const [formError, setFormError] = useState('');
  const [assetDrafts, setAssetDrafts] = useState<Record<string, AssetDcaDraft>>(
    () => {
      const drafts: Record<string, AssetDcaDraft> = {};
      state.assets.forEach((a) => {
        drafts[a.id] = {
          rawDca: String(Number(a.dcaMonthly || 0)),
          enabled: a.dcaEnabled !== false,
        };
      });
      return drafts;
    }
  );

  const liveDraftDcaTotal = useMemo(() => {
    return state.assets.reduce((sum, a) => {
      const draft = assetDrafts[a.id];
      if (!draft || !draft.enabled) return sum;
      const val = parseFloat(draft.rawDca.replace(',', '.'));
      return sum + (Number.isFinite(val) && val > 0 ? val : 0);
    }, 0);
  }, [state.assets, assetDrafts]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (state.accounts.length > 1 && fromAccId && toAccId && fromAccId === toAccId) {
      setFormError('La cuenta origen y destino del traspaso deben ser distintas.');
      return;
    }
    const parsedSavings = parseFloat(savingsInput.replace(',', '.'));
    const validSavings =
      Number.isFinite(parsedSavings) && parsedSavings >= 0
        ? Number(parsedSavings.toFixed(2))
        : 1000;
    const rawDay = parseInt(scheduledDay, 10);
    const clampedDay = Math.min(28, Math.max(1, Number.isFinite(rawDay) ? rawDay : 2));
    const existingNorm = getNormalizedMonthlyFlow(state);

    onSaveSettings({
      monthlySavingsTarget: validSavings,
      monthlyFlow: {
        ...existingNorm,
        savingsFromAccountId: fromAccId || existingNorm.savingsFromAccountId,
        savingsToAccountId: toAccId || existingNorm.savingsToAccountId,
        executionMode,
        scheduledDay: clampedDay,
        dcaAccountId: dcaAccountId || existingNorm.dcaAccountId,
        lastAutoError: undefined,
      },
      assetDcaUpdates: state.assets.map((a) => {
        const draft = assetDrafts[a.id];
        const parsed = draft ? parseFloat(draft.rawDca.replace(',', '.')) : a.dcaMonthly;
        return {
          assetId: a.id,
          dcaMonthly:
            Number.isFinite(parsed) && parsed >= 0 ? Number(parsed.toFixed(2)) : 0,
          dcaEnabled: draft ? draft.enabled : true,
        };
      }),
    });
    onClose();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <section className="p-3.5 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#10B981]">
          <Wallet className="w-3.5 h-3.5" />
          <span>1. Traspaso de Ahorro Mensual</span>
        </div>

        <div>
          <label className="block text-[11px] font-medium text-zinc-400 mb-1">
            Importe de Ahorro Mensual (€)
          </label>
          <input
            type="text"
            inputMode="decimal"
            value={savingsInput}
            onChange={(e) => {
              if (/^[0-9]*[.,]?[0-9]*$/.test(e.target.value)) {
                setSavingsInput(e.target.value);
              }
            }}
            placeholder="1000.00"
            className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-lg font-bold text-white focus:border-[#10B981] focus:outline-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Cuenta Origen</label>
            <select
              value={fromAccId}
              onChange={(e) => {
                setFromAccId(e.target.value);
                setFormError('');
              }}
              className="w-full px-2.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs text-white"
            >
              {state.accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getShortAccountName(acc)} ({formatEUR(acc.balance, privacyMode)})
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">Cuenta Destino</label>
            <select
              value={toAccId}
              onChange={(e) => {
                setToAccId(e.target.value);
                setFormError('');
              }}
              className="w-full px-2.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs text-white"
            >
              {state.accounts.map((acc) => (
                <option key={acc.id} value={acc.id}>
                  {getShortAccountName(acc)} ({formatEUR(acc.balance, privacyMode)})
                </option>
              ))}
            </select>
          </div>
        </div>
        {formError && <p className="text-[11px] text-[#F43F5E]">{formError}</p>}
      </section>

      <MonthlyFlowScheduleSection
        executionMode={executionMode}
        onChangeExecutionMode={setExecutionMode}
        scheduledDay={scheduledDay}
        onChangeScheduledDay={setScheduledDay}
      />

      <DcaBreakdownEditor
        accounts={state.accounts}
        assets={state.assets}
        dcaAccountId={dcaAccountId}
        onChangeDcaAccountId={setDcaAccountId}
        assetDrafts={assetDrafts}
        onChangeDraft={(assetId, next) =>
          setAssetDrafts((prev) => ({ ...prev, [assetId]: next }))
        }
        liveTotalEur={liveDraftDcaTotal}
        privacyMode={privacyMode}
      />

      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-bold text-sm shadow-lg shadow-[#6366F1]/25"
      >
        Guardar Configuración del Flujo
      </button>
    </form>
  );
}

export function MonthlyFlowSettingsModal({
  isOpen,
  onClose,
  state,
  privacyMode,
  onSaveSettings,
}: MonthlyFlowSettingsModalProps) {
  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes del Flujo Mensual"
      subtitle="Personaliza ahorro, cuentas, automatización y desglose DCA"
    >
      {isOpen && (
        <MonthlyFlowSettingsForm
          key={state.updatedAt}
          state={state}
          privacyMode={privacyMode}
          onSaveSettings={onSaveSettings}
          onClose={onClose}
        />
      )}
    </BottomSheet>
  );
}
