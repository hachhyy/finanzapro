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
  Search,
  Loader2,
} from 'lucide-react';
import {
  AppState,
  InvestmentAsset,
  DEFAULT_ASSETS,
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
  onAddAsset: (params: {
    isin: string;
    name: string;
    resolvedTicker: string;
    priceEur: number;
    change24h?: number;
    dcaMonthly: number;
    shares?: number;
    costBasis?: number;
  }) => void;
  onUpdateAssetPosition: (params: {
    assetId: string;
    name: string;
    isin?: string;
    ticker: string;
    resolvedTicker?: string;
    priceEur?: number;
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

/**
 * Diccionario cliente instantáneo para autocompletar sin latencia los 6 ISIN del catálogo Trade Republic
 */
const CLIENT_PRIORITY_ISIN_MAP: Record<
  string,
  { isin: string; resolvedTicker: string; name: string; defaultPriceEur: number }
> = {
  IE00B5BMR087: {
    isin: 'IE00B5BMR087',
    resolvedTicker: 'SXR8.DE',
    name: 'Core S&P 500 USD (Acc)',
    defaultPriceEur: 733.22,
  },
  IE00B43HR379: {
    isin: 'IE00B43HR379',
    resolvedTicker: 'QDVG.DE',
    name: 'S&P 500 Health Care Sector',
    defaultPriceEur: 13.92,
  },
  IE00BG0J4C88: {
    isin: 'IE00BG0J4C88',
    resolvedTicker: 'L0CK.DE',
    name: 'Digital Security USD (Acc)',
    defaultPriceEur: 11.25,
  },
  IE00B4NCWG09: {
    isin: 'IE00B4NCWG09',
    resolvedTicker: '4RT8.DE',
    name: 'Physical Silver ETC',
    defaultPriceEur: 41.3,
  },
  IE00BKM4GZ66: {
    isin: 'IE00BKM4GZ66',
    resolvedTicker: 'IS3N.DE',
    name: 'Core MSCI EM IMI USD (Acc)',
    defaultPriceEur: 44.32,
  },
  IE00BMC38736: {
    isin: 'IE00BMC38736',
    resolvedTicker: 'VVSM.DE',
    name: 'Semiconductor USD (Acc)',
    defaultPriceEur: 79.89,
  },
  IE00B4ND3602: {
    isin: 'IE00B4ND3602',
    resolvedTicker: 'PPFB.DE',
    name: 'Physical Gold USD Acc',
    defaultPriceEur: 70.64,
  },
};

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
  const [portfolioHoverPoint, setPortfolioHoverPoint] =
    useState<ChartPoint | null>(null);

  // Fase 3: Alta rápida en 1 paso por ISIN / Código
  const [isAddingAsset, setIsAddingAsset] = useState(false);
  const [newAssetCode, setNewAssetCode] = useState('');
  const [newAssetName, setNewAssetName] = useState('');
  const [newAssetResolvedTicker, setNewAssetResolvedTicker] = useState('');
  const [newAssetLivePrice, setNewAssetLivePrice] = useState<number>(0);
  const [newAssetChange24h, setNewAssetChange24h] = useState<number>(0);
  const [isResolvingNewCode, setIsResolvingNewCode] = useState(false);
  const [newAssetInitialEur, setNewAssetInitialEur] = useState('');
  const [newAssetInitialShares, setNewAssetInitialShares] = useState('');
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

  // Dual Synchronized Editing States inside Asset Sheet (Fase 3 & 4)
  const [editName, setEditName] = useState('');
  const [editCodeInput, setEditCodeInput] = useState('');
  const [editResolvedTicker, setEditResolvedTicker] = useState('');
  const [editLivePriceEur, setEditLivePriceEur] = useState<number>(0);
  const [isResolvingEditCode, setIsResolvingEditCode] = useState(false);
  const [editSharesInput, setEditSharesInput] = useState('');
  const [editValueEurInput, setEditValueEurInput] = useState('');
  const [editCostBasisInput, setEditCostBasisInput] = useState('');
  const [editDcaInput, setEditDcaInput] = useState('');
  const [lastEditedDualField, setLastEditedDualField] = useState<
    'shares' | 'eur' | null
  >(null);

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
        const primaryAsset = activeAssets[0] || state.assets[0];
        const primaryTicker =
          primaryAsset?.isin ||
          primaryAsset?.resolvedTicker ||
          primaryAsset?.ticker ||
          'IE00B5BMR087';
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
        const codeForChart =
          asset.isin || asset.resolvedTicker || asset.ticker;
        const res = await fetch(
          `/api/chart?ticker=${encodeURIComponent(
            codeForChart
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

  // ====================================================================
  // FASE 1 & 3: Resolución automática ISIN / Código en Alta Rápida
  // ====================================================================
  useEffect(() => {
    if (!isAddingAsset) return;
    const clean = newAssetCode.trim().toUpperCase();
    if (clean.length < 2) {
      setNewAssetName('');
      setNewAssetResolvedTicker('');
      setNewAssetLivePrice(0);
      return;
    }

    // 1. Coincidencia instantánea en diccionario maestro prioritario
    const staticMatch = CLIENT_PRIORITY_ISIN_MAP[clean];
    if (staticMatch) {
      setNewAssetName(staticMatch.name);
      setNewAssetResolvedTicker(staticMatch.resolvedTicker);
      setNewAssetLivePrice(staticMatch.defaultPriceEur);
    }

    // 2. Consulta en vivo a /api/prices?resolve={clean} para precio exacto en EUR o nuevos ISINs
    let cancelled = false;
    setIsResolvingNewCode(true);
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/prices?resolve=${encodeURIComponent(clean)}`
        );
        const data = await res.json();
        if (!cancelled && data?.resolved) {
          setNewAssetName(data.resolved.name || clean);
          setNewAssetResolvedTicker(data.resolved.resolvedTicker || clean);
          const livePrice = Number(data.resolved.priceEur || 0);
          if (livePrice > 0) {
            setNewAssetLivePrice(livePrice);
            setNewAssetChange24h(Number(data.resolved.change24h || 0));
            // Si el usuario ya había escrito un importe en EUR, recalcular participaciones con 8 decimales
            setNewAssetInitialEur((currEur) => {
              const parsedEur = parseFloat(currEur.replace(',', '.'));
              if (Number.isFinite(parsedEur) && parsedEur > 0) {
                const sh = Number((parsedEur / livePrice).toFixed(8));
                setNewAssetInitialShares(String(sh));
              }
              return currEur;
            });
          }
        }
      } catch {
        // fallback al diccionario local
      } finally {
        if (!cancelled) setIsResolvingNewCode(false);
      }
    }, 220);

    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [newAssetCode, isAddingAsset]);

  const handleNewAssetInitialEurChange = (val: string) => {
    setNewAssetInitialEur(val);
    const parsedEur = parseFloat(val.replace(',', '.'));
    if (
      Number.isFinite(parsedEur) &&
      parsedEur >= 0 &&
      newAssetLivePrice > 0
    ) {
      const shares = Number((parsedEur / newAssetLivePrice).toFixed(8));
      setNewAssetInitialShares(shares > 0 ? String(shares) : '');
    } else {
      setNewAssetInitialShares('');
    }
  };

  const handleNewAssetInitialSharesChange = (val: string) => {
    setNewAssetInitialShares(val);
    const parsedShares = parseFloat(val.replace(',', '.'));
    if (
      Number.isFinite(parsedShares) &&
      parsedShares >= 0 &&
      newAssetLivePrice > 0
    ) {
      const currentValueEur = Number(
        (parsedShares * newAssetLivePrice).toFixed(2)
      );
      setNewAssetInitialEur(
        currentValueEur > 0 ? currentValueEur.toFixed(2) : ''
      );
    } else {
      setNewAssetInitialEur('');
    }
  };

  // ====================================================================
  // FASE 3 & 4: Modal de Edición Dual Sincronizada (8 Decimales Exactos)
  // ====================================================================
  const openAssetDetail = (asset: InvestmentAsset) => {
    setSelectedAssetId(asset.id);
    setEditName(asset.name);
    setEditCodeInput(asset.isin || asset.ticker);
    setEditResolvedTicker(asset.resolvedTicker || asset.ticker);
    const livePrice = Number(asset.priceEur || 0);
    setEditLivePriceEur(livePrice);
    setLastEditedDualField(null);

    const exactShares = Number(Number(asset.shares || 0).toFixed(8));
    const currentValueEur = Number((exactShares * livePrice).toFixed(2));

    setEditSharesInput(exactShares > 0 ? String(exactShares) : '0');
    setEditValueEurInput(currentValueEur.toFixed(2));
    setEditCostBasisInput(Number(asset.costBasis || 0).toFixed(2));
    setEditDcaInput(Number(asset.dcaMonthly || 0).toFixed(2));
    setTradeMode('none');

    const trAcc =
      state.accounts.find((a) => a.isTradeRepublic)?.id ||
      state.accounts[0]?.id ||
      '';
    setTradeAccountId(trAcc);
    setAssetRange('1M');
    loadAssetChart(asset, '1M');
  };

  // Si el precio en vivo del activo seleccionado se actualiza desde Yahoo Finance mientras el modal está abierto:
  useEffect(() => {
    if (!selectedAsset) return;
    const latestPrice = Number(selectedAsset.priceEur || 0);
    if (latestPrice > 0 && latestPrice !== editLivePriceEur) {
      setEditLivePriceEur(latestPrice);
      if (lastEditedDualField === 'eur') {
        const currentValueEur = parseFloat(editValueEurInput.replace(',', '.'));
        if (Number.isFinite(currentValueEur) && currentValueEur >= 0) {
          const shares = Number((currentValueEur / latestPrice).toFixed(8));
          setEditSharesInput(String(shares));
        }
      } else {
        const shares = parseFloat(editSharesInput.replace(',', '.'));
        if (Number.isFinite(shares) && shares >= 0) {
          const currentValueEur = Number((shares * latestPrice).toFixed(2));
          setEditValueEurInput(currentValueEur.toFixed(2));
        }
      }
    }
  }, [
    selectedAsset,
    editLivePriceEur,
    lastEditedDualField,
    editValueEurInput,
    editSharesInput,
  ]);

  useEffect(() => {
    if (selectedAsset) {
      loadAssetChart(selectedAsset, assetRange);
    }
  }, [selectedAsset, assetRange, loadAssetChart]);

  // Si el usuario edita el Código ISIN / Ticker dentro del modal de Edición Dual:
  const handleEditCodeInputChange = async (newCodeRaw: string) => {
    setEditCodeInput(newCodeRaw);
    const clean = newCodeRaw.trim().toUpperCase();
    if (clean.length < 2) return;

    const staticMatch = CLIENT_PRIORITY_ISIN_MAP[clean];
    if (staticMatch) {
      setEditName(staticMatch.name);
      setEditResolvedTicker(staticMatch.resolvedTicker);
      setEditLivePriceEur(staticMatch.defaultPriceEur);
      const parsedEur = parseFloat(editValueEurInput.replace(',', '.'));
      if (Number.isFinite(parsedEur) && parsedEur > 0) {
        const sh = Number(
          (parsedEur / staticMatch.defaultPriceEur).toFixed(8)
        );
        setEditSharesInput(String(sh));
      }
    }

    setIsResolvingEditCode(true);
    try {
      const res = await fetch(
        `/api/prices?resolve=${encodeURIComponent(clean)}`
      );
      const data = await res.json();
      if (data?.resolved) {
        setEditName(data.resolved.name || editName);
        setEditResolvedTicker(data.resolved.resolvedTicker || clean);
        const livePriceEur = Number(data.resolved.priceEur || 0);
        if (livePriceEur > 0) {
          setEditLivePriceEur(livePriceEur);
          const parsedEur = parseFloat(editValueEurInput.replace(',', '.'));
          if (Number.isFinite(parsedEur) && parsedEur >= 0) {
            const shares = Number((parsedEur / livePriceEur).toFixed(8));
            setEditSharesInput(String(shares));
          }
        }
      }
    } catch {
      // ignore network error
    } finally {
      setIsResolvingEditCode(false);
    }
  };

  // Fase 4: Verificación Matemática de la Edición Dual (8 Decimales)
  // shares = Number((currentValueEur / livePriceEur).toFixed(8))
  // currentValueEur = Number((shares * livePriceEur).toFixed(2))
  const handleSharesInputChange = (val: string) => {
    setLastEditedDualField('shares');
    setEditSharesInput(val);
    if (!selectedAsset) return;
    const livePriceEur = editLivePriceEur || selectedAsset.priceEur || 0;
    const shares = parseFloat(val.replace(',', '.'));
    if (Number.isFinite(shares) && shares >= 0 && livePriceEur > 0) {
      const currentValueEur = Number((shares * livePriceEur).toFixed(2));
      setEditValueEurInput(currentValueEur.toFixed(2));
    } else {
      setEditValueEurInput('0.00');
    }
  };

  const handleValueEurInputChange = (val: string) => {
    setLastEditedDualField('eur');
    setEditValueEurInput(val);
    if (!selectedAsset) return;
    const livePriceEur = editLivePriceEur || selectedAsset.priceEur || 0;
    const currentValueEur = parseFloat(val.replace(',', '.'));
    if (
      Number.isFinite(currentValueEur) &&
      currentValueEur >= 0 &&
      livePriceEur > 0
    ) {
      const shares = Number((currentValueEur / livePriceEur).toFixed(8));
      setEditSharesInput(String(shares));
    } else {
      setEditSharesInput('0');
    }
  };

  const handleSaveAssetDetails = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedAsset) return;
    const parsedShares = parseFloat(editSharesInput.replace(',', '.'));
    const parsedCostBasis = parseFloat(editCostBasisInput.replace(',', '.'));
    const parsedDca = parseFloat(editDcaInput.replace(',', '.'));
    const cleanCode =
      editCodeInput.trim().toUpperCase() ||
      selectedAsset.isin ||
      selectedAsset.ticker;
    const cleanResolved =
      editResolvedTicker.trim().toUpperCase() ||
      selectedAsset.resolvedTicker ||
      selectedAsset.ticker;

    onUpdateAssetPosition({
      assetId: selectedAsset.id,
      name: editName.trim() || selectedAsset.name,
      isin: cleanCode,
      ticker: cleanResolved,
      resolvedTicker: cleanResolved,
      priceEur:
        editLivePriceEur > 0 ? editLivePriceEur : selectedAsset.priceEur,
      shares: Number.isFinite(parsedShares)
        ? Number(parsedShares.toFixed(8))
        : 0,
      costBasis: Number.isFinite(parsedCostBasis)
        ? Number(parsedCostBasis.toFixed(2))
        : 0,
      dcaMonthly: Number.isFinite(parsedDca)
        ? Number(parsedDca.toFixed(2))
        : 0,
    });
    setSelectedAssetId(null);
  };

  // Trade Buy/Sell Dual Synchronization
  const handleTradeEurChange = (val: string) => {
    setTradeEurInput(val);
    if (!selectedAsset) return;
    const eur = parseFloat(val.replace(',', '.'));
    const livePriceEur = editLivePriceEur || selectedAsset.priceEur || 1;
    if (Number.isFinite(eur) && eur > 0 && livePriceEur > 0) {
      const shares = Number((eur / livePriceEur).toFixed(8));
      setTradeSharesInput(String(shares));
    } else {
      setTradeSharesInput('0');
    }
  };

  const handleTradeSharesChange = (val: string) => {
    setTradeSharesInput(val);
    if (!selectedAsset) return;
    const sh = parseFloat(val.replace(',', '.'));
    const livePriceEur = editLivePriceEur || selectedAsset.priceEur || 0;
    if (Number.isFinite(sh) && sh > 0) {
      const currentValueEur = Number((sh * livePriceEur).toFixed(2));
      setTradeEurInput(currentValueEur.toFixed(2));
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
      <div className="rounded-2xl bg-[#121214] border border-white/[0.07] p-4 space-y-4">
        <div className="flex items-start justify-between gap-2">
          <div>
            <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-400">
              Valor Total Cartera Trade Republic
            </div>
            <div className="text-3xl font-extrabold tracking-[-0.03em] text-white mt-0.5 tabular-nums">
              {formatEUR(
                portfolioHoverPoint
                  ? portfolioHoverPoint.priceEur
                  : totalPortfolioEur,
                privacyMode
              )}
            </div>

            <div className="flex items-center gap-2 mt-1.5 text-xs tabular-nums">
              <span
                className={`font-bold ${
                  totalReturnEur >= 0 ? 'text-[#10B981]' : 'text-[#F43F5E]'
                }`}
              >
                {formatSignedEUR(totalReturnEur, privacyMode)} (
                {totalReturnPct >= 0 ? '+' : ''}
                {totalReturnPct.toFixed(2)}%)
              </span>
              <span className="text-zinc-600">•</span>
              <span className="text-zinc-400">
                Invertido: {formatEUR(totalCostBasis, privacyMode)}
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={onRefreshPrices}
            disabled={isRefreshingPrices}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-white/[0.04] border border-white/[0.08] text-xs font-semibold text-zinc-200 hover:text-white active:scale-[0.97] transition"
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
          <div className="text-[10px] text-zinc-500 tabular-nums">
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
          onScrubPoint={setPortfolioHoverPoint}
        />

        {/* Barra de distribución porcentual de la cartera */}
        <div className="pt-2 space-y-2">
          <div className="flex items-center justify-between text-[11px] text-zinc-400 tabular-nums">
            <span>Distribución de Cartera</span>
            <span>
              Plan DCA Mensual:{' '}
              <strong className="text-[#6366F1]">
                {formatEUR(
                  state.assets.reduce(
                    (s, a) =>
                      a.dcaEnabled !== false ? s + Number(a.dcaMonthly || 0) : s,
                    0
                  ),
                  privacyMode
                )}
              </strong>
            </span>
          </div>

          <div className="w-full h-1.5 rounded-full bg-white/[0.06] overflow-hidden flex gap-[1px]">
            {state.assets.map((asset, idx) => {
              const val = asset.shares * asset.priceEur;
              const activeDca = asset.dcaEnabled !== false ? asset.dcaMonthly : 0;
              const weight =
                totalPortfolioEur > 0
                  ? (val / totalPortfolioEur) * 100
                  : (activeDca /
                      Math.max(
                        1,
                        state.assets.reduce(
                          (s, a) =>
                            a.dcaEnabled !== false ? s + a.dcaMonthly : s,
                          0
                        )
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

      {/* 2. Lista de Activos y Motor de Participaciones por ISIN */}
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div>
            <h2 className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
              Posiciones y Plan DCA ({state.assets.length} activos)
            </h2>
            <p className="text-[11px] text-zinc-500">
              Motor ISIN ➔ EUR activo. Toca cualquier activo para editar o operar
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setNewAssetCode('');
              setNewAssetName('');
              setNewAssetResolvedTicker('');
              setNewAssetLivePrice(0);
              setNewAssetChange24h(0);
              setNewAssetInitialEur('');
              setNewAssetInitialShares('');
              setNewAssetDca('10');
              setIsAddingAsset(true);
            }}
            className="inline-flex items-center gap-1 px-3 py-2 rounded-xl bg-[#6366F1]/15 border border-[#6366F1]/30 text-xs font-semibold text-[#6366F1] active:scale-[0.97] transition shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>+ Añadir por ISIN / Código</span>
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
            const displayTicker = asset.resolvedTicker || asset.ticker;
            const displayIsin =
              asset.isin && asset.isin !== displayTicker ? asset.isin : null;

            return (
              <button
                key={asset.id}
                type="button"
                onClick={() => openAssetDetail(asset)}
                className="w-full text-left rounded-2xl bg-[#121214] border border-white/[0.07] hover:border-white/[0.15] p-4 transition active:scale-[0.985]"
              >
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold text-white shrink-0 border border-white/[0.08]"
                      style={{
                        backgroundColor: `${
                          ASSET_COLORS[idx % ASSET_COLORS.length]
                        }20`,
                        color: ASSET_COLORS[idx % ASSET_COLORS.length],
                      }}
                    >
                      {displayTicker.split('.')[0].slice(0, 4)}
                    </div>

                    <div className="min-w-0">
                      <div className="text-sm font-semibold text-white truncate tracking-[-0.01em]">
                        {asset.name}
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-zinc-400 mt-0.5 tabular-nums">
                        {displayIsin && (
                          <span className="px-1.5 py-0.5 rounded bg-white/[0.04] border border-white/[0.07] font-mono text-[10px] text-zinc-300">
                            {displayIsin}
                          </span>
                        )}
                        <span className="font-mono text-zinc-300">
                          {displayTicker}
                        </span>
                        <span className="text-zinc-600">•</span>
                        <span>
                          {formatEUR(asset.priceEur, privacyMode)}
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
                  <div className="text-right shrink-0 tabular-nums">
                    <div className="text-base font-bold text-white tracking-tight">
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
                <div className="mt-3 pt-2.5 border-t border-white/[0.06] flex items-center justify-between text-[11px] text-zinc-400 tabular-nums">
                  <span>
                    Participaciones:{' '}
                    <strong className="text-zinc-200 font-mono">
                      {privacyMode
                        ? '••••'
                        : Number(asset.shares || 0).toFixed(6)}
                    </strong>
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-lg font-semibold ${
                      asset.dcaEnabled !== false
                        ? 'bg-[#6366F1]/15 text-[#6366F1]'
                        : 'bg-white/[0.05] text-zinc-500 line-through'
                    }`}
                  >
                    DCA: {formatEUR(asset.dcaMonthly, privacyMode)}/mes
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Bottom Sheet Fase 3: + Añadir por ISIN / Código en 1 Paso */}
      <BottomSheet
        isOpen={isAddingAsset}
        onClose={() => setIsAddingAsset(false)}
        title="+ Añadir por ISIN / Código"
        subtitle="Pega el código ISIN de Trade Republic (ej. IE00BKM4GZ66) y se autocompletará su nombre, ticker en EUR y cotización actual"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            const cleanCode = newAssetCode.trim().toUpperCase();
            if (!cleanCode) return;

            const resolvedTicker =
              newAssetResolvedTicker.trim().toUpperCase() || cleanCode;
            const resolvedName = newAssetName.trim() || cleanCode;
            const priceEur = newAssetLivePrice > 0 ? newAssetLivePrice : 50;
            const dca = parseFloat(newAssetDca.replace(',', '.'));
            const initShares = parseFloat(
              newAssetInitialShares.replace(',', '.')
            );
            const initEur = parseFloat(newAssetInitialEur.replace(',', '.'));

            onAddAsset({
              isin: cleanCode,
              name: resolvedName,
              resolvedTicker,
              priceEur,
              change24h: newAssetChange24h,
              dcaMonthly: Number.isFinite(dca) ? dca : 0,
              shares:
                Number.isFinite(initShares) && initShares > 0
                  ? Number(initShares.toFixed(8))
                  : 0,
              costBasis:
                Number.isFinite(initEur) && initEur > 0
                  ? Number(initEur.toFixed(2))
                  : 0,
            });
            setIsAddingAsset(false);
          }}
          className="space-y-4"
        >
          {/* Selector rápido del catálogo Trade Republic por si desea añadir alguno con 1 toque */}
          <div className="space-y-1.5">
            <span className="block text-[11px] font-medium text-zinc-400">
              Catálogo Rápido Trade Republic (toca para autocompletar):
            </span>
            <div className="flex flex-wrap gap-1.5">
              {DEFAULT_ASSETS.map((item) => (
                <button
                  key={item.isin}
                  type="button"
                  onClick={() => setNewAssetCode(item.isin || item.ticker)}
                  className={`px-2.5 py-1 rounded-lg text-[11px] font-mono border transition ${
                    newAssetCode.trim().toUpperCase() === item.isin
                      ? 'bg-[#6366F1] text-white border-[#6366F1]'
                      : 'bg-black/60 text-zinc-300 border-[#2C2C2E] hover:border-zinc-500'
                  }`}
                >
                  {item.isin} · {item.name.slice(0, 18)}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-300 mb-1">
              Código ISIN (o Ticker)
            </label>
            <div className="relative">
              <input
                type="text"
                value={newAssetCode}
                onChange={(e) => setNewAssetCode(e.target.value.toUpperCase())}
                placeholder="Ej. IE00BKM4GZ66, IE00B5BMR087, BTC-EUR..."
                className="w-full pl-10 pr-10 py-3.5 rounded-2xl bg-black border border-[#2C2C2E] text-sm font-mono uppercase text-white focus:border-[#6366F1] focus:outline-none"
                required
              />
              <Search className="w-4 h-4 text-zinc-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
              {isResolvingNewCode && (
                <Loader2 className="w-4 h-4 text-[#6366F1] animate-spin absolute right-3.5 top-1/2 -translate-y-1/2" />
              )}
            </div>
          </div>

          {/* Tarjeta de previsualización en tiempo real al resolver el ISIN */}
          {newAssetCode.trim().length >= 2 && (
            <div className="p-3.5 rounded-2xl bg-[#10B981]/10 border border-[#10B981]/30 space-y-2">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[11px] font-semibold uppercase tracking-wider text-[#10B981]">
                  Activo Detectado en Euros
                </span>
                {newAssetResolvedTicker && (
                  <span className="px-2 py-0.5 rounded-md bg-black/60 font-mono text-xs font-bold text-white border border-white/10">
                    Ticker: {newAssetResolvedTicker}
                  </span>
                )}
              </div>

              <div>
                <label className="block text-[11px] text-zinc-400 mb-1">
                  Nombre del Activo (autocompletado, editable)
                </label>
                <input
                  type="text"
                  value={newAssetName}
                  onChange={(e) => setNewAssetName(e.target.value)}
                  placeholder="Resolviendo nombre del activo..."
                  className="w-full px-3 py-2 rounded-xl bg-black/80 border border-[#2C2C2E] text-xs font-semibold text-white"
                />
              </div>

              <div className="flex items-center justify-between text-xs pt-1">
                <span className="text-zinc-400">Cotización actual (EUR):</span>
                <span className="font-bold text-white font-mono">
                  {newAssetLivePrice > 0
                    ? formatEUR(newAssetLivePrice)
                    : 'Consultando...'}
                </span>
              </div>
            </div>
          )}

          {/* Campos opcionales: Importe inicial en € o Participaciones iniciales (Sincronizados a 8 decimales) */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Importe Inicial (€, opcional)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={newAssetInitialEur}
                onChange={(e) => handleNewAssetInitialEurChange(e.target.value)}
                placeholder="0,00"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-[#2C2C2E] text-sm font-bold text-[#10B981]"
              />
            </div>
            <div>
              <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                Participaciones (opcional)
              </label>
              <input
                type="text"
                inputMode="decimal"
                value={newAssetInitialShares}
                onChange={(e) =>
                  handleNewAssetInitialSharesChange(e.target.value)
                }
                placeholder="0.00000000"
                className="w-full px-3.5 py-2.5 rounded-xl bg-black border border-[#2C2C2E] text-sm font-mono text-white"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-zinc-400 mb-1">
              Asignación DCA Mensual (€)
            </label>
            <input
              type="text"
              inputMode="decimal"
              value={newAssetDca}
              onChange={(e) => setNewAssetDca(e.target.value)}
              className="w-full px-4 py-3 rounded-2xl bg-black border border-[#2C2C2E] text-base font-bold text-white"
            />
          </div>

          <button
            type="submit"
            className="w-full py-3.5 rounded-2xl bg-[#6366F1] text-white font-bold text-sm"
          >
            Añadir Activo a mi Cartera
          </button>
        </form>
      </BottomSheet>

      {/* Bottom Sheet Detallado de Activo (Gráfico + Edición Dual Sincronizada + Compra/Venta) */}
      <BottomSheet
        isOpen={!!selectedAsset}
        onClose={() => setSelectedAssetId(null)}
        title={
          selectedAsset
            ? `${selectedAsset.name} (${
                selectedAsset.isin || selectedAsset.ticker
              })`
            : 'Detalle de Activo'
        }
        subtitle={
          selectedAsset
            ? `Ticker EUR: ${
                editResolvedTicker ||
                selectedAsset.resolvedTicker ||
                selectedAsset.ticker
              } • Cotización: ${formatEUR(
                editLivePriceEur || selectedAsset.priceEur
              )} (${selectedAsset.change24h >= 0 ? '+' : ''}${Number(
                selectedAsset.change24h || 0
              ).toFixed(2)}%)`
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
                  const price = editLivePriceEur || selectedAsset.priceEur;
                  const fullVal = Number(
                    (selectedAsset.shares * price).toFixed(2)
                  );
                  setTradeEurInput(fullVal.toFixed(2));
                  setTradeSharesInput(
                    String(Number(selectedAsset.shares.toFixed(8)))
                  );
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
                      type="text"
                      inputMode="decimal"
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
                      type="text"
                      inputMode="decimal"
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

            {/* b) Edición Dual Sincronizada de Posición (Fase 3 y Fase 4) */}
            <form
              onSubmit={handleSaveAssetDetails}
              className="p-4 rounded-2xl bg-black/50 border border-[#2C2C2E] space-y-3.5"
            >
              <div className="flex items-center justify-between gap-1.5">
                <div className="flex items-center gap-1.5 text-xs font-bold text-[#6366F1]">
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>
                    Edición Dual Sincronizada (Participaciones ⇄ Valor en €)
                  </span>
                </div>
                <span className="text-[10px] font-mono text-zinc-400">
                  1 part. ={' '}
                  {formatEUR(editLivePriceEur || selectedAsset.priceEur)}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-[11px] font-medium text-zinc-400 mb-1">
                    Participaciones (`shares`, 8 dec.)
                  </label>
                  <input
                    type="text"
                    inputMode="decimal"
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
                    type="text"
                    inputMode="decimal"
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
                    type="text"
                    inputMode="decimal"
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
                    type="text"
                    inputMode="decimal"
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
                    Código ISIN / Ticker
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={editCodeInput}
                      onChange={(e) => handleEditCodeInputChange(e.target.value)}
                      className="w-full px-3 py-2 rounded-xl bg-[#1C1C1E] border border-[#2C2C2E] text-xs font-mono uppercase text-white"
                    />
                    {isResolvingEditCode && (
                      <Loader2 className="w-3.5 h-3.5 text-[#6366F1] animate-spin absolute right-2.5 top-1/2 -translate-y-1/2" />
                    )}
                  </div>
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

                <button
                  type="button"
                  onClick={() => {
                    onDeleteAsset(selectedAsset.id);
                    setSelectedAssetId(null);
                  }}
                  className="w-full py-2.5 rounded-xl bg-[#F43F5E]/15 hover:bg-[#F43F5E]/25 text-[#F43F5E] text-xs font-semibold flex items-center justify-center gap-1.5 transition active:scale-95"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Eliminar Activo de la Cartera</span>
                </button>
              </div>
            </form>
          </div>
        )}
      </BottomSheet>
    </div>
  );
}
