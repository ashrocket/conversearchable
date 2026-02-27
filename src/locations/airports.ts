import type { GeoCoordinates } from '../types/index.js';

export interface AirportInfo {
  code: string;
  name: string;
  city: string;
  state: string;
  country: string;
  coordinates: GeoCoordinates;
}

/**
 * Static database of major US airports.
 * In production, this would be backed by a full airport database (OurAirports, etc.).
 */
export const AIRPORTS: Record<string, AirportInfo> = {
  ATL: { code: 'ATL', name: 'Hartsfield-Jackson Atlanta International', city: 'Atlanta', state: 'GA', country: 'US', coordinates: { lat: 33.6407, lng: -84.4277 } },
  AUS: { code: 'AUS', name: 'Austin-Bergstrom International', city: 'Austin', state: 'TX', country: 'US', coordinates: { lat: 30.1975, lng: -97.6664 } },
  BOS: { code: 'BOS', name: 'Boston Logan International', city: 'Boston', state: 'MA', country: 'US', coordinates: { lat: 42.3656, lng: -71.0096 } },
  BWI: { code: 'BWI', name: 'Baltimore/Washington International', city: 'Baltimore', state: 'MD', country: 'US', coordinates: { lat: 39.1754, lng: -76.6684 } },
  CLT: { code: 'CLT', name: 'Charlotte Douglas International', city: 'Charlotte', state: 'NC', country: 'US', coordinates: { lat: 35.214, lng: -80.9431 } },
  DCA: { code: 'DCA', name: 'Ronald Reagan Washington National', city: 'Washington', state: 'DC', country: 'US', coordinates: { lat: 38.8521, lng: -77.0377 } },
  DEN: { code: 'DEN', name: 'Denver International', city: 'Denver', state: 'CO', country: 'US', coordinates: { lat: 39.8561, lng: -104.6737 } },
  DFW: { code: 'DFW', name: 'Dallas/Fort Worth International', city: 'Dallas', state: 'TX', country: 'US', coordinates: { lat: 32.8998, lng: -97.0403 } },
  DTW: { code: 'DTW', name: 'Detroit Metropolitan Wayne County', city: 'Detroit', state: 'MI', country: 'US', coordinates: { lat: 42.2124, lng: -83.3534 } },
  EWR: { code: 'EWR', name: 'Newark Liberty International', city: 'Newark', state: 'NJ', country: 'US', coordinates: { lat: 40.6925, lng: -74.1687 } },
  FLL: { code: 'FLL', name: 'Fort Lauderdale-Hollywood International', city: 'Fort Lauderdale', state: 'FL', country: 'US', coordinates: { lat: 26.0726, lng: -80.1527 } },
  IAD: { code: 'IAD', name: 'Washington Dulles International', city: 'Washington', state: 'DC', country: 'US', coordinates: { lat: 38.9445, lng: -77.4558 } },
  IAH: { code: 'IAH', name: 'George Bush Intercontinental', city: 'Houston', state: 'TX', country: 'US', coordinates: { lat: 29.9902, lng: -95.3368 } },
  JFK: { code: 'JFK', name: 'John F. Kennedy International', city: 'New York', state: 'NY', country: 'US', coordinates: { lat: 40.6413, lng: -73.7781 } },
  LAS: { code: 'LAS', name: 'Harry Reid International', city: 'Las Vegas', state: 'NV', country: 'US', coordinates: { lat: 36.084, lng: -115.1537 } },
  LAX: { code: 'LAX', name: 'Los Angeles International', city: 'Los Angeles', state: 'CA', country: 'US', coordinates: { lat: 33.9425, lng: -118.4081 } },
  LGA: { code: 'LGA', name: 'LaGuardia', city: 'New York', state: 'NY', country: 'US', coordinates: { lat: 40.7769, lng: -73.874 } },
  MCO: { code: 'MCO', name: 'Orlando International', city: 'Orlando', state: 'FL', country: 'US', coordinates: { lat: 28.4312, lng: -81.3081 } },
  MDW: { code: 'MDW', name: 'Chicago Midway International', city: 'Chicago', state: 'IL', country: 'US', coordinates: { lat: 41.786, lng: -87.7524 } },
  MIA: { code: 'MIA', name: 'Miami International', city: 'Miami', state: 'FL', country: 'US', coordinates: { lat: 25.7959, lng: -80.287 } },
  MSP: { code: 'MSP', name: 'Minneapolis-Saint Paul International', city: 'Minneapolis', state: 'MN', country: 'US', coordinates: { lat: 44.882, lng: -93.2218 } },
  ORD: { code: 'ORD', name: "O'Hare International", city: 'Chicago', state: 'IL', country: 'US', coordinates: { lat: 41.9742, lng: -87.9073 } },
  PDX: { code: 'PDX', name: 'Portland International', city: 'Portland', state: 'OR', country: 'US', coordinates: { lat: 45.5898, lng: -122.5951 } },
  PHL: { code: 'PHL', name: 'Philadelphia International', city: 'Philadelphia', state: 'PA', country: 'US', coordinates: { lat: 39.8744, lng: -75.2424 } },
  PHX: { code: 'PHX', name: 'Phoenix Sky Harbor International', city: 'Phoenix', state: 'AZ', country: 'US', coordinates: { lat: 33.4373, lng: -112.0078 } },
  SEA: { code: 'SEA', name: 'Seattle-Tacoma International', city: 'Seattle', state: 'WA', country: 'US', coordinates: { lat: 47.4502, lng: -122.3088 } },
  SFO: { code: 'SFO', name: 'San Francisco International', city: 'San Francisco', state: 'CA', country: 'US', coordinates: { lat: 37.6213, lng: -122.379 } },
  SLC: { code: 'SLC', name: 'Salt Lake City International', city: 'Salt Lake City', state: 'UT', country: 'US', coordinates: { lat: 40.7899, lng: -111.9791 } },
  TPA: { code: 'TPA', name: 'Tampa International', city: 'Tampa', state: 'FL', country: 'US', coordinates: { lat: 27.9755, lng: -82.5332 } },
};

/**
 * Mapping of city names (lowercase) to their primary airport codes.
 */
export const CITY_TO_AIRPORT: Record<string, string> = {
  'atlanta': 'ATL',
  'austin': 'AUS',
  'baltimore': 'BWI',
  'boston': 'BOS',
  'charlotte': 'CLT',
  'chicago': 'ORD',
  'dallas': 'DFW',
  'denver': 'DEN',
  'detroit': 'DTW',
  'fort lauderdale': 'FLL',
  'houston': 'IAH',
  'las vegas': 'LAS',
  'los angeles': 'LAX',
  'miami': 'MIA',
  'minneapolis': 'MSP',
  'new york': 'JFK',
  'newark': 'EWR',
  'orlando': 'MCO',
  'philadelphia': 'PHL',
  'phoenix': 'PHX',
  'portland': 'PDX',
  'salt lake city': 'SLC',
  'san francisco': 'SFO',
  'seattle': 'SEA',
  'tampa': 'TPA',
  'washington': 'DCA',
  'washington dc': 'DCA',
};

/**
 * Find the nearest airport for a given city name.
 */
export function findAirportForCity(city: string): AirportInfo | undefined {
  const normalized = city.toLowerCase().trim();

  // Direct lookup
  const code = CITY_TO_AIRPORT[normalized];
  if (code) return AIRPORTS[code];

  // Partial match
  for (const [cityName, airportCode] of Object.entries(CITY_TO_AIRPORT)) {
    if (normalized.includes(cityName) || cityName.includes(normalized)) {
      return AIRPORTS[airportCode];
    }
  }

  // Check airport names
  for (const airport of Object.values(AIRPORTS)) {
    if (airport.city.toLowerCase() === normalized) {
      return airport;
    }
  }

  return undefined;
}

/**
 * Calculate approximate distance in miles between two coordinates (Haversine formula).
 */
export function distanceMiles(a: GeoCoordinates, b: GeoCoordinates): number {
  const R = 3959; // Earth's radius in miles
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);
  const h = sinDLat * sinDLat + Math.cos(toRad(a.lat)) * Math.cos(toRad(b.lat)) * sinDLng * sinDLng;
  return R * 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}

/**
 * Estimate driving time in minutes based on distance.
 * Uses a rough average of 50 mph for highway driving.
 */
export function estimateDrivingMinutes(miles: number): number {
  return Math.round((miles / 50) * 60);
}
