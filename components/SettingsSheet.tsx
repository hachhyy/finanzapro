'use client';

import React, { useState, useEffect, useRef } from 'react';
import {
  Cloud,
  Download,
  Upload,
  Sparkles,
  RotateCcw,
  Check,
  Database,
} from 'lucide-react';
import { AppState } from '@/lib/types';
import { getSupabaseConfig, saveSupabaseConfig } from '@/lib/supabase';
import { BottomSheet } from './BottomSheet';

interface SettingsSheetProps {
  isOpen: boolean;
  onClose: () => void;
  state: AppState;
  cloudConnected: boolean;
  onLoadDemoTemplate: () => void;
  onResetAllToZero: () => void;
  onImportState: (imported: AppState) => void;
  onReconnectSupabase: () => void;
}

export function SettingsSheet({
  isOpen,
  onClose,
  state,
  cloudConnected,
  onLoadDemoTemplate,
  onResetAllToZero,
  onImportState,
  onReconnectSupabase,
}: SettingsSheetProps) {
  const [supabaseUrl, setSupabaseUrl] = useState('');
  const [supabaseKey, setSupabaseKey] = useState('');
  const [savedNotice, setSavedNotice] = useState('');
  const [confirmZero, setConfirmZero] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    if (isOpen) {
      const cfg = getSupabaseConfig();
      setSupabaseUrl(cfg.url);
      setSupabaseKey(cfg.anonKey);
      setConfirmZero(false);
      setConfirmDemo(false);
      setSavedNotice('');
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSaveCloudConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveSupabaseConfig({ url: supabaseUrl, anonKey: supabaseKey });
    onReconnectSupabase();
    setSavedNotice('Configuración guardada y sincronización actualizada.');
  };

  const handleExportJson = () => {
    const blob = new Blob([JSON.stringify(state, null, 2)], {
      type: 'application/json',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `finanzapro_backup_${
      new Date().toISOString().split('T')[0]
    }.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleImportJson = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const parsed = JSON.parse(String(event.target?.result)) as AppState;
        if (parsed && Array.isArray(parsed.accounts)) {
          onImportState(parsed);
          setSavedNotice('Respaldo JSON importado correctamente.');
        }
      } catch {
        setSavedNotice('El archivo JSON no tiene un formato válido.');
      }
    };
    reader.readAsText(file);
  };

  return (
    <BottomSheet
      isOpen={isOpen}
      onClose={onClose}
      title="Ajustes y Estado Maestro"
      subtitle="Plantilla de demostración, vaciado a cero, respaldo JSON y nube Supabase"
    >
      <div className="space-y-5">
        {/* 1. Botones de Estado Rápido (Plantilla Demo y Vaciar a Cero) */}
        <div className="p-4 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3">
          <div className="text-xs font-bold uppercase tracking-wider text-zinc-400">
            Estado Rápido de Datos
          </div>

          {/* Botón b) Cargar plantilla de demostración */}
          {!confirmDemo ? (
            <button
              type="button"
              onClick={() => setConfirmDemo(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#6366F1] hover:bg-[#5558E6] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-lg shadow-[#6366F1]/25 transition active:scale-98"
            >
              <Sparkles className="w-4 h-4" />
              <span>Cargar plantilla de demostración</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/40 space-y-2">
              <p className="text-xs text-zinc-200 text-center">
                Se cargarán tus datos de demostración (Imagin 334 €, Trade
                Republic 1.250 € + 0,09 €, Bitcoin 368,85 €, Nóminas, Pegajosa
                Halloween y Deudas).
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmDemo(false)}
                  className="py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onLoadDemoTemplate();
                    setConfirmDemo(false);
                    onClose();
                  }}
                  className="py-2 rounded-xl bg-[#6366F1] text-xs text-white font-bold"
                >
                  Confirmar Carga Demo
                </button>
              </div>
            </div>
          )}

          {/* Botón a) Vaciar todo a cero */}
          {!confirmZero ? (
            <button
              type="button"
              onClick={() => setConfirmZero(true)}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-[#F43F5E] font-bold text-xs flex items-center justify-center gap-2 transition active:scale-98"
            >
              <RotateCcw className="w-4 h-4" />
              <span>Vaciar todo a cero</span>
            </button>
          ) : (
            <div className="p-3 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/40 space-y-2">
              <p className="text-xs text-zinc-200 text-center">
                Resetea cuentas, pendientes, deudas y participaciones a 0,00 €
                manteniendo las 4 cuentas y los 8 activos del DCA.
              </p>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setConfirmZero(false)}
                  className="py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={() => {
                    onResetAllToZero();
                    setConfirmZero(false);
                    onClose();
                  }}
                  className="py-2 rounded-xl bg-[#F43F5E] text-xs text-white font-bold"
                >
                  Sí, Vaciar a 0,00 €
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 2. Respaldo Local en Archivo .JSON */}
        <div className="p-4 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
            <Database className="w-3.5 h-3.5 text-[#10B981]" />
            <span>Respaldo en Archivo (.JSON)</span>
          </div>

          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={handleExportJson}
              className="py-3 px-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:border-zinc-600"
            >
              <Download className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Exportar .JSON</span>
            </button>

            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="py-3 px-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs font-semibold text-white flex items-center justify-center gap-1.5 hover:border-zinc-600"
            >
              <Upload className="w-3.5 h-3.5 text-[#6366F1]" />
              <span>Importar .JSON</span>
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept=".json,application/json"
              onChange={handleImportJson}
              className="hidden"
            />
          </div>
        </div>

        {/* 3. Configuración Cloud Sync (Supabase) */}
        <form
          onSubmit={handleSaveCloudConfig}
          className="p-4 rounded-2xl bg-black/60 border border-[#2C2C2E] space-y-3"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-zinc-400">
              <Cloud className="w-3.5 h-3.5 text-[#10B981]" />
              <span>Sincronización Cloud (Supabase)</span>
            </div>
            <span
              className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                cloudConnected
                  ? 'bg-[#10B981]/20 text-[#10B981]'
                  : 'bg-zinc-800 text-zinc-400'
              }`}
            >
              {cloudConnected ? 'Conectado' : 'Modo Local'}
            </span>
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              NEXT_PUBLIC_SUPABASE_URL
            </label>
            <input
              type="url"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              placeholder="https://xxxx.supabase.co"
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-[11px] text-zinc-400 mb-1">
              NEXT_PUBLIC_SUPABASE_ANON_KEY
            </label>
            <input
              type="password"
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6..."
              className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs text-white"
            />
          </div>

          {savedNotice && (
            <p className="text-xs text-[#10B981] font-medium">{savedNotice}</p>
          )}

          <button
            type="submit"
            className="w-full py-3 rounded-xl bg-[#10B981] text-black font-bold text-xs flex items-center justify-center gap-1.5"
          >
            <Check className="w-4 h-4" />
            <span>Guardar y Sincronizar con Supabase</span>
          </button>
        </form>
      </div>
    </BottomSheet>
  );
}
