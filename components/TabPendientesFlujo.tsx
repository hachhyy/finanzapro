'use client';

import React, { useState, useMemo } from 'react';
import {
  ArrowRight,
  Sparkles,
  Plus,
  Folder,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  History,
  CheckCircle2,
  AlertCircle,
  Edit3,
} from 'lucide-react';
import {
  AppState,
  PendingItem,
  SubItem,
  formatEUR,
  getPendingEffectiveAmount,
} from '@/lib/types';
import { BottomSheet } from './BottomSheet';

export interface PostDcaSummaryItem {
  assetId: string;
  name: string;
  ticker: string;
  dcaAmountEur: number;
  priceEur: number;
  addedShares: number;
  newTotalShares: number;
}

interface TabPendientesFlujoProps {
  state: AppState;
  privacyMode: boolean;
  onUpdateMonthlySavingsTarget: (amount: number) => void;
  onExecuteSavingsTransfer: () => void;
  onExecuteDcaPlan: () => {
    ok: boolean;
    error?: string;
    summary?: PostDcaSummaryItem[];
  };
  onSavePostDcaAdjustments: (
    adjustments: { assetId: string; finalShares: number }[]
  ) => void;
  onUpsertPendingItem: (item: PendingItem) => void;
  onDeletePendingItem: (id: string) => void;
  onSettlePending: (params: {
    itemId: string;
    subItemId?: string;
    accountId: string;
    amountToSettle: number;
  }) => void;
  onRevertHistoryRecord: (recordId: string) => void;
}

export function TabPendientesFlujo({
  state,
  privacyMode,
  onUpdateMonthlySavingsTarget,
  onExecuteSavingsTransfer,
  onExecuteDcaPlan,
  onSavePostDcaAdjustments,
  onUpsertPendingItem,
  onDeletePendingItem,
  onSettlePending,
  onRevertHistoryRecord,
}: TabPendientesFlujoProps) {
  // 1. Flujo Mensual Manual states
  const [isEditingSavingsTarget, setIsEditingSavingsTarget] = useState(false);
  const [savingsInput, setSavingsInput] = useState('');

  // Post-DCA adjustment Bottom Sheet
  const [postDcaItems, setPostDcaItems] = useState<PostDcaSummaryItem[] | null>(
    null
  );
  const [postDcaShareInputs, setPostDcaShareInputs] = useState<
    Record<string, string>
  >({});
  const [dcaErrorMsg, setDcaErrorMsg] = useState<string | null>(null);

  // 2. Folder collapse states
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'Pegajosa Halloween': true,
  });

  // 3. Create / Edit Pending Item Sheet
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemFolder, setItemFolder] = useState('');
  const [itemMode, setItemMode] = useState<'single' | 'subitems'>('single');
  const [itemAmount, setItemAmount] = useState('');
  const [itemSubItems, setItemSubItems] = useState<SubItem[]>([]);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(false);

  // 4. Cobrar / Pagar (Liquidación Total o Parcial) Sheet
  const [settlingTarget, setSettlingTarget] = useState<{
    item: PendingItem;
    subItem?: SubItem;
    maxAmount: number;
  } | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [settleAmountInput, setSettleAmountInput] = useState('');

  // 5. Collapsible History Panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

  const totalMonthlyDca = useMemo(
    () =>
      state.assets.reduce((sum, a) => sum + Number(a.dcaMonthly || 0), 0),
    [state.assets]
  );

  const incomes = useMemo(
    () => state.pendingItems.filter((i) => i.type === 'income'),
    [state.pendingItems]
  );
  const debts = useMemo(
    () => state.pendingItems.filter((i) => i.type === 'debt'),
    [state.pendingItems]
  );

  // Group incomes by folder vs standalone
  const { folderGroups, standaloneIncomes } = useMemo(() => {
    const groups: Record<string, PendingItem[]> = {};
    const standalone: PendingItem[] = [];

    for (const inc of incomes) {
      const folderName = (inc.folder || '').trim();
      if (folderName) {
        if (!groups[folderName]) groups[folderName] = [];
        groups[folderName].push(inc);
      } else {
        standalone.push(inc);
      }
    }
    return { folderGroups: groups, standaloneIncomes: standalone };
  }, [incomes]);

  const openNewPendingModal = (type: 'income' | 'debt', presetFolder = '') => {
    const blank: PendingItem = {
      id: `${type}_${Date.now()}`,
      type,
      name: '',
      folder: presetFolder,
      amount: 0,
      mode: 'single',
      subItems: [],
    };
    setEditingItem(blank);
    setItemName('');
    setItemFolder(presetFolder);
    setItemMode('single');
    setItemAmount('');
    setItemSubItems([]);
    setConfirmDeleteItem(false);
  };

  const openEditPendingModal = (item: PendingItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setItemFolder(item.folder || '');
    setItemMode(item.mode);
    setItemAmount(String(item.amount));
    setItemSubItems(item.subItems.map((s) => ({ ...s })));
    setConfirmDeleteItem(false);
  };

  const handleSavePendingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !itemName.trim()) return;

    const cleanSubItems = itemSubItems
      .filter((s) => s.name.trim() !== '' || s.amount > 0)
      .map((s, idx) => ({
        ...s,
        name: s.name.trim() || `Cuota ${idx + 1}`,
        amount: Number.isFinite(Number(s.amount)) ? Number(s.amount) : 0,
      }));

    const computedSubSum = cleanSubItems
      .filter((s) => !s.completed)
      .reduce((acc, s) => acc + s.amount, 0);

    const parsedSingle = parseFloat(itemAmount.replace(',', '.'));
    const finalAmount =
      itemMode === 'subitems'
        ? computedSubSum
        : Number.isFinite(parsedSingle)
        ? parsedSingle
        : 0;

    onUpsertPendingItem({
      ...editingItem,
      name: itemName.trim(),
      folder: itemFolder.trim() || undefined,
      mode: itemMode,
      amount: finalAmount,
      subItems: itemMode === 'subitems' ? cleanSubItems : [],
    });

    setEditingItem(null);
  };

  const openSettleModal = (item: PendingItem, subItem?: SubItem) => {
    const maxAmt = subItem
      ? Number(subItem.amount || 0)
      : getPendingEffectiveAmount(item);
    const defaultAcc =
      state.accounts.find((a) => !a.isTradeRepublic)?.id ||
      state.accounts[0]?.id ||
      '';
    setSettlingTarget({ item, subItem, maxAmount: maxAmt });
    setSelectedAccountId(defaultAcc);
    setSettleAmountInput(String(maxAmt.toFixed(2)));
  };

  const handleConfirmSettle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!settlingTarget || !selectedAccountId) return;
    const amt = parseFloat(settleAmountInput.replace(',', '.'));
    if (!Number.isFinite(amt) || amt <= 0) return;

    onSettlePending({
      itemId: settlingTarget.item.id,
      subItemId: settlingTarget.subItem?.id,
      accountId: selectedAccountId,
      amountToSettle: amt,
    });
    setSettlingTarget(null);
  };

  const handleTriggerDca = () => {
    const res = onExecuteDcaPlan();
    if (!res.ok) {
      setDcaErrorMsg(
        res.error ||
          'Saldo insuficiente en Trade Republic (Efectivo remunerado).'
      );
      return;
    }
    if (res.summary) {
      const inputs: Record<string, string> = {};
      res.summary.forEach((s) => {
        inputs[s.assetId] = s.newTotalShares.toFixed(8);
      });
      setPostDcaShareInputs(inputs);
      setPostDcaItems(res.summary);
    }
  };

  const renderPendingRow = (item: PendingItem) => {
    const isIncome = item.type === 'income';
    const effectiveAmt = getPendingEffectiveAmount(item);
    const hasSubItems = item.mode === 'subitems' && item.subItems.length > 0;

    return (
      <div
        key={item.id}
        className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-3.5 space-y-2.5"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => openEditPendingModal(item)}
            className="text-left flex-1 min-w-0 group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white group-hover:text-[#6366F1] transition truncate">
                {item.name}
              </span>
              <Edit3 className="w-3 h-3 text-zinc-500 shrink-0" />
            </div>
            <div className="text-[11px] text-zinc-500">
              {hasSubItems
                ? `${
                    item.subItems.filter((s) => !s.completed).length
                  } sub-pagos pendientes`
                : 'Importe único • Toca para editar'}
            </div>
          </button>

          <div className="flex items-center gap-2 shrink-0">
            <span
              className={`text-sm font-bold ${
                isIncome ? 'text-[#10B981]' : 'text-[#F43F5E]'
              }`}
            >
              {isIncome ? '+' : '-'}
              {formatEUR(effectiveAmt, privacyMode)}
            </span>

            {!hasSubItems && effectiveAmt > 0 && (
              <button
                type="button"
                onClick={() => openSettleModal(item)}
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-95 ${
                  isIncome
                    ? 'bg-[#10B981]/15 text-[#10B981] border border-[#10B981]/30 hover:bg-[#10B981]/25'
                    : 'bg-[#F43F5E]/15 text-[#F43F5E] border border-[#F43F5E]/30 hover:bg-[#F43F5E]/25'
                }`}
              >
                {isIncome ? 'Cobrar' : 'Pagar'}
              </button>
            )}
          </div>
        </div>

        {/* Sub-pagos / Cuotas individuales */}
        {hasSubItems && (
          <div className="pt-2 border-t border-[#2C2C2E]/80 space-y-1.5">
            {item.subItems.map((sub) => {
              if (sub.completed || sub.amount <= 0) return null;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 pl-2 py-1.5 px-2.5 rounded-xl bg-black/40 border border-[#2C2C2E]/60"
                >
                  <button
                    type="button"
                    onClick={() => openEditPendingModal(item)}
                    className="text-xs text-zinc-300 text-left truncate flex-1"
                  >
                    • {sub.name}
                  </button>
                  <div className="flex items-center gap-2 shrink-0">
                    <span
                      className={`text-xs font-semibold ${
                        isIncome ? 'text-[#10B981]' : 'text-[#F43F5E]'
                      }`}
                    >
                      {formatEUR(sub.amount, privacyMode)}
                    </span>
                    <button
                      type="button"
                      onClick={() => openSettleModal(item, sub)}
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition active:scale-95 ${
                        isIncome
                          ? 'bg-[#10B981] text-black'
                          : 'bg-[#F43F5E] text-white'
                      }`}
                    >
                      {isIncome ? 'Cobrar' : 'Pagar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      {/* 1. Tarjeta de Flujo Mensual Manual (Sueldo ➔ Ahorro ➔ DCA) */}
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-4 space-y-3.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-[#6366F1]" />
            <h2 className="text-sm font-bold text-white">
              Flujo Mensual Manual (Sueldo ➔ Ahorro ➔ DCA)
            </h2>
          </div>
        </div>

        {/* Acción 1: Traspasar Ahorro Mensual (Imagin ➔ Trade Republic) */}
        <div className="p-3 rounded-xl bg-black/50 border border-[#2C2C2E] space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-zinc-200">
                1. Traspasar Ahorro Mensual (Imagin ➔ Trade Republic)
              </div>
              <div className="text-[11px] text-zinc-500">
                Toca el importe para editar tu objetivo de ahorro mensual
              </div>
            </div>
            <button
              type="button"
              onClick={() => {
                setSavingsInput(String(state.monthlySavingsTarget));
                setIsEditingSavingsTarget(true);
              }}
              className="px-2.5 py-1 rounded-lg bg-zinc-800 border border-[#2C2C2E] text-xs font-bold text-[#10B981] hover:border-[#10B981]/50"
            >
              {formatEUR(state.monthlySavingsTarget, privacyMode)}
            </button>
          </div>

          <button
            type="button"
            onClick={onExecuteSavingsTransfer}
            className="w-full py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-semibold flex items-center justify-center gap-1.5 active:scale-98 transition"
          >
            <span>
              Traspasar Ahorro Mensual (
              {formatEUR(state.monthlySavingsTarget, privacyMode)})
            </span>
            <ArrowRight className="w-3.5 h-3.5 text-[#10B981]" />
          </button>
        </div>

        {/* Acción 2: Ejecutar Plan DCA Mensual */}
        <div className="p-3 rounded-xl bg-[#6366F1]/10 border border-[#6366F1]/30 space-y-2.5">
          <div className="flex items-center justify-between gap-2">
            <div>
              <div className="text-xs font-semibold text-white">
                2. Ejecutar Plan DCA Mensual
              </div>
              <div className="text-[11px] text-zinc-400">
                Suma automática en tiempo real de tus activos con DCA
              </div>
            </div>
            <span className="px-2.5 py-1 rounded-lg bg-[#6366F1]/20 text-xs font-bold text-[#6366F1]">
              {formatEUR(totalMonthlyDca, privacyMode)}
            </span>
          </div>

          <button
            type="button"
            onClick={handleTriggerDca}
            className="w-full py-2.5 rounded-xl bg-[#6366F1] hover:bg-[#5558E6] text-white text-xs font-bold flex items-center justify-center gap-1.5 active:scale-98 transition shadow-lg shadow-[#6366F1]/20"
          >
            <span>
              Ejecutar Plan DCA Mensual (
              {formatEUR(totalMonthlyDca, privacyMode)})
            </span>
            <Sparkles className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. INGRESOS POR COBRAR + CARPETAS DE EVENTOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#10B981]">
              Ingresos por Cobrar
            </h2>
            <p className="text-[11px] text-zinc-500">
              Cobros únicos, sub-pagos y carpetas de eventos desplegables
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewPendingModal('income')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-semibold text-[#10B981] active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Ingreso Pendiente</span>
          </button>
        </div>

        {/* Carpetas de Eventos Desplegables */}
        {Object.entries(folderGroups).map(([folderName, items]) => {
          const folderTotal = items.reduce(
            (sum, i) => sum + getPendingEffectiveAmount(i),
            0
          );
          const isOpen = openFolders[folderName] ?? true;

          return (
            <div
              key={folderName}
              className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] overflow-hidden"
            >
              <div
                onClick={() =>
                  setOpenFolders((prev) => ({
                    ...prev,
                    [folderName]: !isOpen,
                  }))
                }
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    setOpenFolders((prev) => ({
                      ...prev,
                      [folderName]: !isOpen,
                    }));
                  }
                }}
                className="w-full p-4 flex items-center justify-between bg-zinc-900/60 hover:bg-zinc-900 transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-bold text-white">
                      {folderName}
                    </div>
                    <div className="text-[11px] text-zinc-400">
                      Carpeta de evento • {items.length} partidas internas
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  <span className="text-sm font-bold text-[#10B981]">
                    +{formatEUR(folderTotal, privacyMode)}
                  </span>
                  {isOpen ? (
                    <ChevronUp className="w-4 h-4 text-zinc-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-zinc-400" />
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="p-3 space-y-2.5 border-t border-[#2C2C2E] bg-black/30">
                  {items.map((item) => renderPendingRow(item))}
                  <button
                    type="button"
                    onClick={() => openNewPendingModal('income', folderName)}
                    className="w-full py-2 rounded-xl border border-dashed border-[#2C2C2E] text-xs font-medium text-zinc-400 hover:text-white transition"
                  >
                    + Añadir partida dentro de &ldquo;{folderName}&rdquo;
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {/* Ingresos individuales fuera de carpetas */}
        {standaloneIncomes.length === 0 &&
        Object.keys(folderGroups).length === 0 ? (
          <div className="rounded-2xl bg-[#1C1C1E]/60 border border-[#2C2C2E] p-5 text-center text-xs text-zinc-500">
            No tienes ingresos pendientes por cobrar. Pulsa &ldquo;+ Añadir
            Ingreso Pendiente&rdquo; para registrar uno.
          </div>
        ) : (
          <div className="space-y-2.5">
            {standaloneIncomes.map((item) => renderPendingRow(item))}
          </div>
        )}
      </div>

      {/* 3. DEUDAS POR PAGAR */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-[#F43F5E]">
              Deudas por Pagar
            </h2>
            <p className="text-[11px] text-zinc-500">
              Pagos pendientes de importe único o divididos en cuotas
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewPendingModal('debt')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-xs font-semibold text-[#F43F5E] active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Deuda</span>
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="rounded-2xl bg-[#1C1C1E]/60 border border-[#2C2C2E] p-5 text-center text-xs text-zinc-500">
            Cero deudas pendientes. ¡Excelente salud financiera!
          </div>
        ) : (
          <div className="space-y-2.5">
            {debts.map((item) => renderPendingRow(item))}
          </div>
        )}
      </div>

      {/* 4. HISTORIAL DE MOVIMIENTOS CON REVERTIR */}
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] overflow-hidden">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((o) => !o)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-zinc-800/40 transition"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#6366F1]" />
            <div>
              <div className="text-sm font-bold text-white">
                Historial de Movimientos Realizados
              </div>
              <div className="text-[11px] text-zinc-400">
                {state.history.length} asientos registrados • Incluye botón
                Revertir
              </div>
            </div>
          </div>
          {isHistoryOpen ? (
            <ChevronUp className="w-4 h-4 text-zinc-400" />
          ) : (
            <ChevronDown className="w-4 h-4 text-zinc-400" />
          )}
        </button>

        {isHistoryOpen && (
          <div className="p-3 border-t border-[#2C2C2E] space-y-2 bg-black/30">
            {state.history.length === 0 ? (
              <p className="text-xs text-center text-zinc-500 py-4">
                Aún no se han registrado movimientos en el historial.
              </p>
            ) : (
              state.history.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] flex items-center justify-between gap-3"
                >
                  <div className="min-w-0 flex-1">
                    <div className="text-xs font-semibold text-white truncate">
                      {rec.title}
                    </div>
                    {rec.subtitle && (
                      <div className="text-[11px] text-zinc-400 truncate">
                        {rec.subtitle}
                      </div>
                    )}
                    <div className="text-[10px] text-zinc-500 mt-0.5">
                      {new Date(rec.timestamp).toLocaleString('es-ES', {
                        day: '2-digit',
                        month: 'short',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs font-bold text-zinc-200">
                      {formatEUR(rec.amountEur, privacyMode)}
                    </span>
                    {rec.reversible && (
                      <button
                        type="button"
                        onClick={() => onRevertHistoryRecord(rec.id)}
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-zinc-800 hover:bg-[#F43F5E]/20 hover:text-[#F43F5E] text-[11px] font-semibold text-zinc-300 border border-[#2C2C2E] transition"
                      >
                        <RotateCcw className="w-3 h-3" />
                        <span>Revertir</span>
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>

      {/* Bottom Sheet: Editar Objetivo de Ahorro Mensual */}
      <BottomSheet
        isOpen={isEditingSavingsTarget}
        onClose={() => setIsEditingSavingsTarget(false)}
        title="Importe de Ahorro Mensual"
        subtitle="Configura el importe del traspaso rápido Imagin ➔ Trade Republic"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = parseFloat(savingsInput.replace(',', '.'));
            if (Number.isFinite(val) && val >= 0) {
              onUpdateMonthlySavingsTarget(val);
            }
            setIsEditingSavingsTarget(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Importe Mensual (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={savingsInput}
              onChange={(e) => setSavingsInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#10B981]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm"
          >
            Guardar Importe
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet: Aviso de Saldo Insuficiente en DCA */}
      <BottomSheet
        isOpen={!!dcaErrorMsg}
        onClose={() => setDcaErrorMsg(null)}
        title="No se pudo ejecutar el Plan DCA"
        subtitle="Verificación de saldo en Trade Republic"
      >
        <div className="space-y-4">
          <div className="p-4 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#F43F5E] shrink-0 mt-0.5" />
            <p className="text-xs text-zinc-200 leading-relaxed">
              {dcaErrorMsg}
            </p>
          </div>
          <button
            type="button"
            onClick={() => setDcaErrorMsg(null)}
            className="w-full py-3.5 rounded-2xl bg-zinc-800 text-white font-bold text-sm"
          >
            Entendido
          </button>
        </div>
      </BottomSheet>

      {/* Bottom Sheet: Confirmación y Ajuste Post-DCA */}
      <BottomSheet
        isOpen={!!postDcaItems}
        onClose={() => setPostDcaItems(null)}
        title="Confirmación y Ajuste Post-DCA"
        subtitle="Ajusta cualquier decimal de tus participaciones si varió por el spread real de Trade Republic"
      >
        {postDcaItems && (
          <form
            onSubmit={(e) => {
              e.preventDefault();
              const adjustments = postDcaItems.map((item) => {
                const raw = postDcaShareInputs[item.assetId] || '';
                const parsed = parseFloat(raw.replace(',', '.'));
                return {
                  assetId: item.assetId,
                  finalShares: Number.isFinite(parsed)
                    ? parsed
                    : item.newTotalShares,
                };
              });
              onSavePostDcaAdjustments(adjustments);
              setPostDcaItems(null);
            }}
            className="space-y-3.5"
          >
            <div className="p-3 rounded-xl bg-[#10B981]/10 border border-[#10B981]/30 flex items-center gap-2 text-xs text-[#10B981]">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>
                DCA descontado de Trade Republic y sumado a tu cartera.
              </span>
            </div>

            <div className="space-y-2.5 max-h-[50dvh] overflow-y-auto pr-1">
              {postDcaItems.map((item) => (
                <div
                  key={item.assetId}
                  className="p-3 rounded-xl bg-black border border-[#2C2C2E] space-y-1.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white">
                      {item.name} ({item.ticker})
                    </span>
                    <span className="text-[#10B981] font-semibold">
                      +{formatEUR(item.dcaAmountEur)} (+
                      {item.addedShares.toFixed(6)} part.)
                    </span>
                  </div>
                  <div>
                    <label className="block text-[10px] text-zinc-400 mb-1">
                      Participaciones Totales Tras Compra (Editable hasta 8
                      decimales):
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={postDcaShareInputs[item.assetId] ?? ''}
                      onChange={(e) =>
                        setPostDcaShareInputs((prev) => ({
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
        )}
      </BottomSheet>

      {/* Bottom Sheet: Crear / Editar Ingreso o Deuda (Importe Único o Sub-pagos + Carpeta) */}
      <BottomSheet
        isOpen={!!editingItem}
        onClose={() => setEditingItem(null)}
        title={
          editingItem?.type === 'debt'
            ? 'Configurar Deuda por Pagar'
            : 'Configurar Ingreso por Cobrar'
        }
        subtitle="Elige entre importe único o dividido en sub-pagos/cuotas dinámicas"
      >
        {editingItem && (
          <form onSubmit={handleSavePendingItem} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1">
                Concepto / Nombre
              </label>
              <input
                type="text"
                value={itemName}
                onChange={(e) => setItemName(e.target.value)}
                placeholder="Ej. Nómina Hotel, Coche, Fianza..."
                className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-sm text-white focus:outline-none focus:border-[#6366F1]"
                required
              />
            </div>

            {editingItem.type === 'income' && (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Carpeta de Evento (Opcional — agrupa varios asientos)
                </label>
                <input
                  type="text"
                  value={itemFolder}
                  onChange={(e) => setItemFolder(e.target.value)}
                  placeholder="Ej. Pegajosa Halloween (déjalo vacío si es individual)"
                  className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-sm text-white focus:outline-none focus:border-[#6366F1]"
                />
              </div>
            )}

            {/* Selector de Modo: Importe Único vs Sub-pagos/Cuotas */}
            <div className="grid grid-cols-2 gap-2 p-1 rounded-2xl bg-black border border-[#2C2C2E]">
              <button
                type="button"
                onClick={() => setItemMode('single')}
                className={`py-2.5 rounded-xl text-xs font-semibold transition ${
                  itemMode === 'single'
                    ? 'bg-[#1C1C1E] text-white shadow'
                    : 'text-zinc-400'
                }`}
              >
                Importe Único
              </button>
              <button
                type="button"
                onClick={() => {
                  setItemMode('subitems');
                  if (itemSubItems.length === 0) {
                    setItemSubItems([
                      {
                        id: `sub_${Date.now()}_1`,
                        name:
                          editingItem.type === 'debt'
                            ? 'Cuota 1'
                            : 'Sub-pago 1',
                        amount: 0,
                        completed: false,
                      },
                    ]);
                  }
                }}
                className={`py-2.5 rounded-xl text-xs font-semibold transition ${
                  itemMode === 'subitems'
                    ? 'bg-[#1C1C1E] text-white shadow'
                    : 'text-zinc-400'
                }`}
              >
                Sub-pagos / Cuotas
              </button>
            </div>

            {itemMode === 'single' ? (
              <div>
                <label className="block text-xs font-medium text-zinc-400 mb-1">
                  Importe Pendiente (€)
                </label>
                <input
                  type="number"
                  step="0.01"
                  value={itemAmount}
                  onChange={(e) => setItemAmount(e.target.value)}
                  placeholder="0.00"
                  className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#10B981]"
                />
              </div>
            ) : (
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-medium text-zinc-400">
                    Desglose de Sub-pagos / Cuotas
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setItemSubItems((prev) => [
                        ...prev,
                        {
                          id: `sub_${Date.now()}_${prev.length + 1}`,
                          name: `${
                            editingItem.type === 'debt' ? 'Cuota' : 'Sub-pago'
                          } ${prev.length + 1}`,
                          amount: 0,
                          completed: false,
                        },
                      ])
                    }
                    className="text-xs font-bold text-[#6366F1]"
                  >
                    + Añadir Cuota / Sub-pago
                  </button>
                </div>

                <div className="space-y-2 max-h-52 overflow-y-auto pr-1">
                  {itemSubItems.map((sub, index) => (
                    <div
                      key={sub.id}
                      className="flex items-center gap-2 bg-black p-2 rounded-xl border border-[#2C2C2E]"
                    >
                      <input
                        type="text"
                        value={sub.name}
                        onChange={(e) => {
                          const val = e.target.value;
                          setItemSubItems((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, name: val } : s
                            )
                          );
                        }}
                        placeholder="Nombre cuota"
                        className="flex-1 px-2.5 py-2 rounded-lg bg-[#1C1C1E] text-xs text-white"
                      />
                      <input
                        type="number"
                        step="0.01"
                        value={sub.amount}
                        onChange={(e) => {
                          const val = parseFloat(e.target.value) || 0;
                          setItemSubItems((prev) =>
                            prev.map((s, i) =>
                              i === index ? { ...s, amount: val } : s
                            )
                          );
                        }}
                        placeholder="0.00"
                        className="w-24 px-2.5 py-2 rounded-lg bg-[#1C1C1E] text-xs font-bold text-white text-right"
                      />
                      <button
                        type="button"
                        onClick={() =>
                          setItemSubItems((prev) =>
                            prev.filter((_, i) => i !== index)
                          )
                        }
                        className="p-2 text-zinc-500 hover:text-[#F43F5E]"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>

                <div className="text-right text-xs text-zinc-400">
                  Suma total calculada:{' '}
                  <strong className="text-white">
                    {formatEUR(
                      itemSubItems
                        .filter((s) => !s.completed)
                        .reduce((a, b) => a + Number(b.amount || 0), 0)
                    )}
                  </strong>
                </div>
              </div>
            )}

            <div className="flex flex-col gap-2 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm"
              >
                Guardar Asiento
              </button>

              {state.pendingItems.some((i) => i.id === editingItem.id) && (
                <>
                  {!confirmDeleteItem ? (
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteItem(true)}
                      className="w-full py-3 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-[#F43F5E] font-semibold text-xs flex items-center justify-center gap-1.5"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Eliminar Registro</span>
                    </button>
                  ) : (
                    <div className="grid grid-cols-2 gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setConfirmDeleteItem(false)}
                        className="py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
                      >
                        Cancelar
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          onDeletePendingItem(editingItem.id);
                          setEditingItem(null);
                        }}
                        className="py-2.5 rounded-xl bg-[#F43F5E] text-xs font-bold text-white"
                      >
                        Confirmar Borrado
                      </button>
                    </div>
                  )}
                </>
              )}
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Bottom Sheet: Cobro / Pago Total o Parcial */}
      <BottomSheet
        isOpen={!!settlingTarget}
        onClose={() => setSettlingTarget(null)}
        title={
          settlingTarget?.item.type === 'income'
            ? 'Cobrar Ingreso (Total o Parcial)'
            : 'Pagar Deuda (Total o Parcial)'
        }
        subtitle={
          settlingTarget
            ? `${settlingTarget.item.name}${
                settlingTarget.subItem
                  ? ` • ${settlingTarget.subItem.name}`
                  : ''
              } (Pendiente: ${formatEUR(settlingTarget.maxAmount)})`
            : ''
        }
      >
        {settlingTarget && (
          <form onSubmit={handleConfirmSettle} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                {settlingTarget.item.type === 'income'
                  ? 'Cuenta de Liquidez donde entra el dinero'
                  : 'Cuenta de Liquidez de donde sale el dinero'}
              </label>
              <select
                value={selectedAccountId}
                onChange={(e) => setSelectedAccountId(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-sm text-white focus:outline-none focus:border-[#6366F1]"
              >
                {state.accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} ({formatEUR(a.balance, privacyMode)})
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Importe a liquidar hoy (€) — Reduce la diferencia si es parcial
              </label>
              <input
                type="number"
                step="0.01"
                max={settlingTarget.maxAmount}
                value={settleAmountInput}
                onChange={(e) => setSettleAmountInput(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#10B981]"
                autoFocus
              />
            </div>

            <button
              type="submit"
              className={`w-full py-3.5 rounded-2xl font-bold text-sm transition ${
                settlingTarget.item.type === 'income'
                  ? 'bg-[#10B981] text-black'
                  : 'bg-[#F43F5E] text-white'
              }`}
            >
              {settlingTarget.item.type === 'income'
                ? 'Confirmar Cobro y Sumar a Cuenta'
                : 'Confirmar Pago y Descontar de Cuenta'}
            </button>
          </form>
        )}
      </BottomSheet>
    </div>
  );
}
