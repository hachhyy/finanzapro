'use client';

import React from 'react';
import {
  Cloud,
  CloudOff,
  Undo2,
  Eye,
  EyeOff,
  Settings,
  Wallet,
  Sparkles,
} from 'lucide-react';
import { formatEUR } from '@/lib/types';

interface HeaderScoreboardProps {
  cloudConnected: boolean;
  canUndo: boolean;
  onUndo: () => void;
  privacyMode: boolean;
  onTogglePrivacy: () => void;
  onOpenSettings: () => void;
  liquidezTotal: number;
  inversionesTotal: number;
  porCobrarTotal: number;
  deudasTotal: number;
}

export function HeaderScoreboard({
  cloudConnected,
  canUndo,
  onUndo,
  privacyMode,
  onTogglePrivacy,
  onOpenSettings,
  liquidezTotal,
  inversionesTotal,
  porCobrarTotal,
  deudasTotal,
}: HeaderScoreboardProps) {
  const dineroRealHoy = liquidezTotal + inversionesTotal;
  const dineroFinalEsperado = dineroRealHoy + porCobrarTotal - deudasTotal;

  const totalRealPositive = Math.max(0.01, liquidezTotal + inversionesTotal);
  const liquidezPct =
    dineroRealHoy > 0
      ? Math.min(100, Math.max(0, (liquidezTotal / totalRealPositive) * 100))
      : 50;
  const inversionesPct = 100 - liquidezPct;

  return (
    <header className="sticky top-0 z-50 pointer-events-auto bg-black/95 backdrop-blur-xl border-b border-[#2C2C2E] pt-3 pb-3 px-4">
      <div className="max-w-lg mx-auto space-y-3">
        {/* 1. Barra de Utilidades Superior */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-[#10B981]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold tracking-tight text-white">
                  FinanzaPro
                </h1>
                <span
                  title={
                    cloudConnected
                      ? 'Conectado a Supabase'
                      : 'Modo Local (Offline-First)'
                  }
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium border ${
                    cloudConnected
                      ? 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                      : 'bg-zinc-800/80 text-zinc-400 border-[#2C2C2E]'
                  }`}
                >
                  {cloudConnected ? (
                    <>
                      <Cloud className="w-3 h-3 text-[#10B981]" />
                      <span>Nube</span>
                    </>
                  ) : (
                    <>
                      <CloudOff className="w-3 h-3 text-zinc-400" />
                      <span>Local</span>
                    </>
                  )}
                </span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={onUndo}
              disabled={!canUndo}
              title="Deshacer última acción"
              className={`flex items-center gap-1 px-2.5 py-2 rounded-xl border text-xs font-medium transition ${
                canUndo
                  ? 'bg-[#1C1C1E] border-[#2C2C2E] text-white hover:bg-zinc-800 active:scale-95'
                  : 'bg-[#1C1C1E]/40 border-[#2C2C2E]/40 text-zinc-600 cursor-not-allowed'
              }`}
            >
              <Undo2 className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Deshacer</span>
            </button>

            <button
              type="button"
              onClick={onTogglePrivacy}
              title="Modo Privacidad"
              className="p-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-zinc-300 hover:text-white active:scale-95 transition"
            >
              {privacyMode ? (
                <EyeOff className="w-4 h-4 text-[#6366F1]" />
              ) : (
                <Eye className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onOpenSettings}
              title="Ajustes"
              className="p-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-zinc-300 hover:text-white active:scale-95 transition"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Doble Marcador Contable sin Duplicidades */}
        <div className="grid grid-cols-2 gap-2.5">
          {/* Tarjeta Izquierda: DINERO REAL HOY */}
          <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span>DINERO REAL HOY</span>
                <Wallet className="w-3 h-3 text-[#10B981]" />
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1 tracking-tight truncate">
                {formatEUR(dineroRealHoy, privacyMode)}
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              {/* Barra de progreso bicolor */}
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  style={{ width: `${liquidezPct}%` }}
                  className="h-full bg-[#10B981] transition-all duration-300"
                />
                <div
                  style={{ width: `${inversionesPct}%` }}
                  className="h-full bg-[#6366F1] transition-all duration-300"
                />
              </div>

              <div className="flex flex-col gap-0.5 text-[10px] leading-tight text-zinc-400">
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#10B981]" />
                    Liquidez:
                  </span>
                  <span className="font-semibold text-zinc-200">
                    {formatEUR(liquidezTotal, privacyMode)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-[#6366F1]" />
                    Inversiones:
                  </span>
                  <span className="font-semibold text-zinc-200">
                    {formatEUR(inversionesTotal, privacyMode)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Tarjeta Derecha: DINERO FINAL ESPERADO */}
          <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-3 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between text-[10px] font-semibold uppercase tracking-wider text-zinc-400">
                <span>DINERO FINAL ESPERADO</span>
              </div>
              <div className="text-lg sm:text-xl font-bold text-white mt-1 tracking-tight truncate">
                {formatEUR(dineroFinalEsperado, privacyMode)}
              </div>
            </div>

            <div className="mt-2.5 space-y-1.5">
              <div className="w-full h-1.5 rounded-full bg-zinc-800 overflow-hidden flex">
                <div
                  style={{
                    width: `${
                      porCobrarTotal + deudasTotal > 0
                        ? (porCobrarTotal / (porCobrarTotal + deudasTotal)) *
                          100
                        : 50
                    }%`,
                  }}
                  className="h-full bg-[#10B981]"
                />
                <div
                  style={{
                    width: `${
                      porCobrarTotal + deudasTotal > 0
                        ? (deudasTotal / (porCobrarTotal + deudasTotal)) * 100
                        : 50
                    }%`,
                  }}
                  className="h-full bg-[#F43F5E]"
                />
              </div>

              <div className="flex flex-col gap-0.5 text-[10px] leading-tight text-zinc-400">
                <div className="flex items-center justify-between">
                  <span>Por cobrar:</span>
                  <span className="font-semibold text-[#10B981]">
                    {privacyMode
                      ? '•••• €'
                      : `+${formatEUR(porCobrarTotal, false)}`}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span>Deudas:</span>
                  <span className="font-semibold text-[#F43F5E]">
                    {privacyMode
                      ? '•••• €'
                      : `-${formatEUR(deudasTotal, false)}`}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </header>
  );
}
