import type {
  ConfidenceLabel,
  EnvironmentVectorV2,
  RoofStatus,
} from "../types";
import type { GameWeather } from "../../../weatherService";

type BuildEnvironmentVectorOptions = {
  parkFactorHrOverall: number;
  parkFactorPullLeft: number;
  parkFactorPullRight: number;
  parkFactorCenter: number;
  roofStatus: RoofStatus;
};

type BuildEnvironmentVectorResult = {
  environment: EnvironmentVectorV2;
  warnings: string[];
};

function weatherConfidence(weather: GameWeather): ConfidenceLabel {
  if (weather.status === "forecast") return "HIGH";
  if (weather.status === "retractable") return "MEDIUM";
  return "LOW";
}

export function buildEnvironmentVector(
  weather: GameWeather | null,
  options: BuildEnvironmentVectorOptions,
): BuildEnvironmentVectorResult {
  const warnings: string[] = [];

  if (!weather) {
    warnings.push("Weather unavailable for this game.");
  } else if (weather.status === "unavailable") {
    warnings.push(`Weather unavailable: ${weather.note}`);
  } else if (weather.status === "indoor") {
    warnings.push("Fixed-roof venue: outdoor weather excluded.");
  } else if (weather.status === "retractable") {
    warnings.push("Retractable-roof venue: outdoor forecast may not match in-stadium conditions.");
  }

  const indoor =
    options.roofStatus === "closed" ||
    options.roofStatus === "retractable_closed";

  const environment: EnvironmentVectorV2 = {
    temperature: indoor ? null : weather?.tempF ?? null,
    humidity: null,
    windSpeed: indoor ? null : weather?.windMph ?? null,
    windDirection: indoor ? null : weather?.windCompass ?? null,
    windVectorOutboundMph: null,
    parkFactorHrOverall: options.parkFactorHrOverall,
    parkFactorPullLeft: options.parkFactorPullLeft,
    parkFactorPullRight: options.parkFactorPullRight,
    parkFactorCenter: options.parkFactorCenter,
    weatherConfidence: indoor ? "HIGH" : weather ? weatherConfidence(weather) : "LOW",
    roofStatus: options.roofStatus,
  };

  if (!indoor && weather?.windMph != null) {
    warnings.push(
      "Directional outbound-wind adjustment unavailable: stadium orientation is not yet sourced.",
    );
  }

  return { environment, warnings };
}
