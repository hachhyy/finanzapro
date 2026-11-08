'use client';

import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  RefreshCw,
  Plus,
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  ArrowUpRight,
  Trash2,
  Check,
  Sparkles,
} from 'lucide-react';
import {
  AppState,
  InvestmentAsset,
  formatEUR,
  formatSignedEUR,
} from '@/lib/types';
import { ChartRange } from '@/app/api/chart/route';
import { TRChart, ChartPoint } from './TRChart';
import { BottomSheet } from './BottomSheet';

interface TabInversionesProps {
  state: AppState;
  privacyMode: boolean;
  isRefreshingPrices: boolean;
  onRefreshPrices: () => void;
  onAddAsset: (name: string, ticker: string, dcaMonthly: number) => void;
  onUpdateAssetPosition: (params: {
    assetId: string;
    name: string;
    ticker: string;
    shares: number;
    costBasis: number;
    dcaMonthly: number;
  }) => void;
  onDeleteAsset: (assetId: string) => void;
  onBuyAssetManual: (params: {
    assetId: string;
    accountId: string;
    amountEur: number;
    addedShares: number;
  }) => void;
  onSellAssetManual: (params: {
    assetId: string;
    accountId: string;
    amountEur: number;
    soldShares: number;
  }) => void;
}

const ASSET_COLORS = [
  '#10B981',
  '#6366F1',
  '#F59E0B',
  '#38BDF8',
  '#EC4899',
  '#A855F7',
  '#14B8A6',
  '#F43F5E',
];

export function TabInversiones({
  state,
  privacyMode,
  isRefreshingPrices,
  onRefreshPrices,
  onAddAsset,
  onUpdateAssetPosition,
  onDeleteAsset,
  onBuyAssetManual,
  onSellAssetManual,
}: TabInversionesProps) {
  // Portfolio Chart State
  const [portfolioRange, setPortfolioRange] = useState<ChartRange>('1M');
  const [portfolioSeries, setPortfolioSeries] = useState<ChartPoint[]>([]);
  const [portfolioChartLoading, setPortfolioChartLoading] = useState(false);

  // Add New Asset Sheet
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetTicker, setNewAssetTicker] = useState('');
  const [newAssetDca, setNewAssetDca] = useState('10');

  // Detailed Asset Bottom Sheet
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const selectedAsset = useMemo(
    () => state.assets.find((a) => a.id === selectedAssetId) || null,
    [state.assets, selectedAssetId]
  );

  // Individual Asset Chart inside Sheet
  const [assetRange, setAssetRange] = useState<ChartRange>('1M');
  const [assetSeries, setAssetSeries] = useState<ChartPoint[]>([]);
  const [assetChartLoading, setAssetChartLoading] = useState(false);

  // Dual Synchronized Editing States inside Asset Sheet
  const [editName, setEditName] = useState('');
  const [editTicker, setEditTicker] = useState('');
  const [editSharesInput, setEditSharesInput] = useState('');
  const [editValueEurInput, setEditValueEurInput] = useState('');
  const [editCostBasisInput, setEditCostBasisInput] = useState('');
  const [editDcaInput, setEditDcaInput] = useState('');
  const [confirmDeleteAsset, setConfirmDeleteAsset] = useState(false);

  // Manual Buy / Sell Sub-Sheet inside Asset Detail
  const [tradeMode, setTradeMode] = useState<'none' | 'buy' | 'sell'>('none');
  const [tradeAccountId, setTradeAccountId] = useState('');
  const [tradeEurInput, setTradeEurInput] = useState('');
  const [tradeSharesInput, setTradeSharesInput] = useState('');

  // Portfolio Metrics
  const { totalPortfolioEur, totalCostBasis, totalReturnEur, totalReturnPct } =
    useMemo(() => {
      const val = state.assets.reduce(
        (sum, a) => sum + Number(a.shares || 0) * Number(a.priceEur || 0),
        0
      );
      const cost = state.assets.reduce(
        (sum, a) => sum + Number(a.costBasis || 0),
        0
      );
      const ret = val - cost;
      const pct = cost > 0 ? (ret / cost) * 100 : 0;
      return {
        totalPortfolioEur: val,
        totalCostBasis: cost,
        totalReturnEur: ret,
        totalReturnPct: pct,
      };
    }, [state.assets]);

  // Fetch Portfolio Chart Series
  const loadPortfolioChart = useCallback(
    async (range: ChartRange) => {
      setPortfolioChartLoading(true);
      try {
        const activeAssets = state.assets.filter((a) => a.shares > 0);
        const primaryTicker =
          activeAssets[0]?.ticker || state.assets[0]?.ticker || 'BTC-EUR';
        const baseVal = totalPortfolioEur > 0 ? totalPortfolioEur : 200;

        const res = await fetch(
          `/api/chart?ticker=${encodeURIComponent(
            primaryTicker
          )}&range=${range}&basePrice=${baseVal}`
        );
        const data = await res.json();
        if (Array.isArray(data?.series) && data.series.length > 0) {
          const lastApiPrice =
            data.series[data.series.length - 1].priceEur || 1;
          const scaleFactor =
            totalPortfolioEur > 0 ? totalPortfolioEur / lastApiPrice : 1;

          const scaled: ChartPoint[] = data.series.map((pt: ChartPoint) => ({
            timestamp: pt.timestamp,
            label: pt.label,
            priceEur:
              totalPortfolioEur > 0
                ? Number((pt.priceEur * scaleFactor).toFixed(2))
                : Number(pt.priceEur.toFixed(2)),
          }));
          setPortfolioSeries(scaled);
        }
      } catch {
        // ignore chart fetch error
      } finally {
        setPortfolioChartLoading(false);
      }
    },
    [state.assets, totalPortfolioEur]
  );

  useEffect(() => {
    loadPortfolioChart(portfolioRange);
  }, [portfolioRange, loadPortfolioChart]);

  // Fetch Individual Asset Chart when selected
  const loadAssetChart = useCallback(
    async (asset: InvestmentAsset, range: ChartRange) => {
      setAssetChartLoading(true);
      try {
        const res = await fetch(
          `/api/chart?ticker=${encodeURIComponent(
            asset.ticker
          )}&range=${range}&basePrice=${asset.priceEur || 50}`
        );
        const data = await res.json();
        if (Array.isArray(data?.series)) {
          setAssetSeries(data.series);
        }
      } catch {
        // ignore
      } finally {
        setAssetChartLoading(false);
      }
    },
    []
  );

  const openAssetDetail = (asset: InvestmentAsset) => {
    setSelectedAssetId(asset.id);
    setEditName(asset.name);
    setEditTicker(asset.ticker);
    const currentVal = Number(asset.shares || 0) * Number(asset.priceEur || 0);
    setEditSharesInput(
      asset.shares > 0 ? Number(asset.shares.toFixed(8)).toString() : '0'
    );
    setEditValueEurInput(currentVal.toFixed(2));
    setEditCostBasisInput(Number(asset.costBasis || 0).toFixed(2));
    setEditDcaInput(Number(asset.dcaMonthly || 0).toFixed(2));
    setConfirmDeleteAsset(false);
    setTradeMode('none');

    const trAcc =
      state.accounts.find((a) => a.isTradeRepublic)?.id ||
      state.accounts[0]?.id ||
      '';
    setTradeAccountId(trAcc);
    setAssetRange('1M');
    loadAssetChart(asset, '1M');
  };

  useEffect(() => {
    if (selectedAsset) {
      loadAssetChart(selectedAsset, assetRange);
    }
  }, [selectedAsset, assetRange, loadAssetChart]);

  // Dual Editing Handlers (Shares <-> Value EUR)
  const handleSharesInputChange = (val: string) => {
    setEditSharesInput(val);
    if (!selectedAsset) return;
    const parsedShares = parseFloat(val.replace(',', '.'));
    if (Number.isFinite(parsedShares) && parsedShares >= 0) {
      const eur = parsedShares * (selectedAsset.priceEur || 0);
      setEditValueEurInput(eur.toFixed(2));
    } else {
      setEditValueEurInput('0.00');
    }
  };

  const handleValueEurInputChange = (val: string) => {
    setEditValueEurInput(val);
    if (!selectedAsset) return;
    const parsedEur = parseFloat(val.replace(',', '.'));
    const price = selectedAsset.priceEur || 1;
    if (Number.isFinite(parsedEur) && parsedEur >= 0 && price > 0) {
      const calculatedShares = parsedEur / price;
      setEditSharesInput(calculatedShares.toFixed(8));
    } else {
      setEditSharesInput('0');
    }
  };

  const handleSaveAssetDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const shares = parseFloat(editSharesInput.replace(',', '.'));
    const costBasis = parseFloat(editCostBasisInput.replace(',', '.'));
    const dcaMonthly = parseFloat(editDcaInput.replace(',', '.'));

    onUpdateAssetPosition({
      assetId: selectedAsset.id,
      name: editName.trim() || selectedAsset.name,
      ticker: editTicker.trim().toUpperCase() || selectedAsset.ticker,
      shares: Number.isFinite(shares) ? Number(shares.toFixed(8)) : 0,
      costBasis: Number.isFinite(costBasis) ? Number(costBasis.toFixed(2)) : 0,
      dcaMonthly: Number.isFinite(dcaMonthly)
        ? Number(dcaMonthly.toFixed(2))
        : 0,
    });
    setSelectedAssetId(null);
  };

  // Trade Buy/Sell Dual Synchronization
  const handleTradeEurChange = (val: string) => {
    setTradeEurInput(val);
    if (!selectedAsset) return;
    const eur = parseFloat(val.replace(',', '.'));
    const price = selectedAsset.priceEur || 1;
    if (Number.isFinite(eur) && eur > 0 && price > 0) {
      setTradeSharesInput((eur / price).toFixed(8));
    } else {
      setTradeSharesInput('0');
    }
  };

  const handleTradeSharesChange = (val: string) => {
    setTradeSharesInput(val);
    if (!selectedAsset) return;
    const sh = parseFloat(val.replace(',', '.'));
    const price = selectedAsset.priceEur || 0;
    if (Number.isFinite(sh) && sh > 0) {
      setTradeEurInput((sh * price).toFixed(2));
    } else {
      setTradeEurInput('0.00');
    }
  };

  const handleExecuteTrade = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset || !tradeAccountId) return;
    const eur = parseFloat(tradeEurInput.replace(',', '.'));
    const sh = parseFloat(tradeSharesInput.replace(',', '.'));
    if (!Number.isFinite(eur) || eur <= 0 || !Number.isFinite(sh) || sh <= 0)
      return;

    if (tradeMode === 'buy') {
      onBuyAssetManual({
        assetId: selectedAsset.id,
        accountId: tradeAccountId,
        amountEur: Number(eur.toFixed(2)),
        addedShares: Number(sh.toFixed(8)),
      });
    } else if (tradeMode === 'sell') {
      onSellAssetManual({
        assetId: selectedAsset.id,
        accountId: tradeAccountId,
        amountEur: Number(eur.toFixed(2)),
        soldShares: Number(sh.toFixed(8)),
      });
    }

    setTradeMode('none');
    setSelectedAssetId(null);
  };

  return (
    <div className="space-y-5">
      {/* 1. Cabecera de Cartera y Gráfico General Interactivo */}
      <div className="rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Valor Total Cartera Trade Republic
            </div>
            <div className="text-3xl font-extrabold tracking-tight text-white mt-0.5">
              {formatEUR(totalPortfolioEur, privacyMode)}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs">
              <span
                className={`font-bold ${
                  totalReturnEur >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                }`}
              >
                {formatSignedEUR(totalReturnEur, privacyMode)} (
                {totalReturnPct >= 0 ? '+' : ''}
                {totalReturnPct.toFixed(2)}%)
              </span>
              <span className="text-zinc-500">•</span>
              <span className="text-zinc-400">
                Invertido: {formatEUR(totalCostBasis, privacyMode)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshPrices}
            disabled={isRefreshingPrices}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-black/60 border border-[#2C2C2E] text-xs font-semibold text-zinc-200 hover:text-white active:scale-95 transition"
          >
            <RefreshCw
              className={`w-3.5 h-3.5 text-[#10B981] ${
                isRefreshingPrices ? 'animate-spin' : ''
              }`}
            />
            <span>Actualizar precios</span>
          </button>
        </div>

        {state.lastPriceUpdate && (
          <div className="text-[10px] text-zinc-500">
            Última actualización Yahoo Finance (EUR):{' '}
            {new Date(state.lastPriceUpdate).toLocaleTimeString('es-ES', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            })}
          </div>
        )}

        {/* Gráfico Interactivo General */}
        <TRChart
          series={portfolioSeries}
          range={portfolioRange}
          onRangeChange={setPortfolioRange}
          privacyMode={privacyMode}
          height={185}
          loading={portfolioChartLoading}
        />

        {/* Barra de distribución porcentual de la cartera */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400">
            <span>Distribución de Cartera</span>
            <span>
              Plan DCA Mensual:{' '}
              <strong className="text-[#6366F1]">
                {formatEUR(
                  state.assets.reduce(
                    (s, a) => s + Number(a.dcaMonthly || 0),
                    0
                  ),
                  privacyMode
                )}
              </strong>
            </span>
          </div>

          <div className="w-full h-2 rounded-full bg-zinc-800 overflow-hidden flex">
            {state.assets.map((asset, idx) => {
              const val = asset.shares * asset.priceEur;
              const weight =
                totalPortfolioEur > 0
                  ? (val / totalPortfolioEur) * 100
                  : (asset.dcaMonthly /
                      Math.max(
                        1,
                        state.assets.reduce((s, a) => s + a.dcaMonthly, 0)
                      )) *
                    100;
              return (
                <div
                  key={asset.id}
                  style={{
                    width: `${Math.max(0, weight)}%`,
                    backgroundColor: ASSET_COLORS[idx % ASSET_COLORS.length],
                  }}
                  className="h-full transition-all duration-300"
                  title={`${asset.name}: ${weight.toFixed(1)}%`}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* 2. Lista de Activos y Motor de Participaciones */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-sm font-semibold uppercase tracking-wider text-zinc-400">
              Posiciones y Plan DCA ({state.assets.length} activos)
            </h2>
            <p className="text-[11px] text-zinc-500">
              Toca cualquier activo para ver su gráfico, editar participaciones
              o comprar/vender
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewAssetName('');
              setNewAssetTicker('');
              setNewAssetDca('10');
              setIsAddingAsset(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 text-xs font-semibold text-[#6366F1] active:scale-95 transition"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir nuevo activo</span>
          </button>
        </div>

        <div className="space-y-2.5">
          {state.assets.map((asset, idx) => {
            const positionEur =
              Number(asset.shares || 0) * Number(asset.priceEur || 0);
            const profitEur = positionEur - Number(asset.costBasis || 0);
            const profitPct =
              asset.costBasis > 0 ? (profitEur / asset.costBasis) * 100 : 0;
            const isUp24h = (asset.change24h || 0) >= 0;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => openAssetDetail(asset)}
                className="w-full text-left rounded-2xl bg-[#1C1C1E] border border-[#2C2C2E] hover:border-zinc-600 p-4 transition active:scale-[0.99]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/10"
                      style={{
                        backgroundColor: `${
                          ASSET_COLORS[idx % ASSET_COLORS.length]
                        }25`,
                        color: ASSET_COLORS[idx % ASSET_COLORS.length],
                      }}
                    >
                      {asset.ticker.split('.')[0].slice(0, 4)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-bold text-white truncate">
                        {asset.name}
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5">
                        <span className="font-mono text-zinc-300">
                          {asset.ticker}
                        </span>
                        <span>•</span>
                        <span>
                          Mercado: {formatEUR(asset.priceEur, privacyMode)}
                        </span>
                        <span
                          className={`inline-flex items-center gap-0.5 font-semibold ${
                            isUp24h ? 'text-[#10B981]' : 'text-[#F43F5E]'
                          }`}
                        >
                          {isUp24h ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : (
                            <TrendingDown className="w-3 h-3" />
                          )}
                          {isUp24h ? '+' : ''}
                          {Number(asset.change24h || 0).toFixed(2)}%
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Valor actual de mi posición */}
                  <div className="text-right shrink-0">
                    <div className="text-base font-bold text-white">
                      {formatEUR(positionEur, privacyMode)}
                    </div>
                    <div
                      className={`text-[11px] font-semibold ${
                        profitEur >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                      }`}
                    >
                      {asset.shares > 0
                        ? `${formatSignedEUR(
                            profitEur,
                            privacyMode
                          )} (${profitPct >= 0 ? '+' : ''}${profitPct.toFixed(
                            1
                          )}%)`
                        : '0,00 € (0,0%)'}
                    </div>
                  </div>
                </div>

                {/* Fila inferior: Participaciones exactas y asignación DCA */}
                <div className="mt-3 pt-2.5 border-t border-[#2C2C2E]/80 flex items-center justify-between text-[11px] text-zinc-400">
                  <span>
                    Participaciones:{' '}
                    <strong className="text-zinc-200 font-mono">
                      {privacyMode
                        ? '••••'
                        : Number(asset.shares || 0).toFixed(6)}
                    </strong>
                  </span>
                  <span className="px-2 py-0.5 rounded-lg bg-[#6366F1]/15 text-[#6366F1] font-semibold">
                    DCA: {formatEUR(asset.dcaMonthly, privacyMode)}/mes
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet: Añadir Nuevo Activo */}
      <BottomSheet
        isOpen={isAddingAsset}
        onClose={() => setIsAddingAsset(false)}
        title="+ Añadir Nuevo Activo"
        subtitle="Introduce el ticker de Yahoo Finance (ej. AAPL, VWCE.DE, ETH-EUR)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (!newAssetName.trim() || !newAssetTicker.trim()) return;
            const dca = parseFloat(newAssetDca.replace(',', '.'));
            onAddAsset(
              newAssetName.trim(),
              newAssetTicker.trim().toUpperCase(),
              Number.isFinite(dca) ? dca : 0
            );
            setIsAddingAsset(false);
          }}
          className="space-y-4"
        >
          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Nombre del Activo
            </label>
            <input
              type="text"
              value={newAssetName}
              onChange={(e) => setNewAssetName(e.target.value)}
              placeholder="Ej. MSCI World EUR Acc"
              className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-sm text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Ticker en Yahoo Finance
            </label>
            <input
              type="text"
              value={newAssetTicker}
              onChange={(e) => setNewAssetTicker(e.target.value)}
              placeholder="Ej. EUNL.DE, BTC-EUR, NVDA..."
              className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-sm font-mono uppercase text-white"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Asignación DCA Mensual (€)
            </label>
            <input
              type="number"
              step="0.01"
              value={newAssetDca}
              onChange={(e) => setNewAssetDca(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-lg font-bold text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#6366F1] text-white font-bold text-sm"
          >
            Añadir a mi Cartera
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet Detallado de Activo (Gráfico + Edición Dual Sincronizada + Compra/Venta) */}
      <BottomSheet
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAssetId(null)}
        title={
          selectedAsset
            ? `${selectedAsset.name} (${selectedAsset.ticker})`
            : 'Detalle de Activo'
        }
        subtitle={
          selectedAsset
            ? `Cotización actual: ${formatEUR(selectedAsset.priceEur)} (${
                selectedAsset.change24h >= 0 ? '+' : ''
              }${selectedAsset.change24h.toFixed(2)}%)`
            : ''
        }
      >
        {selectedAsset && (
          <div className="space-y-5">
            {/* a) Gráfico Histórico Individual en Euros */}
            <div className="p-3 rounded-2xl bg-black/60 border border-[#2C2C2E]">
              <TRChart
                series={assetSeries}
                range={assetRange}
                onRangeChange={setAssetRange}
                privacyMode={privacyMode}
                height={155}
                loading={assetChartLoading}
              />
            </div>

            {/* c) Botones de Compra Manual y Venta con Retorno a Liquidez */}
            <div className="grid grid-cols-2 gap-2.5">
              <button
                type="button"
                onClick={() => {
                  setTradeMode(tradeMode === 'buy' ? 'none' : 'buy');
                  setTradeEurInput('');
                  setTradeSharesInput('');
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                  tradeMode === 'buy'
                    ? 'bg-[#10B981] text-black border-[#10B981]'
                    : 'bg-[#10B981]/15 text-[#10B981] border-[#10B981]/30'
                }`}
              >
                <ShoppingCart className="w-4 h-4" />
                <span>Comprar / Añadir</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setTradeMode(tradeMode === 'sell' ? 'none' : 'sell');
                  const fullVal = (
                    selectedAsset.shares * selectedAsset.priceEur
                  ).toFixed(2);
                  setTradeEurInput(fullVal);
                  setTradeSharesInput(selectedAsset.shares.toFixed(8));
                }}
                className={`py-3 px-3 rounded-2xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                  tradeMode === 'sell'
                    ? 'bg-[#F43F5E] text-white border-[#F43F5E]'
                    : 'bg-[#F43F5E]/15 text-[#F43F5E] border-[#F43F5E]/30'
                }`}
              >
                <ArrowUpRight className="w-4 h-4" />
                <span>Vender Activo</span>
              </button>
            </div>

            {/* Panel desplegable de Compra / Venta con impacto en Cuenta de Liquidez */}
            {tradeMode !== 'none' && (
              <form
                onSubmit={handleExecuteTrade}
                className={`p-4 rounded-2xl border space-y-3 ${
                  tradeMode === 'buy'
                    ? 'bg-[#10B981]/10 border-[#10B981]/40'
                    : 'bg-[#F43F5E]/10 border-[#F43F5E]/40'
                }`}
              >
                <div className="text-xs font-bold text-white">
                  {tradeMode === 'buy'
                    ? 'Registrar Compra (Descuenta de tu Liquidez)'
                    : 'Vender Posición (Suma el dinero a tu Liquidez)'}
                </div>

                <div>
                  <label className="block text-[11px] text-zinc-300 mb-1">
                    {tradeMode === 'buy'
                      ? 'Cuenta de donde sale el dinero:'
                      : 'Cuenta donde se ingresa la venta:'}
                  </label>
                  <select
                    value={tradeAccountId}
                    onChange={(e) => setTradeAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl bg-black border border-[#2C2C2E] text-xs text-white"
                  >
                    {state.accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatEUR(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[11px] text-zinc-300 mb-1">
                      Importe en Euros (€)
                    </label>
                    <input
                      type="number"
                      step="0.01"
                      value={tradeEurInput}
                      onChange={(e) => handleTradeEurChange(e.target.value)}
                      placeholder="0.00"
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-[#2C2C2E] text-sm font-bold text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-[11px] text-zinc-300 mb-1">
                      Participaciones
                    </label>
                    <input
                      type="number"
                      step="0.00000001"
                      value={tradeSharesInput}
                      onChange={(e) => handleTradeSharesChange(e.target.value)}
                      placeholder="0.00000000"
                      className="w-full px-3 py-2.5 rounded-xl bg-black border border-[#2C2C2E] text-sm font-mono text-white"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  className={`w-full py-3 rounded-xl text-xs font-bold ${
                    tradeMode === 'buy'
                      ? 'bg-[#10B981] text-black'
                      : 'bg-[#F43F5E] text-white'
                  }`}
                >
                  {tradeMode === 'buy'
                    ? 'Confirmar Compra y Descontar Saldo'
                    : 'Confirmar Venta y Abonar en Cuenta'}
                </button>
              </form>
            )}

            {/* b) Edición Dual Sincronizada de Posición */}
            <form
              onSubmit={handleSaveAssetDetails}
              className="p-4 rounded-2xl bg-black/50 border border-[#2C2C2E] space-y-3.5"
            >
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1]">
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  Edición Dual Sincronizada (Participaciones ⇄ Valor en €)
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Participaciones (`shares`, hasta 8 dec.)
                  </label>
                  <input
                    type="number"
                    step="0.00000001"
                    value={editSharesInput}
                    onChange={(e) => handleSharesInputChange(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-base font-mono font-bold text-white focus:border-[#6366F1] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Valor Actual en Euros (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editValueEurInput}
                    onChange={(e) => handleValueEurInputChange(e.target.value)}
                    className="w-full px-3.5 py-3 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-base font-bold text-[#10B981] focus:border-[#10B981] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Capital Invertido (`costBasis` €)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editCostBasisInput}
                    onChange={(e) => setEditCostBasisInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm font-semibold text-white"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    DCA Mensual (€)
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    value={editDcaInput}
                    onChange={(e) => setEditDcaInput(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-sm font-semibold text-[#6366F1]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Nombre Activo
                  </label>
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs text-white"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Ticker Yahoo
                  </label>
                  <input
                    type="text"
                    value={editTicker}
                    onChange={(e) => setEditTicker(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs font-mono uppercase text-white"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-2 pt-2">
                <button
                  type="submit"
                  className="w-full py-3.5 rounded-2xl bg-[#6366F1] text-white font-bold text-sm flex items-center justify-center gap-2"
                >
                  <Check className="w-4 h-4" />
                  <span>Guardar Posición y Configuración</span>
                </button>

                {!confirmDeleteAsset ? (
                  <button
                    type="button"
                    onClick={() => setConfirmDeleteAsset(true)}
                    className="w-full py-2.5 rounded-xl bg-[#F43F5E]/15 text-[#F43F5E] text-xs font-semibold flex items-center justify-center gap-1.5"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Eliminar Activo de la Cartera</span>
                  </button>
                ) : (
                  <div className="grid grid-cols-2 gap-2 pt-1">
                    <button
                      type="button"
                      onClick={() => setConfirmDeleteAsset(false)}
                      className="py-2 rounded-xl bg-zinc-800 text-xs text-zinc-300"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        onDeleteAsset(selectedAsset.id);
                        setSelectedAssetId(null);
                      }}
                      className="py-2 rounded-xl bg-[#F43F5E] text-xs font-bold text-white"
                    >
                      Confirmar Borrado
                    </button>
                  </div>
                )}
              </div>
            </form>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
