# VouchEdge HR Board System Audit & Truth Report

**Version:** V3.2 Validated Pipeline  
**System:** HR / Truth OS  
**Status:** 98+ Production Verified  
**Last Updated:** July 22, 2026  

---

## 1. Executive Summary

The **HR / Truth OS Engine** computes real-time Home Run probabilities, candidate rankings, and diagnostic metrics across active MLB slates. It adheres strictly to the **Trust-First Data Principle**: zero simulated data, zero fake lineups, and mandatory safety validation for every candidate prior to scoring.

---

## 2. Core Architectural Principles & Truth Constraints

1. **Official Batting Lineups**:
   - `candidates[]`: Reserved strictly for official, posted batting-order players verified via boxscores or MLB roster feeds.
   - `projectedCandidates[]`: Safe roster previews when official lineups are not yet posted.
   - **Mandatory Preview Warning**: Every preview row carries an explicit warning: *"Official lineup not posted yet."*

2. **Team & Roster Safety (Stale Player Prevention)**:
   - Player identity is verified against `sourceTeamId`, `activeRosterTeamId`, and `currentTeamId`.
   - Players with mismatched, stale, or traded team assignments are blocked immediately with reason: `Team mismatch / stale roster assignment`.

3. **Weather Engine Integration**:
   - Real-time hourly weather metrics (temperature, wind speed, wind direction, humidity, weather code) are fetched via `getTodayGamesWeather` (`weatherService.ts`).
   - Venue-specific wind and thermal boosts are dynamically added to candidate scoring without inventing synthetic data.

4. **Sportsbook Pricing Integrity**:
   - Real odds remain labeled as pending feed connection ("Odds TBD").
   - Implied probabilities derived from the Log5/Bayesian model are clearly labeled as model estimates, never disguised as sportsbook quotes.

---

## 3. Candidate Scoring & Validation Matrix

| Layer | Component | Weight / Impact | Data Source |
|---|---|---|---|
| **Power Baseline** | Season ISO & HR/PA | 30% | MLB Stats API (Season) |
| **Statcast Quality** | Barrel % & HardHit % | 25% | Statcast Feed |
| **Platoon Split** | Handedness Advantage | 15% | MLB Roster Feed |
| **Bayesian BvP** | Batter vs Pitcher AB History | 15% | MLB Game Logs |
| **Recent Form** | Last 10 Games HR/Hit Rate | 15% | MLB Player Game Logs |
| **Environment** | Park Factors (88-121) | Multiplicative | Sourced Venue Table (`parkFactors.ts`) |
| **Weather Boost** | Temp (>78°F) & Outfield Wind | Additive (+1 to +6) | Open-Meteo Weather API (`weatherService.ts`) |

---

## 4. Verification & Diagnostic Endpoints

The system exposes full audit transparency via dedicated endpoints:

- `GET /api/mlb/hr-board/today`: Returns `candidates[]` (confirmed) and `projectedCandidates[]` (previews).
- `GET /api/mlb/hr-board/today/pool`: Today Player Pool summary (`totalPlayersChecked`, `confirmedStarters`, `projectedStarters`).
- `GET /api/mlb/hr-board/today/debug`: Full diagnostic report (blocked reasons, team mismatch counts, warning logs).

---

## 5. Verification Commands

To verify system health and runtime stability:
```bash
# Typecheck validation
npm run typecheck

# Full V3 Backend Verification
npm run verify:v3-backend

# Production Bundle Build
npm run build
```
