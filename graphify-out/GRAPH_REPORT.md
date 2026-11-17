# Graph Report - finanzapro  (2026-11-17)

## Corpus Check
- 31 files · ~22,427 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 199 nodes · 479 edges · 11 communities (9 shown, 2 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `1b5327ee`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- page.tsx
- isinResolver.ts
- MonthlyFlowBlock.tsx
- monthlyFlow.ts
- compilerOptions
- TabInversiones.tsx
- next
- README.md
- brain.md
- AGENTS.md

## God Nodes (most connected - your core abstractions)
1. `formatEUR()` - 20 edges
2. `FinanzaProApp()` - 17 edges
3. `AppState` - 17 edges
4. `compilerOptions` - 16 edges
5. `react` - 15 edges
6. `lucide-react` - 14 edges
7. `BottomSheet()` - 13 edges
8. `MonthlyFlowBlock()` - 12 edges
9. `getNormalizedMonthlyFlow()` - 11 edges
10. `getShortAccountName()` - 10 edges

## Surprising Connections (you probably didn't know these)
- `SettingsSheetProps` --references--> `AppState`  [EXTRACTED]
  components/SettingsSheet.tsx → lib/types.ts
- `TabInversionesProps` --references--> `AppState`  [EXTRACTED]
  components/TabInversiones.tsx → lib/types.ts
- `FinanzaProApp()` --calls--> `TabInversiones()`  [EXTRACTED]
  app/page.tsx → components/TabInversiones.tsx
- `FinanzaProApp()` --calls--> `applyDcaPlanToState()`  [EXTRACTED]
  app/page.tsx → lib/monthlyFlowEngine.ts
- `FinanzaProApp()` --calls--> `applySavingsTransferToState()`  [EXTRACTED]
  app/page.tsx → lib/monthlyFlowEngine.ts

## Import Cycles
- None detected.

## Communities (11 total, 2 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (41): eslintConfig, dependencies, clsx@^2.1.1, framer-motion@^14.10.1, lucide-react@^1.70.0, react@19.3.0, react-dom@19.3.0, recharts@^3.10.1 (+33 more)

### Community 1 - "page.tsx"
Cohesion: 0.14
Nodes (30): ActiveTab, FinanzaProApp(), HeaderScoreboard(), HeaderScoreboardProps, SettingsSheet(), SettingsSheetProps, TabPatrimonio(), TabPendientesFlujo() (+22 more)

### Community 2 - "isinResolver.ts"
Cohesion: 0.14
Nodes (21): buildFallbackSeries(), convertToEur(), GET(), getPeriodConfig(), yf, FALLBACK_PRICES_EUR, fetchFxRates(), fetchQuoteInEur() (+13 more)

### Community 3 - "MonthlyFlowBlock.tsx"
Cohesion: 0.25
Nodes (16): BottomSheet(), BottomSheetProps, MonthlyFlowBlockProps, MonthlyFlowScheduleSection(), MonthlyFlowScheduleSectionProps, MonthlyFlowSettingsModal(), MonthlyFlowSettingsModalProps, PostDcaAdjustForm() (+8 more)

### Community 4 - "monthlyFlow.ts"
Cohesion: 0.26
Nodes (19): AssetDcaDraft, DcaBreakdownEditor(), DcaBreakdownEditorProps, MonthlyFlowBlock(), MonthlyFlowSettingsForm(), findImaginAccount(), findTradeRepublicAccount(), getActiveMonthlyDcaTotal() (+11 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "TabInversiones.tsx"
Cohesion: 0.28
Nodes (11): ChartRange, ASSET_COLORS, CLIENT_PRIORITY_ISIN_MAP, TabInversiones(), TabInversionesProps, ChartPoint, RANGES, TRChart() (+3 more)

### Community 7 - "next"
Cohesion: 0.18
Nodes (5): metadata, viewport, nextConfig, next@16.4.5, next

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

## Knowledge Gaps
- **2 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `MonthlyFlowBlock.tsx` to `package.json`, `page.tsx`, `monthlyFlow.ts`, `TabInversiones.tsx`?**
  _High betweenness centrality (0.123) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `MonthlyFlowBlock.tsx` to `package.json`, `page.tsx`, `monthlyFlow.ts`, `TabInversiones.tsx`?**
  _High betweenness centrality (0.113) - this node is a cross-community bridge._
- **Should `page.tsx` be split into smaller, more focused modules?**
  _Cohesion score 0.14126984126984127 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `package.json`, `isinResolver.ts`?**
  _High betweenness centrality (0.108) - this node is a cross-community bridge._
- **Should `isinResolver.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._