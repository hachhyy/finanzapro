'use client';

import React, { useState } from 'react';
import { AlertCircle, CheckCircle2 } from 'lucide-react';
import { PostDcaSummaryItem, formatEUR } from '@/lib/types';
import { BottomSheet } from './BottomSheet';

interface PostDcaModalProps {
  errorMsg: string | null;
  dcaChargeAccountName: string;
  onCloseError: () => void;
  postDcaItems: PostDcaSummaryItem[] | null;
  onClosePostDca: () => void;
  onSavePostDcaAdjustments: (
    adjustments: { assetId: string; finalShares: number }[]
  ) => void;
}

function PostDcaAdjustForm({
  postDcaItems,
  dcaChargeAccountName,
  onClosePostDca,
  onSavePostDcaAdjustments,
}: {
  postDcaItems: PostDcaSummaryItem[];
  dcaChargeAccountName: string;
  onClosePostDca: () => void;
  onSavePostDcaAdjustments: (
    adjustments: { assetId: string; finalShares: number }[]
  ) => void;
}) {
  const [shareInputs, setShareInputs] = useState<Record<string, string>>(() => {
    const inputs: Record<string, string> = {};
    postDcaItems.forEach((s) => {
      inputs[s.assetId] = s.newTotalShares.toFixed(8);
    });
    return inputs;
  });

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        const adjustments = postDcaItems.map((item) => {
          const raw = shareInputs[item.assetId] || '';
          const parsed = parseFloat(raw.replace(',', '.'));
          return {
            assetId: item.assetId,
            finalShares: Number.isFinite(parsed)
              ? Number(parsed.toFixed(8))
              : item.newTotalShares,
          };
        });
        onSavePostDcaAdjustments(adjustments);
        onClosePostDca();
      }}
      className="space-y-3.5"
    >
      <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs text-[#10B981]">
        <CheckCircle2 className="w-4 h-4 shrink-0" />
        <span>
          DCA descontado de {dcaChargeAccountName} y sumado a tu cartera.
        </span>
      </div>

      <div className="space-y-2.5">
        {postDcaItems.map((item) => (
          <div
            key={item.assetId}
            className="p-3 rounded-xl bg-black border border-[#2C2C2E] space-y-1.5"
          >
            <div className="flex items-center justify-between text-xs gap-2">
              <span className="font-bold text-white truncate">
                {item.name} ({item.ticker})
              </span>
              <span className="text-[#10B981] font-semibold shrink-0">
                +{formatEUR(item.dcaAmountEur)} (+{item.addedShares.toFixed(6)}{' '}
                part.)
              </span>
            </div>
            <div>
              <label className="block text-[10px] text-zinc-400 mb-1">
                Participaciones Totales Tras Compra (hasta 8 decimales):
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={shareInputs[item.assetId] ?? ''}
                onChange={(e) =>
                  setShareInputs((prev) => ({
                    ...prev,
                    [item.assetId]: e.target.value,
                  }))
                }
                className="w-full px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm font-mono text-white"
              />
            </div>
          </div>
        ))}
      </div>

      <button
        type="submit"
        className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm"
      >
        Confirmar Participaciones Exactas
      </button>
    </form>
  );
}

export function PostDcaModal({
  errorMsg,
  dcaChargeAccountName,
  onCloseError,
  postDcaItems,
  onClosePostDca,
  onSavePostDcaAdjustments,
}: PostDcaModalProps) {
  return (
    <>
      <BottomSheet
        isOpen={!!errorMsg}
        onClose={onCloseError}
        title="No se pudo ejecutar el Plan DCA"
        subtitle={`Verificación de saldo en ${dcaChargeAccountName}`}
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-200 leading-relaxed">{errorMsg}</p>
          </div>
          <button
            type="button"
            onClick={onCloseError}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 text-white font-bold text-sm"
          >
            Entendido
          </button>
        </div>
      </BottomSheet>

      <BottomSheet
        isOpen={!!postDcaItems}
        onClose={onClosePostDca}
        title="Confirmación y Ajuste Post-DCA"
        subtitle="Ajusta cualquier decimal si varió ligeramente respecto al precio real ejecutado"
      >
        {postDcaItems && (
          <PostDcaAdjustForm
            key={postDcaItems.map((i) => `${i.assetId}:${i.newTotalShares}`).join('|')}
            postDcaItems={postDcaItems}
            dcaChargeAccountName={dcaChargeAccountName}
            onClosePostDca={onClosePostDca}
            onSavePostDcaAdjustments={onSavePostDcaAdjustments}
          />
        )}
      </BottomSheet>
    </>
  );
}
