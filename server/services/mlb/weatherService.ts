/**
 * Real game-time weather from Open-Meteo (free, keyless, real forecast data).
 *
 * Truth rules:
 *   - Stadium coordinates and roof status are a sourced static table (same
 *     pattern as parkFactors.ts). Unknown venue → status "unavailable",
 *     never guessed coordinates.
 *   - Fixed-roof venues report "indoor" — no outdoor forecast is attached.
 *   - Retractable-roof venues get the real outdoor forecast but are labeled
 *     so the UI can say "roof may be closed".
 *   - Wind is reported as speed + compass direction only. Blowing in/out
 *     requires stadium orientation data we do not have — never claimed.
 */
import { getScheduleByDate, todayISO } from "./mlbClient";
import { TTLCache } from "../../lib/cache";

type RoofType = "open" | "retractable" | "fixed";

interface VenueInfo {
  lat: number;
  lon: number;
  roof: RoofType;
}

/** Sourced stadium coordinates (public data) + roof type. Keyed by venue-name substring, lowercase. */
const VENUE_TABLE: Record<string, VenueInfo> = {
  "angel stadium": { lat: 33.8003, lon: -117.8827, roof: "open" },
  "chase field": { lat: 33.4455, lon: -112.0667, roof: "retractable" },
  "truist park": { lat: 33.8908, lon: -84.4678, roof: "open" },
  "camden yards": { lat: 39.284, lon: -76.6216, roof: "open" },
  "fenway park": { lat: 42.3467, lon: -71.0972, roof: "open" },
  "wrigley field": { lat: 41.9484, lon: -87.6553, roof: "open" },
  "guaranteed rate field": { lat: 41.8299, lon: -87.6338, roof: "open" },
  "rate field": { lat: 41.8299, lon: -87.6338, roof: "open" },
  "great american ball park": { lat: 39.0975, lon: -84.5066, roof: "open" },
  "progressive field": { lat: 41.4962, lon: -81.6852, roof: "open" },
  "coors field": { lat: 39.7559, lon: -104.9942, roof: "open" },
  "comerica park": { lat: 42.339, lon: -83.0485, roof: "open" },
  "minute maid park": { lat: 29.7573, lon: -95.3555, roof: "retractable" },
  "daikin park": { lat: 29.7573, lon: -95.3555, roof: "retractable" },
  "kauffman stadium": { lat: 39.0517, lon: -94.4803, roof: "open" },
  "dodger stadium": { lat: 34.0739, lon: -118.24, roof: "open" },
  "loandepot park": { lat: 25.7781, lon: -80.2196, roof: "retractable" },
  "american family field": { lat: 43.028, lon: -87.9712, roof: "retractable" },
  "target field": { lat: 44.9817, lon: -93.2776, roof: "open" },
  "citi field": { lat: 40.7571, lon: -73.8458, roof: "open" },
  "yankee stadium": { lat: 40.8296, lon: -73.9262, roof: "open" },
  "sutter health park": { lat: 38.5804, lon: -121.5133, roof: "open" },
  "citizens bank park": { lat: 39.9061, lon: -75.1665, roof: "open" },
  "pnc park": { lat: 40.4469, lon: -80.0057, roof: "open" },
  "petco park": { lat: 32.7076, lon: -117.157, roof: "open" },
  "oracle park": { lat: 37.7786, lon: -122.3893, roof: "open" },
  "t-mobile park": { lat: 47.5914, lon: -122.3325, roof: "retractable" },
  "busch stadium": { lat: 38.6226, lon: -90.1928, roof: "open" },
  "tropicana field": { lat: 27.7683, lon: -82.6534, roof: "fixed" },
  "steinbrenner field": { lat: 27.9803, lon: -82.5067, roof: "open" },
  "globe life field": { lat: 32.7473, lon: -97.0847, roof: "retractable" },
  "rogers centre": { lat: 43.6414, lon: -79.3894, roof: "retractable" },
  "nationals park": { lat: 38.873, lon: -77.0074, roof: "open" },
};

function findVenue(venueName: string): VenueInfo | null {
  const lower = String(venueName ?? "").toLowerCase();
  if (!lower) return null;
  for (const [key, info] of Object.entries(VENUE_TABLE)) {
    if (lower.includes(key)) return info;
  }
  return null;
}

export interface GameWeather {
  gamePk: number;
  venue: string;
  gameTime: string;
  /**
   * forecast     — real outdoor forecast for first pitch
   * retractable  — real outdoor forecast, but the roof may be closed
   * indoor       — fixed roof, weather is not a factor
   * unavailable  — venue unknown or forecast fetch failed; nothing estimated
   */
  status: "forecast" | "retractable" | "indoor" | "unavailable";
  tempF: number | null;
  windMph: number | null;
  windCompass: string | null;
  precipChancePct: number | null;
  source: "open-meteo" | null;
  note: string;
}

const forecastCache = new TTLCache<unknown>(30 * 60_000, "mlb:weather");

const COMPASS = ["N", "NNE", "NE", "ENE", "E", "ESE", "SE", "SSE", "S", "SSW", "SW", "WSW", "W", "WNW", "NW", "NNW"];

function degreesToCompass(deg: number): string {
  return COMPASS[Math.round(((deg % 360) / 22.5)) % 16];
}

interface HourlyForecast {
  time: string[];
  temperature_2m: number[];
  wind_speed_10m: number[];
  wind_direction_10m: number[];
  precipitation_probability: number[];
}

async function getHourlyForecast(lat: number, lon: number): Promise<HourlyForecast | null> {
  const key = `forecast:${lat.toFixed(3)}:${lon.toFixed(3)}`;
  return forecastCache.getOrSet(key, async () => {
    try {
      const url =
        `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
        `&hourly=temperature_2m,wind_speed_10m,wind_direction_10m,precipitation_probability` +
        `&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=UTC&forecast_days=2`;
      const res = await fetch(url, { signal: AbortSignal.timeout(8000) });
      if (!res.ok) throw new Error(`open-meteo ${res.status}`);
      const data: any = await res.json();
      const hourly = data?.hourly;
      if (!Array.isArray(hourly?.time)) return null;
      return hourly as HourlyForecast;
    } catch (err) {
      console.warn("[weatherService] forecast fetch failed:", (err as Error).message);
      return null;
    }
  }) as Promise<HourlyForecast | null>;
}

/** Nearest forecast index to the game start (both sides UTC). */
function nearestHourIndex(hourly: HourlyForecast, gameTimeIso: string): number | null {
  const target = Date.parse(gameTimeIso);
  if (!Number.isFinite(target)) return null;
  let best: number | null = null;
  let bestDiff = Infinity;
  for (let i = 0; i < hourly.time.length; i++) {
    const diff = Math.abs(Date.parse(`${hourly.time[i]}:00Z`.replace(/:00Z$/, ":00Z")) - target);
    if (Number.isFinite(diff) && diff < bestDiff) {
      bestDiff = diff;
      best = i;
    }
  }
  // Only trust a forecast within 2 hours of first pitch — otherwise say so.
  return best !== null && bestDiff <= 2 * 60 * 60_000 ? best : null;
}

export async function getTodayGamesWeather(date = todayISO()): Promise<GameWeather[]> {
  const games = await getScheduleByDate(date);
  const results: GameWeather[] = [];

  for (const game of games) {
    const base = {
      gamePk: game.gamePk,
      venue: game.venue,
      gameTime: game.gameDate,
    };

    const venueInfo = findVenue(game.venue);

    if (!venueInfo) {
      results.push({
        ...base,
        status: "unavailable",
        tempF: null,
        windMph: null,
        windCompass: null,
        precipChancePct: null,
        source: null,
        note: "Venue not in the sourced stadium table — no weather estimated.",
      });
      continue;
    }

    if (venueInfo.roof === "fixed") {
      results.push({
        ...base,
        status: "indoor",
        tempF: null,
        windMph: null,
        windCompass: null,
        precipChancePct: null,
        source: null,
        note: "Fixed roof — weather is not a factor at this venue.",
      });
      continue;
    }

    const hourly = await getHourlyForecast(venueInfo.lat, venueInfo.lon);
    const idx = hourly ? nearestHourIndex(hourly, game.gameDate) : null;

    if (!hourly || idx === null) {
      results.push({
        ...base,
        status: "unavailable",
        tempF: null,
        windMph: null,
        windCompass: null,
        precipChancePct: null,
        source: null,
        note: "Forecast unavailable for first pitch — nothing estimated in its place.",
      });
      continue;
    }

    const windDeg = hourly.wind_direction_10m[idx];
    results.push({
      ...base,
      status: venueInfo.roof === "retractable" ? "retractable" : "forecast",
      tempF: Number.isFinite(hourly.temperature_2m[idx]) ? Math.round(hourly.temperature_2m[idx]) : null,
      windMph: Number.isFinite(hourly.wind_speed_10m[idx]) ? Math.round(hourly.wind_speed_10m[idx]) : null,
      windCompass: Number.isFinite(windDeg) ? degreesToCompass(windDeg) : null,
      precipChancePct: Number.isFinite(hourly.precipitation_probability[idx])
        ? hourly.precipitation_probability[idx]
        : null,
      source: "open-meteo",
      note:
        venueInfo.roof === "retractable"
          ? "Retractable roof — outdoor forecast shown; roof may be closed."
          : "Open-air forecast for first pitch (Open-Meteo).",
    });
  }

  return results;
}
