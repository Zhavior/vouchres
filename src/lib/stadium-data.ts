/*
 * Static ballpark facts only.
 *
 * This file used to also carry `wind`, `temp` and `humidity` as literals —
 * "8 MPH OUT TO LF", "82F", "65%" — rendered on the landing under a heading
 * describing live wind shear and barometric pressure. They never changed.
 * Conditions now come from /api/mlb/weather/today; elevation, orientation and
 * park factor stay here because they genuinely are constant.
 */
export interface StadiumTelemetry {
  id: string;
  name: string;
  city: string;
  parkFactor: string;
  /** Exact venue name as MLB StatsAPI reports it, for matching the live forecast feed. */
  venueName: string;
  orientation: string;
  elevation: string;
}

export const STADIUMS: StadiumTelemetry[] = [
  {
    id: 'bal',
    name: 'CAMDEN YARDS',
    venueName: 'Oriole Park at Camden Yards',
    city: 'BALTIMORE',
    parkFactor: '104',
    orientation: 'NE',
    elevation: '30 FT'
  },
  {
    id: 'col',
    name: 'COORS FIELD',
    venueName: 'Coors Field',
    city: 'DENVER',
    parkFactor: '118',
    orientation: 'N',
    elevation: '5,200 FT'
  },
  {
    id: 'chi',
    name: 'WRIGLEY FIELD',
    venueName: 'Wrigley Field',
    city: 'CHICAGO',
    parkFactor: '112',
    orientation: 'NE',
    elevation: '600 FT'
  }
];
