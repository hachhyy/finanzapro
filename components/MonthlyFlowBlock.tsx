'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  BellRing,
  CheckCircle2,
  Settings,
  Sparkles,
} from 'lucide-react';
import {
  AppState,
  MonthlyFlowConfig,
  PostDcaSummaryItem,
  formatEUR,
} from '@/lib/types';
import {
  getActiveMonthlyDcaTotal,
  getCurrentDayOfMonth,
  getCurrentMonthKey,
  getMonthlySavingsAmount,
  getNormalizedMonthlyFlow,
  getShortAccountName,
} from '@/lib/monthlyFlow';
import { MonthlyFlowSettingsModal } from './MonthlyFlowSettingsModal';
import { PostDcaModal } from './PostDcaModal';

interface MonthlyFlowBlockProps {
  state: AppState;
  privacyMode: boolean;
  onExecuteSavingsTransfer: () => { ok: boolean; error?: string };
  onExecuteDcaPlan: () => {
    ok: boolean;
    error?: string;
    summary?: PostDcaSummaryItem[];
  };
  onSavePostDcaAdjustments: (
    adjustments: { assetId: string; finalShares: number }[]
  ) => void;
  onSaveMonthlyFlowSettings: (params: {
    monthlySavingsTarget: number;
    monthlyFlow: MonthlyFlowConfig;
    assetDcaUpdates: { assetId: string; dcaMonthly: number; dcaEnabled: boolean }[];
  }) => void;
}

export function MonthlyFlowBlock({
  state,
  privacyMode,
  onExecuteSavingsTransfer,
  onExecuteDcaPlan,
  onSavePostDcaAdjustments,
  onSaveMonthlyFlowSettings,
}: MonthlyFlowBlockProps) {
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [postDcaItems, setPostDcaItems] = useState<PostDcaSummaryItem[] | null>(null);
  const [dcaErrorMsg, setDcaErrorMsg] = useState<string | null>(null);
  const [savingsErrorMsg, setSavingsErrorMsg] = useState<string | null>(null);
  const [savingsFlash, setSavingsFlash] = useState(false);

  const flow = useMemo(() => getNormalizedMonthlyFlow(state), [state]);
  const savingsAmount = getMonthlySavingsAmount(state);
  const activeDcaTotal = useMemo(
    () => getActiveMonthlyDcaTotal(state.assets),
    [state.assets]
  );

  const currentMonth = getCurrentMonthKey();
  const currentDay = getCurrentDayOfMonth();
  const savingsDone = flow.lastSavingsMonth === currentMonth;
  const dcaDone = flow.lastDcaMonth === currentMonth;
  const bothDone = savingsDone && dcaDone;
  const dueReminder =
    flow.executionMode === 'manual' &&
    currentDay >= flow.scheduledDay &&
    !bothDone;

  const fromAcc = state.accounts.find((a) => a.id === flow.savingsFromAccountId);
  const toAcc = state.accounts.find((a) => a.id === flow.savingsToAccountId);
  const dcaAcc = state.accounts.find((a) => a.id === flow.dcaAccountId);

  const fromName = getShortAccountName(fromAcc);
  const toName = getShortAccountName(toAcc);
  const dcaAccName = getShortAccountName(dcaAcc);

  const handleRunSavings = () => {
    setSavingsErrorMsg(null);
    const res = onExecuteSavingsTransfer();
    if (!res.ok) {
      setSavingsErrorMsg(
        res.error || 'No se pudo realizar el traspaso. Revisa los Ajustes (⚙️).'
      );
      return;
    }
    setSavingsFlash(true);
    setTimeout(() => setSavingsFlash(false), 1800);
  };

  const handleTriggerDca = () => {
    const res = onExecuteDcaPlan();
    if (!res.ok) {
      setDcaErrorMsg(
        res.error || `Saldo insuficiente en ${dcaAccName} para ejecutar el Plan DCA.`
      );
      return;
    }
    if (res.summary) {
      setPostDcaItems(res.summary);
    }
  };

  const statusSubtitle = bothDone
    ? 'Completado este mes ✅'
    : dueReminder
    ? `Día ${flow.scheduledDay} alcanzado · Pendiente de activar`
    : flow.executionMode === 'auto'
    ? `Día programado: ${flow.scheduledDay} · Automático`
    : `Día programado: ${flow.scheduledDay} · Pendiente`;

  return (
    <section className="pt-2 pb-2">
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-4 space-y-3">
        {/* Cabecera Compacta */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center shrink-0">
              <Sparkles className="w-4 h-4 text-[#6366F1]" />
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white leading-tight">
                Flujo Mensual (Ahorro y DCA)
              </h3>
              <p
                className={`text-[11px] font-medium mt-0.5 truncate ${
                  bothDone
                    ? 'text-[#10B981]'
                    : dueReminder
                    ? 'text-amber-400'
                    : 'text-zinc-400'
                }`}
              >
                {statusSubtitle}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSettingsOpen(true)}
            title="Ajustes del Flujo Mensual"
            aria-label="Ajustes del Flujo Mensual"
            className="p-2 rounded-xl bg-black/60 border border-[#2C2C2E] text-zinc-300 hover:text-white hover:border-[#6366F1]/50 active:scale-95 transition shrink-0"
          >
            <Settings className="w-4 h-4" />
          </button>
        </div>

        {/* Aviso visual cuando llega el día en modo manual o si hubo error */}
        {dueReminder && (
          <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center gap-2 text-[11px] text-amber-300">
            <BellRing className="w-3.5 h-3.5 shrink-0" />
            <span>
              Ya es día {currentDay}: tu flujo mensual programado para el día{' '}
              {flow.scheduledDay} está listo.
            </span>
          </div>
        )}

        {(flow.lastAutoError || savingsErrorMsg) && (
          <div className="px-3 py-2 rounded-xl bg-[#F43F5E]/10 border border-[#F43F5E]/30 text-[11px] text-[#F43F5E]">
            {savingsErrorMsg || flow.lastAutoError}
          </div>
        )}

        {/* Acción 1: Traspaso de Ahorro (1 clic) */}
        <div className="p-3 rounded-xl bg-black/50 border border-[#2C2C2E] space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-zinc-200 truncate">
                {fromName} → {toName}
              </span>
              {(savingsDone || savingsFlash) && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              )}
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-zinc-900 border border-[#2C2C2E] text-xs font-bold text-[#10B981] shrink-0">
              {formatEUR(savingsAmount, privacyMode)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleRunSavings}
            className="w-full py-2.5 px-3 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-[0.98] transition"
          >
            <span>
              Traspasar Ahorro ({formatEUR(savingsAmount, privacyMode)})
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#10B981]" />
          </button>
        </div>

        {/* Acción 2: Plan DCA (1 clic) */}
        <div className="p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-1.5 min-w-0">
              <span className="text-xs font-semibold text-zinc-100 truncate">
                Suma en tiempo real a tu cartera
              </span>
              {dcaDone && (
                <CheckCircle2 className="w-3.5 h-3.5 text-[#10B981] shrink-0" />
              )}
            </div>
            <span className="px-2 py-0.5 rounded-lg bg-[#6366F1]/20 text-xs font-bold text-[#6366F1] shrink-0">
              {formatEUR(activeDcaTotal, privacyMode)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleTriggerDca}
            className="w-full py-2.5 px-3 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-[0.98] transition shadow-lg shadow-[#6366F1]/25"
          >
            <span>
              Ejecutar Plan DCA ({formatEUR(activeDcaTotal, privacyMode)})
            </span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <MonthlyFlowSettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        state={state}
        privacyMode={privacyMode}
        onSaveSettings={onSaveMonthlyFlowSettings}
      />

      <PostDcaModal
        errorMsg={dcaErrorMsg}
        dcaChargeAccountName={dcaAccName}
        onCloseError={() => setDcaErrorMsg(null)}
        postDcaItems={postDcaItems}
        onClosePostDca={() => setPostDcaItems(null)}
        onSavePostDcaAdjustments={onSavePostDcaAdjustments}
      />
    </section>
  );
}
