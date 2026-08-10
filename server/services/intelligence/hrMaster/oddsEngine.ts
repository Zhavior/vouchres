import type { OddsOutput } from "./types";
import { HR_MASTER_MODEL } from "./modelConfig";
import { decimalToAmerican } from "./normalize";

export function computeOdds(args: {
  p_model: number;
  decimal_odds: number;
  american_odds: number;
  consensus_implied_probability?: number;
}): OddsOutput {
  const { p_model, decimal_odds, american_odds, consensus_implied_probability } = args;
  const fair_decimal_odds = 1 / p_model;
  const fair_american_odds = decimalToAmerican(fair_decimal_odds);
  const market_implied_probability = 1 / decimal_odds;
  const expected_value = p_model * decimal_odds - 1;
  const edge_vs_consensus =
    consensus_implied_probability != null ? p_model - consensus_implied_probability : null;

  const minimum_playable_decimal =
    (1 + HR_MASTER_MODEL.edge_safety_buffer) / p_model;
  const minimum_playable_american = decimalToAmerican(minimum_playable_decimal);

  const market_markup_flag = p_model >= 0.12 && expected_value < 0;

  return {
    fair_decimal_odds,
    fair_american_odds,
    market_american_odds: american_odds,
    market_decimal_odds: decimal_odds,
    market_implied_probability,
    expected_value,
    edge_vs_consensus,
    minimum_playable_decimal,
    minimum_playable_american,
    market_markup_flag,
  };
}
