export interface StadiumTelemetry {
  id: string;
  name: string;
  city: string;
  wind: string;
  temp: string;
  humidity: string;
  parkFactor: string;
  orientation: string;
  elevation: string;
}

export const STADIUMS: StadiumTelemetry[] = [
  {
    id: 'bal',
    name: 'CAMDEN YARDS',
    city: 'BALTIMORE',
    wind: '8 MPH OUT TO LF',
    temp: '82°F',
    humidity: '65%',
    parkFactor: '104',
    orientation: 'NE',
    elevation: '30 FT'
  },
  {
    id: 'col',
    name: 'COORS FIELD',
    city: 'DENVER',
    wind: '4 MPH IN FROM CF',
    temp: '74°F',
    humidity: '15%',
    parkFactor: '118',
    orientation: 'N',
    elevation: '5,200 FT'
  },
  {
    id: 'chi',
    name: 'WRIGLEY FIELD',
    city: 'CHICAGO',
    wind: '15 MPH OUT TO RF',
    temp: '68°F',
    humidity: '40%',
    parkFactor: '112',
    orientation: 'NE',
    elevation: '600 FT'
  }
];
