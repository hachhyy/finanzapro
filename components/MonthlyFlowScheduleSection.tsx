'use client';

import React from 'react';
import { CalendarClock } from 'lucide-react';

interface MonthlyFlowScheduleSectionProps {
  executionMode: 'manual' | 'auto';
  onChangeExecutionMode: (mode: 'manual' | 'auto') => void;
  scheduledDay: string;
  onChangeScheduledDay: (val: string) => void;
}

export function MonthlyFlowScheduleSection({
  executionMode,
  onChangeExecutionMode,
  scheduledDay,
  onChangeScheduledDay,
}: MonthlyFlowScheduleSectionProps) {
  return (
    <section className="p-3.5 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3">
      <div className="flex items-center gap-1.5 text-xs font-bold uppercase tracking-wider text-[#6366F1]">
        <CalendarClock className="w-3.5 h-3.5" />
        <span>2. Automatización y Calendario</span>
      </div>

      <div className="grid grid-cols-1 gap-2">
        <button
          type="button"
          onClick={() => onChangeExecutionMode('manual')}
          className={`p-3 rounded-xl border text-left transition ${
            executionMode === 'manual'
              ? 'bg-[#6366F1]/15 border-[#6366F1] text-white'
              : 'bg-[#1C1C1E] border-[#2C2C2E] text-zinc-400'
          }`}
        >
          <div className="text-xs font-bold">
            Manual (Activar con 1 clic y revisar precios)
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">
            Muestra un aviso visual cuando llegue el día programado
          </div>
        </button>

        <button
          type="button"
          onClick={() => onChangeExecutionMode('auto')}
          className={`p-3 rounded-xl border text-left transition ${
            executionMode === 'auto'
              ? 'bg-[#10B981]/15 border-[#10B981] text-white'
              : 'bg-[#1C1C1E] border-[#2C2C2E] text-zinc-400'
          }`}
        >
          <div className="text-xs font-bold">
            Automático (Ejecutar el día fijado con precios de mercado en vivo)
          </div>
          <div className="text-[10px] opacity-80 mt-0.5">
            Traspasa ahorro y compra DCA al abrir POCKET desde el día fijado
          </div>
        </button>
      </div>

      <div>
        <label className="block text-[11px] font-medium text-zinc-400 mb-1">
          Día del mes (1 al 28)
        </label>
        <input
          type="number"
          min={1}
          max={28}
          value={scheduledDay}
          onChange={(e) => onChangeScheduledDay(e.target.value)}
          className="w-28 px-3.5 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm font-bold text-white text-center"
        />
      </div>
    </section>
  );
}
