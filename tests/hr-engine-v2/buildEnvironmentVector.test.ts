import { describe, expect, it } from "vitest";
import { buildEnvironmentVector } from "../../server/services/mlb/hr-engine/v2/adapters/buildEnvironmentVector";
import type { GameWeather } from "../../server/services/mlb/weatherService";

const factors = {
  parkFactorHrOverall: 104,
  parkFactorPullLeft: 108,
  parkFactorPullRight: 102,
  parkFactorCenter: 100,
};

const outdoorWeather: GameWeather = {
  gamePk: 123,
  venue: "Yankee Stadium",
  gameTime: "2026-08-10T23:05:00Z",
  status: "forecast",
  tempF: 82,
  windMph: 11,
  windCompass: "SW",
  precipChancePct: 0,
  source: "open-meteo",
  note: "Forecast available.",
};

describe("buildEnvironmentVector", () => {
  it("maps a verified outdoor forecast without inventing outbound wind", () => {
    const result = buildEnvironmentVector(outdoorWeather, {
      ...factors,
      roofStatus: "open",
    });

    expect(result.environment.temperature).toBe(82);
    expect(result.environment.windSpeed).toBe(11);
    expect(result.environment.windDirection).toBe("SW");
    expect(result.environment.windVectorOutboundMph).toBeNull();
    expect(result.environment.weatherConfidence).toBe("HIGH");
    expect(result.warnings.join(" ")).toMatch(/stadium orientation/i);
  });

  it("removes outdoor weather under a closed roof", () => {
    const result = buildEnvironmentVector(outdoorWeather, {
      ...factors,
      roofStatus: "closed",
    });

    expect(result.environment.temperature).toBeNull();
    expect(result.environment.windSpeed).toBeNull();
    expect(result.environment.windDirection).toBeNull();
    expect(result.environment.weatherConfidence).toBe("HIGH");
  });

  it("downgrades unavailable weather without estimating values", () => {
    const unavailable: GameWeather = {
      ...outdoorWeather,
      status: "unavailable",
      tempF: null,
      windMph: null,
      windCompass: null,
      source: null,
      note: "Venue not in sourced table.",
    };

    const result = buildEnvironmentVector(unavailable, {
      ...factors,
      roofStatus: "open",
    });

    expect(result.environment.temperature).toBeNull();
    expect(result.environment.windSpeed).toBeNull();
    expect(result.environment.weatherConfidence).toBe("LOW");
    expect(result.warnings.join(" ")).toMatch(/Weather unavailable/i);
  });
});
