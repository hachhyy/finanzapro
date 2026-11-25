# Graph Report - finanzapro  (2026-11-25)

## Corpus Check
- 32 files · ~22,694 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 201 nodes · 480 edges · 12 communities (9 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `cd68352e`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- page.tsx
- isinResolver.ts
- react
- monthlyFlow.ts
- compilerOptions
- TabInversiones.tsx
- next
- README.md
- brain.md
- AGENTS.md
- bootstrap.sh

## God Nodes (most connected - your core abstractions)
1. `formatEUR()` - 20 edges
2. `AppState` - 17 edges
3. `FinanzaProApp()` - 17 edges
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
- `PostDcaModalProps` --references--> `PostDcaSummaryItem`  [EXTRACTED]
  components/PostDcaModal.tsx → lib/types.ts
- `TabInversionesProps` --references--> `AppState`  [EXTRACTED]
  components/TabInversiones.tsx → lib/types.ts
- `TabPendientesFlujoProps` --references--> `AppState`  [EXTRACTED]
  components/TabPendientesFlujo.tsx → lib/types.ts
- `FinanzaProApp()` --calls--> `SettingsSheet()`  [EXTRACTED]
  app/page.tsx → components/SettingsSheet.tsx

## Import Cycles
- None detected.

## Communities (12 total, 3 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.06
Nodes (41): eslintConfig, dependencies, clsx@^2.1.1, framer-motion@^14.10.1, lucide-react@^1.70.0, react@19.3.0, react-dom@19.3.0, recharts@^3.10.1 (+33 more)

### Community 1 - "page.tsx"
Cohesion: 0.17
Nodes (26): ActiveTab, FinanzaProApp(), HeaderScoreboard(), TabPatrimonio(), TabPendientesFlujo(), TabPendientesFlujoProps, getMonthKeyFromIso(), applyDailyAutoAccrual() (+18 more)

### Community 2 - "isinResolver.ts"
Cohesion: 0.14
Nodes (21): buildFallbackSeries(), convertToEur(), GET(), getPeriodConfig(), yf, FALLBACK_PRICES_EUR, fetchFxRates(), fetchQuoteInEur() (+13 more)

### Community 3 - "react"
Cohesion: 0.21
Nodes (12): BottomSheet(), BottomSheetProps, HeaderScoreboardProps, MonthlyFlowScheduleSectionProps, PostDcaAdjustForm(), PostDcaModal(), PostDcaModalProps, SettingsSheet() (+4 more)

### Community 4 - "monthlyFlow.ts"
Cohesion: 0.20
Nodes (27): AssetDcaDraft, DcaBreakdownEditor(), DcaBreakdownEditorProps, MonthlyFlowBlock(), MonthlyFlowBlockProps, MonthlyFlowScheduleSection(), MonthlyFlowSettingsForm(), MonthlyFlowSettingsModal() (+19 more)

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
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `react` connect `react` to `package.json`, `page.tsx`, `monthlyFlow.ts`, `TabInversiones.tsx`?**
  _High betweenness centrality (0.120) - this node is a cross-community bridge._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.06312292358803986 - nodes in this community are weakly interconnected._
- **Why does `lucide-react` connect `react` to `package.json`, `page.tsx`, `monthlyFlow.ts`, `TabInversiones.tsx`?**
  _High betweenness centrality (0.111) - this node is a cross-community bridge._
- **Should `isinResolver.ts` be split into smaller, more focused modules?**
  _Cohesion score 0.13768115942028986 - nodes in this community are weakly interconnected._
- **Why does `next` connect `next` to `package.json`, `isinResolver.ts`?**
  _High betweenness centrality (0.105) - this node is a cross-community bridge._
- **Should `compilerOptions` be split into smaller, more focused modules?**
  _Cohesion score 0.10526315789473684 - nodes in this community are weakly interconnected._