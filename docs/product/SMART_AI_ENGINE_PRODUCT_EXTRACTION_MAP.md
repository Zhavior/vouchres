# SmartAiEngine Product Extraction Map

## Stage
Stage 3B.2B — Heavy page idea extraction + product remix

## Purpose
This document captures the useful product ideas inside the old `SmartAiEngine.tsx` before we split, replace, or redesign it.

The goal is not to blindly copy old code. The goal is to:
1. Look at the current implementation.
2. Find useful product ideas and broken converter-lens patterns.
3. Research proven SaaS/UI/React architecture patterns.
4. Collect the best pieces.
5. Create a native VouchEdge version.

## Current Product Ideas Found

### 1. Dynamic AI Creator
A guided AI parlay creator that lets users choose:
- number of legs
- stat category
- threshold
- verified player trend profile
- dynamic parlay output
- AI confidence / edge language

Keep this idea.

### 2. Vault Extractor
A large pool of precomputed picks or candidate picks users can filter, sort, and extract from.

Keep this idea, but later separate data generation/filtering from UI.

### 3. Ledger-ready parlay output
The old page is trying to create slips that can become saved/posted/ledger-ready parlays.

Keep this idea, but connect it only through canonical parlay contracts.

### 4. Verified trend language
The UI keeps saying things like historical game logs, matchup shape, market context, and verified profiles.

Keep this idea, but make the proof more specific and honest.

### 5. Risk/confidence labels
The page includes confidence, accuracy, odds, and model language.

Keep this idea, but avoid fake precision. Use confidence bands and explainability.

## Converter-Lens Problems Found

### 1. Huge JSX body
The page mixes product logic, state, filters, builder UI, cards, vault UI, and parlay preview in one file.

Replace with modules.

### 2. Repeated one-off styling
Many sections use manual gradients, borders, badge styles, and buttons.

Replace with VE primitives.

### 3. Logic and UI mixed together
Builder state, filtering, odds math, and rendering live together.

Extract into hooks and logic files.

### 4. Local/client truth risk
Any saved/post/parlay transfer flow must not pretend local UI is official truth.

Route all serious save/post/ledger actions through canonical backend contracts.

### 5. Fake precision risk
Avoid overclaiming AI accuracy if the value is simulated or not backed by measured outcomes.

## Native VouchEdge Target Architecture

src/components/smart-ai/
- SmartAiEnginePage.tsx
- SmartAiDynamicCreator.tsx
- SmartAiVaultExtractor.tsx
- SmartAiPickCard.tsx
- SmartAiParlayPreview.tsx
- SmartAiControls.tsx
- useSmartAiBuilder.ts
- smartAiEngine.types.ts
- smartAiEngine.logic.ts

## Safety Rules

Do not mutate live parlays.
Do not overwrite saved slips.
Do not fake ledger truth.
Do not let localStorage become official truth.
Do not claim verified accuracy unless backed by real measured data.
Do not connect Vouch posting until canonical save/load/truth flow is stable.

## First Safe Technical Split

Extract types and pure helpers first:
- RealCandidate
- PrecomputedPick
- DynamicParlay shape
- americanToDecimalOdds
- builder category/threshold definitions
- pure generation/filter helpers

No UI changes in the first split.
No backend behavior changes.
No save/post behavior changes.
