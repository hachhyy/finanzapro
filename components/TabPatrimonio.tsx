'use client';

import React, { useState } from 'react';
import {
  Landmark,
  Plus,
  ArrowLeftRight,
  Percent,
  Sparkles,
  Trash2,
  Check,
} from 'lucide-react';
import { AppState, BankAccount, formatEUR } from '@/lib/types';
import { BottomSheet } from './BottomSheet';

interface TabPatrimonioProps {
  state: AppState;
  privacyMode: boolean;
  onUpdateAccount: (id: string, name: string, balance: number) => void;
  onAddAccount: (name: string, balance: number) => void;
  onDeleteAccount: (id: string) => void;
  onTransferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number
  ) => void;
  onUpdateTRRate: (rate: number) => void;
  onUpdateTRAccrued: (accrued: number) => void;
  onClaimTRInterest: () => void;
}

export function TabPatrimonio({
  state,
  privacyMode,
  onUpdateAccount,
  onAddAccount,
  onDeleteAccount,
  onTransferBetweenAccounts,
  onUpdateTRRate,
  onUpdateTRAccrued,
  onClaimTRInterest,
}: TabPatrimonioProps) {
  // Edit Account Sheet
  const [editingAccount, setEditingAccount] = useState<BankAccount | null>(
    null
  );
  const [editName, setEditName] = useState('');
  const [editBalance, setEditBalance] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);

  // Add Account Sheet
  const [isAddingAccount, setIsAddingAccount] = useState(false);
  const [newName, setNewName] = useState('');
  const [newBalance, setNewBalance] = useState('0');

  // Transfer Sheet
  const [isTransferOpen, setIsTransferOpen] = useState(false);
  const [fromAccId, setFromAccId] = useState('');
  const [toAccId, setToAccId] = useState('');
  const [transferAmount, setTransferAmount] = useState('');
  const [transferError, setTransferError] = useState('');

  // TR Rate / Accrued Sheets
  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');

  const [isEditingAccrued, setIsEditingAccrued] = useState(false);
  const [accruedInput, setAccruedInput] = useState('');

  const openEditAccount = (acc: BankAccount) => {
    setEditingAccount(acc);
    setEditName(acc.name);
    setEditBalance(String(acc.balance));
    setConfirmDelete(false);
  };

  const handleSaveAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAccount) return;
    const parsed = parseFloat(editBalance.replace(',', '.'));
    onUpdateAccount(
      editingAccount.id,
      editName.trim() || editingAccount.name,
      Number.isFinite(parsed) ? parsed : 0
    );
    setEditingAccount(null);
  };

  const handleCreateAccount = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    const parsed = parseFloat(newBalance.replace(',', '.'));
    onAddAccount(newName.trim(), Number.isFinite(parsed) ? parsed : 0);
    setNewName('');
    setNewBalance('0');
    setIsAddingAccount(false);
  };

  const openTransferModal = () => {
    const first = state.accounts[0]?.id || '';
    const second = state.accounts[1]?.id || first;
    setFromAccId(first);
    setToAccId(second);
    setTransferAmount('');
    setTransferError('');
    setIsTransferOpen(true);
  };

  const handleTransferSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(transferAmount.replace(',', '.'));
    if (!fromAccId || !toAccId || fromAccId === toAccId) {
      setTransferError('Selecciona dos cuentas distintas.');
      return;
    }
    if (!Number.isFinite(amt) || amt <= 0) {
      setTransferError('Introduce un importe válido mayor a 0,00 €.');
      return;
    }
    onTransferBetweenAccounts(fromAccId, toAccId, amt);
    setIsTransferOpen(false);
  };

  return (
    <div className="space-y-4">
      {/* Cabecera de sección y botones de acción rápida */}
      <div className="flex items-center justify-between gap-2">
        <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
          Cuentas de Liquidez
        </h2>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={openTransferModal}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs font-semibold text-zinc-200 hover:text-white active:scale-95 transition"
          >
            <ArrowLeftRight className="w-3.5 h-3.5 text-[#6366F1]" />
            <span>⇄ Transferir entre cuentas</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setNewName('');
              setNewBalance('0');
              setIsAddingAccount(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#10B981]/15 border border-[#10B981]/30 text-xs font-semibold text-[#10B981] active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir Cuenta</span>
          </button>
        </div>
      </div>

      {/* Lista de cuentas bancarias (Sin botones + / - en la tarjeta, edición tocando saldo/nombre) */}
      <div className="space-y-3">
        {state.accounts.map((acc) => {
          const isTR =
            acc.isTradeRepublic ||
            acc.name.toLowerCase().includes('trade republic');

          const trBalance = Number(acc.balance || 0);
          const tae = Number(state.trInterestRate ?? 2.5);
          const dailyInterest = (trBalance * (tae / 100)) / 365;
          const monthlyInterest = (trBalance * (tae / 100)) / 12;
          const yearlyInterest = trBalance * (tae / 100);

          return (
            <div
              key={acc.id}
              className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-4 transition pointer-events-auto"
            >
              {/* Fila principal: Tocar nombre o saldo abre el Bottom Sheet de edición */}
              <div
                onClick={() => openEditAccount(acc)}
                role="button"
                tabIndex={0}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') openEditAccount(acc);
                }}
                className="flex items-center justify-between gap-3 cursor-pointer pointer-events-auto"
              >
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditAccount(acc);
                  }}
                  className="flex items-center gap-3 text-left group flex-1 min-w-0 cursor-pointer pointer-events-auto"
                >
                  <div
                    className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                      isTR
                        ? 'bg-[#6366F1]/15 border-[#6366F1]/40 text-[#6366F1]'
                        : 'bg-zinc-800/80 border-[#2C2C2E] text-zinc-300'
                    }`}
                  >
                    <Landmark className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="text-sm font-semibold text-white group-hover:text-[#10B981] transition truncate">
                      {acc.name}
                    </div>
                    <div className="text-[11px] text-zinc-500">
                      Toca el nombre o el saldo para editar
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditAccount(acc);
                  }}
                  className="text-right px-3 py-1.5 rounded-xl bg-black/40 border border-[#2C2C2E] hover:border-zinc-600 active:scale-95 transition cursor-pointer pointer-events-auto"
                >
                  <span className="text-lg font-bold tracking-tight text-white">
                    {formatEUR(acc.balance, privacyMode)}
                  </span>
                </button>
              </div>

              {/* Motor de Interés Remunerado Automático (Exclusivo en Trade Republic) */}
              {isTR && (
                <div className="mt-4 pt-3.5 border-t border-[#2C2C2E] space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-1.5 text-xs font-semibold text-[#6366F1]">
                      <Sparkles className="w-3.5 h-3.5" />
                      <span>Motor de Interés Remunerado</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setRateInput(String(state.trInterestRate));
                        setIsEditingRate(true);
                      }}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#6366F1]/15 border border-[#6366F1]/30 text-xs font-bold text-[#6366F1] active:scale-95 transition"
                    >
                      <Percent className="w-3 h-3" />
                      <span>{tae.toFixed(2).replace('.', ',')}% TAE</span>
                    </button>
                  </div>

                  {/* Fila limpia con las 3 proyecciones */}
                  <div className="rounded-xl bg-black/50 border border-[#2C2C2E] px-3 py-2.5 flex items-center justify-between text-xs text-zinc-300">
                    <span>
                      <strong className="text-[#10B981]">
                        +{formatEUR(dailyInterest, privacyMode)}
                      </strong>
                      /día
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>
                      <strong className="text-[#10B981]">
                        +{formatEUR(monthlyInterest, privacyMode)}
                      </strong>
                      /mes
                    </span>
                    <span className="text-zinc-600">•</span>
                    <span>
                      <strong className="text-[#10B981]">
                        +{formatEUR(yearlyInterest, privacyMode)}
                      </strong>
                      /año
                    </span>
                  </div>

                  {/* Devengado acumulado este mes y botón de cobro Día 1 */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={() => {
                        setAccruedInput(
                          String(Number(state.trAccruedInterest || 0).toFixed(2))
                        );
                        setIsEditingAccrued(true);
                      }}
                      className="flex items-center justify-between sm:justify-start gap-2 px-3 py-2 rounded-xl bg-zinc-900/90 border border-[#2C2C2E] text-left hover:border-[#6366F1]/50 transition"
                    >
                      <span className="text-xs text-zinc-400">
                        Devengado acumulado este mes:
                      </span>
                      <span className="text-xs font-bold text-[#10B981]">
                        +{formatEUR(state.trAccruedInterest, privacyMode)}
                      </span>
                    </button>

                    <button
                      type="button"
                      onClick={onClaimTRInterest}
                      disabled={state.trAccruedInterest <= 0}
                      className={`px-3.5 py-2 rounded-xl text-xs font-semibold transition ${
                        state.trAccruedInterest > 0
                          ? 'bg-[#6366F1] text-white hover:bg-[#5558E6] active:scale-95 shadow-md shadow-[#6366F1]/20'
                          : 'bg-zinc-800/60 text-zinc-500 cursor-not-allowed'
                      }`}
                    >
                      + Cobrar interés devengado (Día 1)
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Bottom Sheet: Editar Cuenta / Saldo / Eliminar */}
      <BottomSheet
        isOpen={!!editingAccount}
        onClose={() => setEditingAccount(null)}
        title="Editar Cuenta Bancaria"
        subtitle="Modifica el saldo actual, el nombre o elimina la cuenta"
      >
        {editingAccount && (
          <form onSubmit={handleSaveAccount} className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Saldo Actual (€)
              </label>
              <input
                type="number"
                step="0.01"
                value={editBalance}
                onChange={(e) => setEditBalance(e.target.value)}
                className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#10B981]"
                placeholder="0.00"
                autoFocus
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-zinc-400 mb-1.5">
                Nombre de la Cuenta
              </label>
              <input
                type="text"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
                className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-base text-white focus:outline-none focus:border-[#6366F1]"
              />
            </div>

            <div className="flex flex-col gap-2.5 pt-2">
              <button
                type="submit"
                className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm flex items-center justify-center gap-2 active:scale-98 transition"
              >
                <Check className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </button>

              {!confirmDelete ? (
                <button
                  type="button"
                  onClick={() => setConfirmDelete(true)}
                  className="w-full py-3 rounded-2xl bg-[#F43F5E]/15 border border-[#F43F5E]/30 text-[#F43F5E] font-semibold text-xs flex items-center justify-center gap-1.5"
                >
                  <Trash2 className="w-4 h-4" />
                  <span>Eliminar Cuenta</span>
                </button>
              ) : (
                <div className="p-3 rounded-2xl bg-[#F43F5E]/10 border border-[#F43F5E]/40 space-y-2">
                  <p className="text-xs text-center text-[#F43F5E] font-medium">
                    ¿Confirmas eliminar &ldquo;{editingAccount.name}&rdquo;?
                  </p>
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setConfirmDelete(false)}
                      className="py-2.5 rounded-xl bg-zinc-800 text-xs font-semibold text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAccount(editingAccount.id);
                        setEditingAccount(null);
                      }}
                      className="py-2.5 rounded-xl bg-[#F43F5E] text-xs font-bold text-white"
                    >
                      Sí, Eliminar
                    </button>
                  </div>
                </div>
              )}
            </div>
          </form>
        )}
      </BottomSheet>

      {/* Bottom Sheet: Añadir Nueva Cuenta */}
      <BottomSheet
        isOpen={isAddingAccount}
        onClose={() => setIsAddingAccount(false)}
        title="Añadir Nueva Cuenta"
        subtitle="Crea una cuenta bancaria o cartera de liquidez adicional"
      >
        <form onSubmit={handleCreateAccount} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Nombre de la Cuenta
            </label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Ej. Revolut, N26, Hucha..."
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-base text-white focus:outline-none focus:border-[#10B981]"
              autoFocus
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Saldo Inicial (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={newBalance}
              onChange={(e) => setNewBalance(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-xl font-bold text-white focus:outline-none focus:border-[#10B981]"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm active:scale-98 transition"
          >
            Crear Cuenta
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet: Transferir entre cuentas */}
      <BottomSheet
        isOpen={isTransferOpen}
        onClose={() => setIsTransferOpen(false)}
        title="⇄ Transferir entre Cuentas"
        subtitle="Traspasa liquidez al instante registrando el asiento en el historial"
      >
        <form onSubmit={handleTransferSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Cuenta Origen (De donde sale)
            </label>
            <select
              value={fromAccId}
              onChange={(e) => setFromAccId(e.target.value)}
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
              Cuenta Destino (A donde entra)
            </label>
            <select
              value={toAccId}
              onChange={(e) => setToAccId(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-sm text-white focus:outline-none focus:border-[#10B981]"
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
              Importe a Transferir (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={transferAmount}
              onChange={(e) => {
                setTransferAmount(e.target.value);
                setTransferError('');
              }}
              placeholder="0.00"
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#6366F1]"
            />
          </div>

          {transferError && (
            <p className="text-xs text-[#F43F5E] font-medium">{transferError}</p>
          )}

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#6366F1] text-white font-bold text-sm active:scale-98 transition"
          >
            Ejecutar Transferencia
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet: Editar % TAE Trade Republic */}
      <BottomSheet
        isOpen={isEditingRate}
        onClose={() => setIsEditingRate(false)}
        title="Tasa de Interés Anual (% TAE)"
        subtitle="Configura la remuneración anual sobre el efectivo en Trade Republic"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = parseFloat(rateInput.replace(',', '.'));
            if (Number.isFinite(val) && val >= 0) {
              onUpdateTRRate(val);
            }
            setIsEditingRate(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Porcentaje TAE Anual (%)
            </label>
            <input
              type="number"
              step="0.01"
              value={rateInput}
              onChange={(e) => setRateInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#6366F1]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#6366F1] text-white font-bold text-sm"
          >
            Guardar % TAE
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet: Editar Devengado Acumulado */}
      <BottomSheet
        isOpen={isEditingAccrued}
        onClose={() => setIsEditingAccrued(false)}
        title="Interés Devengado Acumulado (€)"
        subtitle="Ajusta manualmente el interés acumulado de este mes en Trade Republic"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const val = parseFloat(accruedInput.replace(',', '.'));
            if (Number.isFinite(val) && val >= 0) {
              onUpdateTRAccrued(val);
            }
            setIsEditingAccrued(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1.5">
              Importe Devengado (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={accruedInput}
              onChange={(e) => setAccruedInput(e.target.value)}
              className="w-full px-4 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-2xl font-bold text-white focus:outline-none focus:border-[#10B981]"
              autoFocus
            />
          </div>
          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#10B981] text-black font-bold text-sm"
          >
            Guardar Importe Devengado
          </button>
        </form>
      </BottomSheet>
    </div>
  );
}
