# Graph Report - finanzapro  (2026-11-26)

## Corpus Check
- 32 files · ~23,825 words
- Verdict: corpus is large enough that graph structure adds value.
- Unclassified: 3 file(s) not represented in the graph (top: (none) 1, .ico 1, .css 1)

## Summary
- 2765 nodes · 5882 edges · 155 communities (131 shown, 24 thin omitted)
- Extraction: 95% EXTRACTED · 5% INFERRED · 0% AMBIGUOUS · INFERRED: 323 edges (avg confidence: 0.86)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `b1940987`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- package.json
- lib
- isinResolver.ts
- shared.js
- page.tsx
- compilerOptions
- scenes/lib.js
- next
- README.md
- brain.md
- AGENTS.md
- bootstrap.sh
- photo.js
- photos.mjs
- consistency.mjs
- icons.mjs
- dotted-globe/effect.js
- start.mjs
- copy-lint.mjs
- fx.js
- gate.mjs
- bake.mjs
- moments.mjs
- ui.js
- duotone-grade/effect.js
- print3d.js
- perf.mjs
- rng
- diagram.js
- moments/lib.js
- motion.js
- _demo/shoot.mjs
- scripts/shoot.mjs
- loop
- backgrounds/check.mjs
- effects.mjs
- mountPrint
- system.js
- split-reveal/object.js
- kit.js
- ref_node_fs
- build.js
- Diagram
- shader
- mount
- layout/check.mjs
- layout.js
- grainCSS
- Cards
- norm
- runWidth
- soft-light-bars/effect.js
- make-posters.mjs
- sleep
- frameAlong
- .pause
- clamp
- deal.mjs
- mountProduct
- contour-lines/effect.js
- Copy registers
- mount
- product-render/auto.js
- withLoop
- dependencies
- pick.mjs
- dot-object/object.js
- stage
- 4. Place
- System
- block
- pick.js
- line-engraving/effect.js
- start
- build
- Copy moves
- Effects beyond backgrounds
- Objects and prints (`assets/objects`)
- die
- .build
- halftone-screen/effect.js
- orb-sphere/effect.js
- ruled-grounds/effect.js
- product-turntable/object.js
- init
- gradient-mesh/effect.js
- s
- Photographs
- tasteskill 2.5
- Objects (`assets/objects/print-*`)
- Copy
- Copy voice
- Effects usage
- Features
- refsOf
- .render
- edge-glow/effect.js
- film-light-leak/effect.js
- god-rays/effect.js
- prism-dispersion/effect.js
- Photo prints
- _scenes/auto.js
- Diagrams
- sections-library.md
- Sections for a kind of content
- Photographs, rooms, services and people
- chart/route.ts
- pElbow
- silk-folds/effect.js
- definePrint
- Copy tells
- Icons
- caustics/effect.js
- palette
- _print-core/auto.js
- tpAdd
- Scene objects (`assets/objects/<id>`, runtime in `_scenes`)
- Backgrounds
- The finish gate
- Page plans
- dotOf
- applyFlags
- browserChecks
- staticChecks
- opt
- picture-develops/moment.js
- spotlight-cone/effect.js
- Price and questions
- Footers
- Navigation
- scripts
- Performance budget
- Closes
- runSweep
- shaderLint
- photo-chapters/moment.js
- slider/fragment.js
- word-highlight/moment.js
- { color, normalizePalette, readPalette, GLSL_LIB }

## God Nodes (most connected - your core abstractions)
1. `lib()` - 148 edges
2. `shader()` - 60 edges
3. `sel()` - 48 edges
4. `loop()` - 46 edges
5. `shown()` - 45 edges
6. `inFixed()` - 42 edges
7. `bag()` - 41 edges
8. `palette()` - 41 edges
9. `mountGlobe()` - 38 edges
10. `mountPrint()` - 35 edges

## Surprising Connections (you probably didn't know these)
- `Light on a laptop GPU` --references--> `grounds()`  [INFERRED]
  .agents/taste-skill-ref/design-taste-frontend/references/cards.md → .agents/taste-skill-ref/design-taste-frontend/assets/ui/ui.js
- `Motion and cost` --references--> `mountAll()`  [INFERRED]
  .agents/taste-skill-ref/design-taste-frontend/references/effects-usage.md → .agents/taste-skill-ref/design-taste-frontend/assets/effects/fx.js
- `Mount: the product at anchor scale` --references--> `auto()`  [INFERRED]
  .agents/taste-skill-ref/design-taste-frontend/assets/objects/product-render/README.md → .agents/taste-skill-ref/design-taste-frontend/assets/diagrams/diagram.js
- `Mount` --references--> `auto()`  [INFERRED]
  .agents/taste-skill-ref/design-taste-frontend/references/effects-objects.md → .agents/taste-skill-ref/design-taste-frontend/assets/diagrams/diagram.js
- `The still rule (every moment, no exception)` --references--> `still()`  [INFERRED]
  .agents/taste-skill-ref/design-taste-frontend/references/moments.md → .agents/taste-skill-ref/design-taste-frontend/assets/moments/lib.js

## Import Cycles
- None detected.

## Communities (155 total, 24 thin omitted)

### Community 0 - "package.json"
Cohesion: 0.12
Nodes (21): eslintConfig, devDependencies, eslint@^9, eslint-config-next@16.4.5, tailwindcss@^4, @tailwindcss/turbopack@^4, @types/node@^20, @types/react@^19 (+13 more)

### Community 1 - "lib"
Cohesion: 0.06
Nodes (135): lib(), add(), arrive(), audit(), backdrop(), barRoot(), beneath(), bordered() (+127 more)

### Community 2 - "isinResolver.ts"
Cohesion: 0.19
Nodes (14): FALLBACK_PRICES_EUR, fetchFxRates(), fetchQuoteInEur(), GET(), yf, convertRawPriceToEur(), dynamicIsinCache, ISIN_REGEX (+6 more)

### Community 3 - "shared.js"
Cohesion: 0.06
Nodes (94): init(), PARAMS, init(), PARAMS, DATA, FULL, init(), MONTHS (+86 more)

### Community 4 - "page.tsx"
Cohesion: 0.07
Nodes (79): ChartRange, ActiveTab, FinanzaProApp(), TAB_ORDER, BottomSheet(), BottomSheetProps, AssetDcaDraft, DcaBreakdownEditor() (+71 more)

### Community 5 - "compilerOptions"
Cohesion: 0.11
Nodes (18): compilerOptions, allowJs, esModuleInterop, incremental, isolatedModules, jsx, lib, module (+10 more)

### Community 6 - "scenes/lib.js"
Cohesion: 0.07
Nodes (56): destroy(), cloudCanvas(), mount(), mount(), mount(), mount(), mount(), mount() (+48 more)

### Community 7 - "next"
Cohesion: 0.18
Nodes (5): metadata, viewport, nextConfig, next@16.4.5, next

### Community 8 - "README.md"
Cohesion: 0.50
Nodes (3): Deploy on Vercel, Getting Started, Learn More

### Community 11 - "bootstrap.sh"
Cohesion: 0.67
Nodes (3): download_or_keep(), PATH, bootstrap.sh script

### Community 12 - "photo.js"
Cohesion: 0.05
Nodes (65): FLAT, inks(), mount(), params, mount(), params, demo(), esc() (+57 more)

### Community 13 - "photos.mjs"
Cohesion: 0.06
Nodes (69): ALIAS, argv, byId, cmdPath(), craftFits(), craftOf(), CRAFTS, credit() (+61 more)

### Community 14 - "consistency.mjs"
Cohesion: 0.03
Nodes (56): argv, asJson, AUDIENCE, BANNED, BUSY_EDGE, BUSY_RNG, CATEGORY, CHECKS (+48 more)

### Community 15 - "icons.mjs"
Cohesion: 0.08
Nodes (54): ALIAS, argv, CACHE, checkCmd(), clean(), colours(), contentBox(), fetchCached() (+46 more)

### Community 16 - "dotted-globe/effect.js"
Cohesion: 0.07
Nodes (57): CITIES, earthSampler(), easeInOut(), easeOut(), fib(), hueIn(), LAKES, LAND (+49 more)

### Community 17 - "start.mjs"
Cohesion: 0.05
Nodes (45): ALIAS, allTypes, args, axisOrder(), axisVal(), block(), buttonInk(), dealTypes() (+37 more)

### Community 18 - "copy-lint.mjs"
Cohesion: 0.07
Nodes (47): APART, args, attrOf(), BLOCK, brandsOf(), CAST, CAST_CO, clip() (+39 more)

### Community 19 - "fx.js"
Cohesion: 0.07
Nodes (44): BASE_UNIFORMS, CALM_SPOTS, clamp(), compose(), cssToHex(), DEFAULT_PALETTE, enforceBudget(), FOCAL (+36 more)

### Community 20 - "gate.mjs"
Cohesion: 0.05
Nodes (37): args, base, children, dot, FAMILY, files, fp, gateDir (+29 more)

### Community 21 - "bake.mjs"
Cohesion: 0.07
Nodes (38): addRing(), area(), args, bb, BOX, chains(), clipLine(), clipRing() (+30 more)

### Community 22 - "moments.mjs"
Cohesion: 0.09
Nodes (35): auditPage(), buildIndex(), cmdCheck(), cmdGallery(), cmdList(), cmdPick(), cmdServe(), cmdSheet() (+27 more)

### Community 23 - "ui.js"
Cohesion: 0.09
Nodes (36): addPause(), AGAIN, bakeDpr(), bakeDraw(), bakeOne(), bakeQueue, BASE, boxes (+28 more)

### Community 24 - "duotone-grade/effect.js"
Cohesion: 0.13
Nodes (36): calmMax(), clamp01(), coverScale(), finish(), guard(), hueDist(), isMuddy(), isViolet() (+28 more)

### Community 25 - "print3d.js"
Cohesion: 0.08
Nodes (27): EFFECT_LABEL, PAPERS, atlas, CELL, colMajor(), COMMON_PARAMS, config, cross() (+19 more)

### Community 26 - "perf.mjs"
Cohesion: 0.08
Nodes (31): analyse(), args, B, child, count(), cpuSnap(), die(), exited (+23 more)

### Community 27 - "rng"
Cohesion: 0.16
Nodes (22): BAYER4, fallbackCSS(), hash2(), makeNoise(), mountAscii(), buildAtlas(), draw(), layout() (+14 more)

### Community 28 - "diagram.js"
Cohesion: 0.09
Nodes (27): api, auto(), CAPS, cleanName(), fallbackList(), h(), iconCache, iconMeta (+19 more)

### Community 29 - "moments/lib.js"
Cohesion: 0.08
Nodes (22): clamp(), ease, inCard(), phone(), reduced(), scrub(), still(), stillWhy() (+14 more)

### Community 30 - "motion.js"
Cohesion: 0.10
Nodes (29): boxOf(), counts(), enter(), enterSteps(), fontsIn(), hostOf(), init(), jump() (+21 more)

### Community 31 - "_demo/shoot.mjs"
Cohesion: 0.12
Nodes (31): argv, buildIndex(), chrome(), cmdMake(), cmdProbe(), cmdShoot(), COSTS, decodePNG() (+23 more)

### Community 32 - "scripts/shoot.mjs"
Cohesion: 0.09
Nodes (22): tilesMod, args, call(), child, defaultProfile(), guard, HEIGHTS, jumpTo() (+14 more)

### Community 33 - "loop"
Cohesion: 0.10
Nodes (17): init(), words(), init(), init(), init(), init(), init(), init() (+9 more)

### Community 34 - "backgrounds/check.mjs"
Cohesion: 0.08
Nodes (21): allIds, args, boxIds, by, child, defaultProfile(), fails, guard (+13 more)

### Community 35 - "effects.mjs"
Cohesion: 0.10
Nodes (26): args, buildIndex(), checkFilters(), commands, ENUMS, FX, gallery(), INDEX (+18 more)

### Community 36 - "mountPrint"
Cohesion: 0.15
Nodes (22): ease(), glyphAtlas(), hexRgb(), injectStyles(), monoFamily(), mountPrint(), adapt(), advance() (+14 more)

### Community 37 - "system.js"
Cohesion: 0.14
Nodes (26): actionbar(), DAY_NAMES, DAYS, daySet(), faq(), forms(), glowOnHover(), GROUNDS (+18 more)

### Community 38 - "split-reveal/object.js"
Cohesion: 0.22
Nodes (21): DEFAULT_SEQUENCE, mount(), DEFAULT_PHOTO, mount(), mount(), clamp(), cover(), cssHex() (+13 more)

### Community 39 - "kit.js"
Cohesion: 0.10
Nodes (20): creditsLine(), demo(), esc(), PALETTES, config, credit(), creditEntry(), credits() (+12 more)

### Community 40 - "ref_node_fs"
Cohesion: 0.09
Nodes (14): files, here, files, here, MUST_CATCH, MUST_PASS, OBJECTS, fragments (+6 more)

### Community 41 - "build.js"
Cohesion: 0.09
Nodes (20): AXES, BUILTIN, FILL, FINISH, hexRgb(), I3, knownKind, LENGTH_ARRAYS (+12 more)

### Community 42 - "Diagram"
Cohesion: 0.17
Nodes (3): Diagram, kindOther(), normalise()

### Community 43 - "shader"
Cohesion: 0.17
Nodes (21): lit(), mount(), params, tones(), uniforms(), compile(), fallbackCSS(), HAS_WEBGL() (+13 more)

### Community 44 - "mount"
Cohesion: 0.18
Nodes (23): color, makeLayer(), mount(), calmAt(), colours(), count(), draw(), drawGrid() (+15 more)

### Community 45 - "layout/check.mjs"
Cohesion: 0.09
Nodes (19): args, child, chrome, defaultProfile(), guard, here, { heroes }, kill() (+11 more)

### Community 46 - "layout.js"
Cohesion: 0.15
Nodes (21): collage(), film(), init(), letters(), liveWord(), lockLines(), other(), phone() (+13 more)

### Community 47 - "grainCSS"
Cohesion: 0.14
Nodes (22): at(), L(), mount(), params, tones(), uniforms(), mount(), params (+14 more)

### Community 48 - "Cards"
Cohesion: 0.11
Nodes (20): fetchText(), link(), load(), loadAll(), plan(), script(), start(), startAll() (+12 more)

### Community 49 - "norm"
Cohesion: 0.15
Nodes (18): addressMod, areaMod, basicsMod, CDP, copyChecks(), copyTerms(), holds(), holdsAny() (+10 more)

### Community 50 - "runWidth"
Cohesion: 0.12
Nodes (21): auditFindings(), clusterLooks(), extrasFindings(), groupLike(), groupSame(), invertedLook(), isLocal(), lookName() (+13 more)

### Community 51 - "soft-light-bars/effect.js"
Cohesion: 0.24
Nodes (19): alpha(), banned(), blendsClean(), companion(), darkLight(), fallback(), guard(), hueGap() (+11 more)

### Community 52 - "make-posters.mjs"
Cohesion: 0.10
Nodes (14): args, child, guard, here, kill(), MIME, opt(), portFile (+6 more)

### Community 53 - "sleep"
Cohesion: 0.22
Nodes (14): cropTo(), deadIoPass(), glFallbackPass(), hiddenNow(), hiddenWalk(), lose(), narrowPass(), reducedPass() (+6 more)

### Community 54 - "frameAlong"
Cohesion: 0.21
Nodes (15): add(), axisAngle(), axisOf(), crs(), dot(), euler(), frameAlong(), fromCols() (+7 more)

### Community 55 - ".pause"
Cohesion: 0.11
Nodes (15): Adding an effect, Commands, Effects, Mount, Random pick, The list, Behaviour and limits, Materials (+7 more)

### Community 56 - "clamp"
Cohesion: 0.29
Nodes (11): clamp(), filmicInv(), filmicJs(), fromOklab(), gam22(), lin22(), drawPoster(), paintColor() (+3 more)

### Community 57 - "deal.mjs"
Cohesion: 0.15
Nodes (16): args, darkIds(), dealOnce(), draw(), fits(), HAS, here, hero (+8 more)

### Community 58 - "mountProduct"
Cohesion: 0.33
Nodes (14): mountProduct(), clearInner(), done(), layout(), measureStill(), mountLive(), renderStill(), setRole() (+6 more)

### Community 59 - "contour-lines/effect.js"
Cohesion: 0.60
Nodes (5): fallback(), mount(), params, tones(), uniforms()

### Community 60 - "Copy registers"
Cohesion: 0.12
Nodes (15): 0. The model's default (the one to avoid), 10. Refusal and narrowness, 11. The product as the hero, 12. Hurried and conversational, 1. Facts only, 2. Technical and dry, with proof, 3. The founder's letter, 4. Self-aware and playful (+7 more)

### Community 61 - "mount"
Cohesion: 0.15
Nodes (21): config, lifecycle(), loop(), sync(), makeGL(), makeNoise(), mount(), applyMask() (+13 more)

### Community 62 - "product-render/auto.js"
Cohesion: 0.21
Nodes (14): apply(), ATTRS, cache, claimed, json(), mountAll(), optsOf(), placeOf() (+6 more)

### Community 63 - "withLoop"
Cohesion: 0.20
Nodes (10): init(), init(), DATA, init(), PREV, isStill(), withLoop(), init() (+2 more)

### Community 64 - "dependencies"
Cohesion: 0.15
Nodes (13): dependencies, clsx@^2.1.1, lucide-react@^1.70.0, react@19.3.0, react-dom@19.3.0, recharts@^3.10.1, @supabase/supabase-js@^2.119.0, tailwind-merge@^3.7.0 (+5 more)

### Community 65 - "pick.mjs"
Cohesion: 0.19
Nodes (11): DARK, deal(), FLAT_TYPES, HERE, OWN_LOUD, random(), roleOf(), strHash() (+3 more)

### Community 66 - "dot-object/object.js"
Cohesion: 0.21
Nodes (13): cutOut(), DEFAULT_PHOTO, lin(), LUT, mount(), build(), upload(), oklab() (+5 more)

### Community 67 - "stage"
Cohesion: 0.33
Nodes (13): renderScale(), hasWebGL(), reducedMotion(), stage(), draw(), fallBack(), fit(), flatFrame() (+5 more)

### Community 68 - "4. Place"
Cohesion: 0.14
Nodes (13): 1. Plan in screens, 2. The deal, 3. The plans, 4. Place, 5. Visuals, Designed variety without effects, Look, Order by trade (+5 more)

### Community 69 - "System"
Cohesion: 0.14
Nodes (13): Access, Base, Cards, lists and forms, Colour, Footer, Forms, Head, Motion (+5 more)

### Community 70 - "block"
Cohesion: 0.21
Nodes (14): allow(), applyWaivers(), block(), errorReason(), guard, killTree(), readJson(), readLedger() (+6 more)

### Community 71 - "pick.js"
Cohesion: 0.28
Nodes (12): clashes(), dealable(), filterEffects(), fitsKind(), kindOf(), KINDS, parseSlot(), pick() (+4 more)

### Community 72 - "line-engraving/effect.js"
Cohesion: 0.32
Nodes (12): resolveParams(), clamp(), f1(), fallback(), holdStill(), inkOf(), layout(), lin() (+4 more)

### Community 73 - "start"
Cohesion: 0.29
Nodes (12): acquire(), finishProgram(), onLost(), showFallback(), start(), stop(), sync(), poolCap() (+4 more)

### Community 74 - "build"
Cohesion: 0.20
Nodes (16): build(), checkSpec(), colorOf(), expandProps(), f(), frameView(), localSamples(), m3() (+8 more)

### Community 75 - "Copy moves"
Cohesion: 0.17
Nodes (11): About and story, Buttons and the close, Copy moves, Features and how it works, Microcopy: where a voice is most welcome, Numbers and humour, Prices, FAQ, booking: the plain zone, Proof (+3 more)

### Community 76 - "Effects beyond backgrounds"
Cohesion: 0.17
Nodes (11): A photograph with copy (`fx-photo`), Cost: light enough for a laptop's integrated GPU, Effects beyond backgrounds, Feature cards with inset panels (`fx-feature-card`), Objects in dither (`fx-dither-object`), Picking the effect, Street map of the place (`fx-map`), The techniques (`components/shared.js`) (+3 more)

### Community 77 - "Objects and prints (`assets/objects`)"
Cohesion: 0.17
Nodes (11): GPU cost, Limits, Mount, Mount, Never, Objects and prints (`assets/objects`), Posters, Product renders (+3 more)

### Community 78 - "die"
Cohesion: 0.27
Nodes (9): CDP, die(), findChrome(), inProject(), launch(), perf(), serve(), shot() (+1 more)

### Community 79 - ".build"
Cohesion: 0.20
Nodes (5): axesOf(), geo(), kindOf(), Program(), s()

### Community 80 - "halftone-screen/effect.js"
Cohesion: 0.38
Nodes (10): clamp(), f1(), fallback(), inks(), layout(), lin(), mount(), params (+2 more)

### Community 81 - "orb-sphere/effect.js"
Cohesion: 0.38
Nodes (10): clamp(), fallback(), lc(), lin(), mount(), noLavender(), params, placeOrb() (+2 more)

### Community 82 - "ruled-grounds/effect.js"
Cohesion: 0.38
Nodes (10): clean(), fallback(), geometry(), inBand(), lightAt(), mount(), params, step() (+2 more)

### Community 83 - "product-turntable/object.js"
Cohesion: 0.24
Nodes (10): CAM, cross(), dot(), fitCamera(), FORMS, LABELS, NAMES, norm() (+2 more)

### Community 84 - "init"
Cohesion: 0.18
Nodes (5): init(), init(), reset(), init(), POINTER_SVG

### Community 85 - "gradient-mesh/effect.js"
Cohesion: 0.33
Nodes (9): ADD, at(), DEAL, L(), mount(), params, sat(), tones() (+1 more)

### Community 87 - "Photographs"
Cohesion: 0.20
Nodes (9): A product without photographs (PH-04), Credits and words (PH-38, CO-22), Live search (stand-ins for what the library lacks), Never, Photographs, Pick and fetch, Place them, Show them (+1 more)

### Community 88 - "tasteskill 2.5"
Cohesion: 0.20
Nodes (9): 1. The kind of business decides everything, 2. The page plan by kind, 3. What serves which page, 4. The run, 5. Checklist, 6. Never, House rules, References (+1 more)

### Community 89 - "Objects (`assets/objects/print-*`)"
Cohesion: 0.22
Nodes (8): glslProblems(), A new object, Do and don't, It always shows a picture, Light on a laptop GPU, Objects (`assets/objects/print-*`), Posters, Put one on a page

### Community 90 - "Copy"
Cohesion: 0.22
Nodes (8): Banned, Contacts the brief does not give, Copy, Five rules, Headlines and text, Plain versions, The copy layer, What may be assumed

### Community 91 - "Copy voice"
Cohesion: 0.22
Nodes (8): 1. The fact sheet, from the brief, 2. The voice card, 3. Shape from the reader's questions, 4. Draft, 5. The device budget, per page, 6. Check, Copy voice, Why model copy reads as model copy

### Community 92 - "Effects usage"
Cohesion: 0.22
Nodes (8): Deal the effect, never by taste, Deal the moments and the scene, Effects usage, Never, Tech budget, The gate (house rule 8), What each kind gets, Where things sit

### Community 93 - "Features"
Cohesion: 0.22
Nodes (9): app-frame, bento, chapter, Features, features-2x2, product-statement, split-text-left, steps (+1 more)

### Community 94 - "refsOf"
Cohesion: 0.22
Nodes (9): attrs(), cssRefs(), jsRefs(), kindOf(), local(), metas(), refsOf(), stripRef() (+1 more)

### Community 95 - ".render"
Cohesion: 0.32
Nodes (4): clamp(), ease(), spread(), unease()

### Community 96 - "edge-glow/effect.js"
Cohesion: 0.46
Nodes (7): clearOfViolet(), crossesViolet(), mount(), neighbour(), params, tones(), uniforms()

### Community 97 - "film-light-leak/effect.js"
Cohesion: 0.50
Nodes (7): guard(), isWarm(), mount(), params, pickEdge(), tones(), uniforms()

### Community 98 - "god-rays/effect.js"
Cohesion: 0.50
Nodes (7): aim(), fits(), mount(), params, tones(), uniforms(), warm()

### Community 99 - "prism-dispersion/effect.js"
Cohesion: 0.50
Nodes (7): hd(), layout(), mount(), params, spectrumCentre(), tones(), uniforms()

### Community 100 - "Photo prints"
Cohesion: 0.25
Nodes (7): Cost, Credit, Mount, Photo prints, The photograph, When it cannot draw, Where a print goes, and where not

### Community 101 - "_scenes/auto.js"
Cohesion: 0.36
Nodes (7): claimed, IDS, json(), LOOPING, mountAll(), scenes, srcOf()

### Community 102 - "Diagrams"
Cohesion: 0.25
Nodes (7): Diagrams, Icons: one resolver, run it last, Labels plain, Motion: one cycle of 2.5 to 4 s, Pick a layout and a preset, The builder page (the tool for building one fast), When a diagram, when a UI fragment

### Community 103 - "sections-library.md"
Cohesion: 0.25
Nodes (7): customer-proof-row, Heroes, logo-row, Proof, quote-stat, Section library, What every recipe assumes

### Community 104 - "Sections for a kind of content"
Cohesion: 0.25
Nodes (8): booking-form, calendar-frame, client-slots, integrations-grid, menu-in-type, Sections for a kind of content, timeline-rail, visit-map

### Community 105 - "Photographs, rooms, services and people"
Cohesion: 0.25
Nodes (8): line-up, peek-list, people-row, photo-band, photo-pair, Photographs, rooms, services and people, rooms-list, services-list

### Community 106 - "chart/route.ts"
Cohesion: 0.39
Nodes (7): buildFallbackSeries(), convertToEur(), GET(), getPeriodConfig(), yf, yahoo-finance2@^4.0.5, yahoo-finance2

### Community 107 - "pElbow"
Cohesion: 0.62
Nodes (7): joint(), outline(), P(), pCurve(), pElbow(), pLine(), r1()

### Community 108 - "silk-folds/effect.js"
Cohesion: 0.52
Nodes (6): cool(), mount(), params, sheenTurn(), tones(), uniforms()

### Community 109 - "definePrint"
Cohesion: 0.15
Nodes (5): definePrint(), formShader(), sources(), LAKES, LAND

### Community 110 - "Copy tells"
Cohesion: 0.29
Nodes (6): Copy tells, First generation: the old tells (mostly avoided now; still checked), Not tells (leave them alone), Over-correction: what the rules themselves produce, Second generation: the tells now, Why it happens

### Community 111 - "Icons"
Cohesion: 0.29
Nodes (6): Commands, How they sit, Icons, The violet rule (a judgement, stated), Where they come from, Which one

### Community 112 - "caustics/effect.js"
Cohesion: 0.60
Nodes (5): mount(), params, tones(), uniforms(), violet()

### Community 113 - "palette"
Cohesion: 0.35
Nodes (11): cssHex(), groundPalette(), isDarkPaper(), lightness(), mixColor(), loadPoster(), posterFile(), normalizePalette() (+3 more)

### Community 114 - "_print-core/auto.js"
Cohesion: 0.47
Nodes (5): claimed, json(), mountAll(), placeOf(), prints

### Community 115 - "tpAdd"
Cohesion: 0.47
Nodes (3): LiveSet, tpAdd(), tpHeld()

### Community 116 - "Scene objects (`assets/objects/<id>`, runtime in `_scenes`)"
Cohesion: 0.33
Nodes (5): Behaviour, Light on a laptop GPU, Put one on a page, Scene objects (`assets/objects/<id>`, runtime in `_scenes`), Where they go: software pages only

### Community 117 - "Backgrounds"
Cohesion: 0.33
Nodes (5): Backgrounds, Other kinds stay flat, Tech: code-drawn grounds, how they look, Tech: the CSS grounds, The three tokens (every kind)

### Community 118 - "The finish gate"
Cohesion: 0.33
Nodes (5): Arm it, As a hook, The finish gate, The manual gate, What it does

### Community 119 - "Page plans"
Cohesion: 0.33
Nodes (6): Gaming, Page plans, Place, Product, Service, Software

### Community 120 - "dotOf"
Cohesion: 0.47
Nodes (6): activeIn(), below(), dotOf(), findProject(), lastTouch(), unarmedPage()

### Community 121 - "applyFlags"
Cohesion: 0.40
Nodes (6): applyFlags(), fileAt(), findPage(), isUrl(), kindArg(), slash()

### Community 122 - "browserChecks"
Cohesion: 0.40
Nodes (6): browserChecks(), copyChecks(), errLine(), left(), parseJson(), rmProfile()

### Community 123 - "staticChecks"
Cohesion: 0.40
Nodes (6): codeOnly(), hashOf(), kitIndex(), kitTwin(), norm(), staticChecks()

### Community 124 - "opt"
Cohesion: 0.33
Nodes (6): freshProfile(), inProject(), opt(), profileBase(), roundsArg(), str()

### Community 126 - "spotlight-cone/effect.js"
Cohesion: 0.67
Nodes (5): mount(), params, poolX(), tones(), uniforms()

### Community 127 - "Price and questions"
Cohesion: 0.40
Nodes (5): comparison-table, faq, Price and questions, pricing-three, pricing-two

### Community 128 - "Footers"
Cohesion: 0.40
Nodes (5): footer-columns, footer-dark, footer-statement, footer-visit, Footers

### Community 129 - "Navigation"
Cohesion: 0.40
Nodes (5): nav-cards, nav-centre, nav-mega, nav-split, Navigation

### Community 130 - "scripts"
Cohesion: 0.40
Nodes (5): scripts, build, dev, lint, start

### Community 131 - "Performance budget"
Cohesion: 0.50
Nodes (3): Every visual renders, Performance budget, Usual fixes

### Community 132 - "Closes"
Cohesion: 0.50
Nodes (4): close-photo, close-type, close-word, Closes

### Community 133 - "runSweep"
Cohesion: 0.67
Nodes (4): bySev(), clean(), lostFindings(), runSweep()

### Community 134 - "shaderLint"
Cohesion: 0.50
Nodes (4): glslIn(), isGLSL(), lintGLSL(), shaderLint()

## Knowledge Gaps
- **2 isolated node(s):** `PATH`, `{ color, normalizePalette, readPalette, GLSL_LIB }`
  These have ≤1 connection - possible missing edges or undocumented components. (Counts symbols only; 1004 node(s) total have ≤1 connection when file, concept and rationale nodes are included.)
- **24 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `lib()` connect `lib` to `consistency.mjs`?**
  _High betweenness centrality (0.095) - this node is a cross-community bridge._
- **Are the 51 inferred relationships involving `lib()` (e.g. with `arrive()` and `audit()`) actually correct?**
  _`lib()` has 51 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PATH`, `{ color, normalizePalette, readPalette, GLSL_LIB }` to the rest of the system?**
  _2 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `package.json` be split into smaller, more focused modules?**
  _Cohesion score 0.1225296442687747 - nodes in this community are weakly interconnected._
- **Why does `mountAll()` connect `fx.js` to `ui.js`?**
  _High betweenness centrality (0.057) - this node is a cross-community bridge._
- **Are the 2 inferred relationships involving `shader()` (e.g. with `fx.js` and `draw()`) actually correct?**
  _`shader()` has 2 INFERRED edges - model-reasoned connections that need verification._
- **Should `lib` be split into smaller, more focused modules?**
  _Cohesion score 0.05791505791505792 - nodes in this community are weakly interconnected._