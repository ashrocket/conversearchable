import { getConfig } from '../config/index.js';
import type { GeoCoordinates } from '../types/index.js';
import { findAirportForCity, AIRPORTS, distanceMiles, estimateDrivingMinutes } from './airports.js';

export interface GeocodingResult {
  city: string;
  state?: string;
  country: string;
  coordinates: GeoCoordinates;
  formattedAddress: string;
}

export interface TravelDistanceResult {
  distanceMiles: number;
  estimatedDrivingMinutes: number;
  recommendFlight: boolean;
  originAirport: string;
  destinationAirport: string;
}

/**
 * Geocoding and location intelligence service.
 * Uses OpenCage in production, mock data in development.
 */
export class GeocodingService {
  /**
   * Geocode an address or place name to coordinates.
   */
  async geocode(query: string): Promise<GeocodingResult | null> {
    const config = getConfig();

    if (config.USE_MOCK_GEOCODING) {
      return this.mockGeocode(query);
    }

    return this.realGeocode(query);
  }

  /**
   * Calculate travel distance and determine if flight is recommended.
   */
  async calculateTravelDistance(
    originCity: string,
    destinationCity: string
  ): Promise<TravelDistanceResult | null> {
    const originAirport = findAirportForCity(originCity);
    const destAirport = findAirportForCity(destinationCity);

    if (!originAirport || !destAirport) {
      return null;
    }

    const miles = distanceMiles(originAirport.coordinates, destAirport.coordinates);
    const drivingMinutes = estimateDrivingMinutes(miles);

    // Recommend flight if driving would take more than 4 hours
    const recommendFlight = drivingMinutes > 240;

    return {
      distanceMiles: Math.round(miles),
      estimatedDrivingMinutes: drivingMinutes,
      recommendFlight,
      originAirport: originAirport.code,
      destinationAirport: destAirport.code,
    };
  }

  /**
   * Find the best airport for a city, considering user preferences.
   */
  resolveAirport(
    city: string,
    preferredAirports?: Record<string, string>
  ): string | undefined {
    // Check user's preferred airport for this city
    const cityLower = city.toLowerCase();
    if (preferredAirports) {
      for (const [prefCity, prefAirport] of Object.entries(preferredAirports)) {
        if (prefCity.toLowerCase() === cityLower) {
          return prefAirport;
        }
      }
    }

    // Default lookup
    const airport = findAirportForCity(city);
    return airport?.code;
  }

  private async realGeocode(query: string): Promise<GeocodingResult | null> {
    const config = getConfig();
    const apiKey = config.OPENCAGE_API_KEY;
    if (!apiKey) return null;

    try {
      const url = `https://api.opencagedata.com/geocode/v1/json?q=${encodeURIComponent(query)}&key=${apiKey}&limit=1&countrycode=us`;
      const response = await fetch(url);
      const data = await response.json() as {
        results?: Array<{
          geometry: { lat: number; lng: number };
          components: { city?: string; state?: string; country?: string };
          formatted: string;
        }>;
      };

      if (!data.results?.length) return null;

      const result = data.results[0]!;
      return {
        city: result.components.city ?? query,
        state: result.components.state,
        country: result.components.country ?? 'US',
        coordinates: {
          lat: result.geometry.lat,
          lng: result.geometry.lng,
        },
        formattedAddress: result.formatted,
      };
    } catch (error) {
      console.error('[Geocoding] API error:', error);
      return null;
    }
  }

  private mockGeocode(query: string): GeocodingResult | null {
    const queryLower = query.toLowerCase();

    // Try to match against known airports
    for (const airport of Object.values(AIRPORTS)) {
      if (
        queryLower.includes(airport.city.toLowerCase()) ||
        queryLower.includes(airport.state.toLowerCase())
      ) {
        return {
          city: airport.city,
          state: airport.state,
          country: airport.country,
          coordinates: airport.coordinates,
          formattedAddress: `${airport.city}, ${airport.state}, ${airport.country}`,
        };
      }
    }

    return null;
  }
}
