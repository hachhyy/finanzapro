'use client';

import React, { useState, useMemo } from 'react';
import {
  Plus,
  Folder,
  ChevronDown,
  ChevronUp,
  Trash2,
  RotateCcw,
  History,
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

interface TabPendientesFlujoProps {
  state: AppState;
  privacyMode: boolean;
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
  onUpsertPendingItem,
  onDeletePendingItem,
  onSettlePending,
  onRevertHistoryRecord,
}: TabPendientesFlujoProps) {
  // Folder collapse states
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({
    'Pegajosa Halloween': true,
  });

  // Create / Edit Pending Item Sheet
  const [editingItem, setEditingItem] = useState<PendingItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [itemFolder, setItemFolder] = useState('');
  const [itemMode, setItemMode] = useState<'single' | 'subitems'>('single');
  const [itemAmount, setItemAmount] = useState('');
  const [itemSubItems, setItemSubItems] = useState<
    (SubItem & { rawAmount?: string })[]
  >([]);
  const [confirmDeleteItem, setConfirmDeleteItem] = useState(false);

  // Cobrar / Pagar (Liquidación Total o Parcial) Sheet
  const [settlingTarget, setSettlingTarget] = useState<{
    item: PendingItem;
    subItem?: SubItem;
    maxAmount: number;
  } | null>(null);
  const [selectedAccountId, setSelectedAccountId] = useState('');
  const [settleAmountInput, setSettleAmountInput] = useState('');

  // Collapsible History Panel
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);

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
    setItemAmount(item.amount > 0 ? String(item.amount) : '');
    setItemSubItems(
      item.subItems.map((s) => ({
        ...s,
        rawAmount: s.amount > 0 ? String(s.amount) : '',
      }))
    );
    setConfirmDeleteItem(false);
  };

  const parseDecimal = (raw: string | number | undefined): number => {
    if (typeof raw === 'number') return Number.isFinite(raw) ? raw : 0;
    if (!raw) return 0;
    const normalized = String(raw).trim().replace(',', '.');
    const parsed = parseFloat(normalized);
    return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : 0;
  };

  const handleSavePendingItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !itemName.trim()) return;

    const cleanSubItems: SubItem[] = itemSubItems
      .map((s, idx) => {
        const amt = parseDecimal(s.rawAmount ?? s.amount);
        return {
          id: s.id,
          name: s.name.trim() || `Cuota ${idx + 1}`,
          amount: amt,
          completed: s.completed,
        };
      })
      .filter((s) => s.name.trim() !== '' || s.amount > 0);

    const computedSubSum = Number(
      cleanSubItems
        .filter((s) => !s.completed)
        .reduce((acc, s) => acc + s.amount, 0)
        .toFixed(2)
    );

    const parsedSingle = parseDecimal(itemAmount);
    const finalAmount =
      itemMode === 'subitems' ? computedSubSum : parsedSingle;

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

  const renderPendingRow = (item: PendingItem) => {
    const isIncome = item.type === 'income';
    const effectiveAmt = getPendingEffectiveAmount(item);
    const hasSubItems = item.mode === 'subitems' && item.subItems.length > 0;

    return (
      <div
        key={item.id}
        className="rounded-2xl bg-[#121214] border border-white/[0.07] p-3.5 space-y-2.5 tabular-nums"
      >
        <div className="flex items-center justify-between gap-2">
          <button
            type="button"
            onClick={() => openEditPendingModal(item)}
            className="text-left flex-1 min-w-0 group"
          >
            <div className="flex items-center gap-1.5">
              <span className="text-sm font-semibold text-white group-hover:text-[#6366F1] transition truncate tracking-[-0.01em]">
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
              className={`text-sm font-bold tracking-tight ${
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
                className={`px-3 py-1.5 rounded-xl text-xs font-bold transition active:scale-[0.96] ${
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
          <div className="pt-2 border-t border-white/[0.06] space-y-1.5">
            {item.subItems.map((sub) => {
              if (sub.completed || sub.amount <= 0) return null;
              return (
                <div
                  key={sub.id}
                  className="flex items-center justify-between gap-2 pl-2 py-1.5 px-2.5 rounded-xl bg-black/40 border border-white/[0.05]"
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
                      className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition active:scale-[0.96] ${
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
      {/* 1. INGRESOS POR COBRAR + CARPETAS DE EVENTOS */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#10B981]">
              Ingresos por Cobrar
            </h2>
            <p className="text-[11px] text-zinc-500">
              Cobros únicos, sub-pagos y carpetas de eventos desplegables
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewPendingModal('income')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-semibold text-[#10B981] active:scale-[0.97] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Ingreso</span>
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
              className="rounded-2xl bg-[#121214] border border-white/[0.07] overflow-hidden tabular-nums"
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
                className="w-full p-4 flex items-center justify-between bg-white/[0.02] hover:bg-white/[0.04] transition cursor-pointer"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-9 h-9 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 flex items-center justify-center text-[#6366F1]">
                    <Folder className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-white tracking-[-0.01em]">
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
                <div className="p-3 space-y-2.5 border-t border-white/[0.06] bg-black/30">
                  {items.map((item) => renderPendingRow(item))}
                  <button
                    type="button"
                    onClick={() => openNewPendingModal('income', folderName)}
                    className="w-full py-2 rounded-xl border border-dashed border-white/[0.12] text-xs font-medium text-zinc-400 hover:text-white transition"
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
          <div className="rounded-2xl bg-[#121214]/60 border border-white/[0.06] p-5 text-center text-xs text-zinc-500">
            No tienes ingresos pendientes por cobrar. Pulsa &ldquo;Añadir
            Ingreso&rdquo; para registrar uno.
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
            <h2 className="text-xs font-semibold uppercase tracking-wider text-[#F43F5E]">
              Deudas por Pagar
            </h2>
            <p className="text-[11px] text-zinc-500">
              Pagos pendientes de importe único o divididos en cuotas
            </p>
          </div>
          <button
            type="button"
            onClick={() => openNewPendingModal('debt')}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-xs font-semibold text-[#F43F5E] active:scale-[0.97] transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Añadir Deuda</span>
          </button>
        </div>

        {debts.length === 0 ? (
          <div className="rounded-2xl bg-[#121214]/60 border border-white/[0.06] p-5 text-center text-xs text-zinc-500">
            Cero deudas pendientes. ¡Excelente salud financiera!
          </div>
        ) : (
          <div className="space-y-2.5">
            {debts.map((item) => renderPendingRow(item))}
          </div>
        )}
      </div>

      {/* 4. HISTORIAL DE MOVIMIENTOS CON REVERTIR */}
      <div className="rounded-2xl bg-[#121214] border border-white/[0.07] overflow-hidden tabular-nums">
        <button
          type="button"
          onClick={() => setIsHistoryOpen((o) => !o)}
          className="w-full p-4 flex items-center justify-between text-left hover:bg-white/[0.03] transition"
        >
          <div className="flex items-center gap-2.5">
            <History className="w-4 h-4 text-[#6366F1]" />
            <div>
              <div className="text-sm font-semibold text-white tracking-[-0.01em]">
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
          <div className="p-3 border-t border-white/[0.06] space-y-2 bg-black/30">
            {state.history.length === 0 ? (
              <p className="text-xs text-center text-zinc-500 py-4">
                Aún no se han registrado movimientos en el historial.
              </p>
            ) : (
              state.history.map((rec) => (
                <div
                  key={rec.id}
                  className="p-3 rounded-xl bg-[#121214] border border-white/[0.07] flex items-center justify-between gap-3"
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
                        className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white/[0.05] hover:bg-[#F43F5E]/20 hover:text-[#F43F5E] text-[11px] font-semibold text-zinc-300 border border-white/[0.08] transition active:scale-[0.96]"
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
                        rawAmount: '',
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
                  type="text"
                  inputMode="decimal"
                  value={itemAmount}
                  onChange={(e) => {
                    const v = e.target.value;
                    if (/^[0-9]*[.,]?[0-9]*$/.test(v)) {
                      setItemAmount(v);
                    }
                  }}
                  placeholder="0,00"
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
                          rawAmount: '',
                          completed: false,
                        },
                      ])
                    }
                    className="text-xs font-bold text-[#6366F1]"
                  >
                    + Añadir Cuota / Sub-pago
                  </button>
                </div>

                <div className="space-y-2">
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
                        type="text"
                        inputMode="decimal"
                        value={
                          sub.rawAmount !== undefined
                            ? sub.rawAmount
                            : sub.amount > 0
                            ? String(sub.amount)
                            : ''
                        }
                        onChange={(e) => {
                          const raw = e.target.value;
                          if (!/^[0-9]*[.,]?[0-9]*$/.test(raw)) return;
                          const num = parseDecimal(raw);
                          setItemSubItems((prev) =>
                            prev.map((s, i) =>
                              i === index
                                ? { ...s, rawAmount: raw, amount: num }
                                : s
                            )
                          );
                        }}
                        placeholder="0,00"
                        className="w-28 px-2.5 py-2 rounded-lg bg-[#1C1C1E] text-xs font-bold text-white text-right focus:outline-none focus:border-[#6366F1] border border-transparent"
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
                        .reduce(
                          (a, b) =>
                            a + parseDecimal(b.rawAmount ?? b.amount),
                          0
                        )
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
