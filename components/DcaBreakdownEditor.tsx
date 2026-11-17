'use client';

import React from 'react';
import { Check, Landmark, Sparkles } from 'lucide-react';
import { BankAccount, InvestmentAsset, formatEUR } from '@/lib/types';
import { getShortAccountName } from '@/lib/monthlyFlow';

export interface AssetDcaDraft {
  rawDca: string;
  enabled: boolean;
}

interface DcaBreakdownEditorProps {
  accounts: BankAccount[];
  assets: InvestmentAsset[];
  dcaAccountId: string;
  onChangeDcaAccountId: (id: string) => void;
  assetDrafts: Record<string, AssetDcaDraft>;
  onChangeDraft: (assetId: string, next: AssetDcaDraft) => void;
  liveTotalEur: number;
  privacyMode: boolean;
}

export function DcaBreakdownEditor({
  accounts,
  assets,
  dcaAccountId,
  onChangeDcaAccountId,
  assetDrafts,
  onChangeDraft,
  liveTotalEur,
  privacyMode,
}: DcaBreakdownEditorProps) {
  const trAndImagin = accounts.filter(
    (a) =>
      a.isTradeRepublic ||
      a.name.toLowerCase().includes('trade republic') ||
      a.name.toLowerCase().includes('imagin')
  );
  const rawChoices = trAndImagin.length >= 2 ? trAndImagin : accounts;
  const chargeChoices = [...rawChoices].sort((a, b) => {
    const aIsTr =
      a.isTradeRepublic || a.name.toLowerCase().includes('trade republic');
    const bIsTr =
      b.isTradeRepublic || b.name.toLowerCase().includes('trade republic');
    return Number(bIsTr) - Number(aIsTr);
  });

  return (
    <section className="p-3.5 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-white">
          <Sparkles className="w-3.5 h-3.5 text-[#6366F1]" />
          <span>3. Plan DCA Mensual</span>
        </div>
        <span className="px-2.5 py-1 rounded-lg bg-[#6366F1]/20 text-xs font-bold text-[#6366F1]">
          Total: {formatEUR(liveTotalEur, privacyMode)}
        </span>
      </div>

      <div>
        <label className="block text-[11px] text-zinc-400 mb-1.5">
          Cuenta de cargo del DCA (Trade Republic o Imagin)
        </label>
        <div className="grid grid-cols-2 gap-2">
          {chargeChoices.map((acc) => {
            const active = dcaAccountId === acc.id;
            return (
              <button
                key={acc.id}
                type="button"
                onClick={() => onChangeDcaAccountId(acc.id)}
                className={`p-2.5 rounded-xl border text-left transition ${
                  active
                    ? 'bg-[#6366F1]/15 border-[#6366F1] text-white'
                    : 'bg-[#1C1C1E] border-[#2C2C2E] text-zinc-400'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold truncate">
                  <Landmark className="w-3 h-3 shrink-0" />
                  <span className="truncate">{getShortAccountName(acc)}</span>
                </div>
                <div className="text-[10px] opacity-80 mt-0.5 font-mono">
                  {formatEUR(acc.balance, privacyMode)}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      <div className="space-y-2">
        {assets.map((asset) => {
          const draft = assetDrafts[asset.id] || {
            rawDca: String(asset.dcaMonthly || 0),
            enabled: asset.dcaEnabled !== false,
          };
          return (
            <div
              key={asset.id}
              className={`flex items-center justify-between gap-2 p-2.5 rounded-xl border transition ${
                draft.enabled
                  ? 'bg-[#1C1C1E] border-[#2C2C2E]'
                  : 'bg-[#1C1C1E]/40 border-[#2C2C2E]/50 opacity-60'
              }`}
            >
              <button
                type="button"
                onClick={() =>
                  onChangeDraft(asset.id, { ...draft, enabled: !draft.enabled })
                }
                className="flex items-center gap-2.5 min-w-0 flex-1 text-left"
              >
                <span
                  className={`w-5 h-5 rounded-md flex items-center justify-center border shrink-0 transition ${
                    draft.enabled
                      ? 'bg-[#10B981] border-[#10B981] text-black'
                      : 'bg-black border-zinc-600 text-transparent'
                  }`}
                >
                  <Check className="w-3.5 h-3.5 stroke-[3]" />
                </span>
                <div className="min-w-0">
                  <div className="text-xs font-semibold text-white truncate">
                    {asset.name}
                  </div>
                  <div className="text-[10px] font-mono text-zinc-400">
                    {asset.isin || asset.ticker}
                  </div>
                </div>
              </button>

              <div className="flex items-center gap-1 shrink-0">
                <input
                  type="text"
                  inputMode="decimal"
                  disabled={!draft.enabled}
                  value={draft.rawDca}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(v)) {
                      onChangeDraft(asset.id, { ...draft, rawDca: v });
                    }
                  }}
                  className="w-20 px-2.5 py-1.5 rounded-lg bg-black border border-[#2C2C2E] text-xs font-bold text-white text-right disabled:opacity-50"
                />
                <span className="text-xs text-zinc-400 font-semibold">€</span>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
