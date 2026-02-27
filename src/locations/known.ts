import { v4 as uuidv4 } from 'uuid';
import type { KnownLocation } from '../types/index.js';

/**
 * Store for known locations like client offices and conference venues.
 * These are locations that users visit repeatedly and should be recognized
 * automatically from calendar events.
 */
class KnownLocationStore {
  private locations: Map<string, KnownLocation> = new Map();

  constructor() {
    this.seedDefaults();
  }

  /**
   * Add a known location.
   */
  add(location: Omit<KnownLocation, 'id'>): KnownLocation {
    const loc: KnownLocation = { id: uuidv4(), ...location };
    this.locations.set(loc.id, loc);
    return loc;
  }

  /**
   * Find a known location by name or alias.
   */
  findByName(name: string): KnownLocation | undefined {
    const nameLower = name.toLowerCase();
    for (const loc of this.locations.values()) {
      if (loc.name.toLowerCase().includes(nameLower)) return loc;
      if (loc.aliases.some((a) => a.toLowerCase().includes(nameLower))) return loc;
    }
    return undefined;
  }

  /**
   * Find known locations in a city.
   */
  findByCity(city: string): KnownLocation[] {
    const cityLower = city.toLowerCase();
    return Array.from(this.locations.values()).filter(
      (loc) => loc.city.toLowerCase() === cityLower
    );
  }

  /**
   * Find locations for an organization.
   */
  findByOrganization(orgId: string): KnownLocation[] {
    return Array.from(this.locations.values()).filter(
      (loc) => loc.organizationId === orgId
    );
  }

  /**
   * Get all known locations.
   */
  getAll(): KnownLocation[] {
    return Array.from(this.locations.values());
  }

  /**
   * Seed some common conference venues and business locations.
   */
  private seedDefaults(): void {
    const defaults: Omit<KnownLocation, 'id'>[] = [
      {
        name: 'Moscone Center',
        city: 'San Francisco',
        state: 'CA',
        country: 'US',
        nearestAirport: 'SFO',
        coordinates: { lat: 37.7844, lng: -122.4006 },
        aliases: ['Moscone', 'Moscone West', 'Moscone South', 'Moscone North'],
      },
      {
        name: 'Las Vegas Convention Center',
        city: 'Las Vegas',
        state: 'NV',
        country: 'US',
        nearestAirport: 'LAS',
        coordinates: { lat: 36.1281, lng: -115.1526 },
        aliases: ['LVCC', 'Vegas Convention Center'],
      },
      {
        name: 'McCormick Place',
        city: 'Chicago',
        state: 'IL',
        country: 'US',
        nearestAirport: 'ORD',
        coordinates: { lat: 41.8517, lng: -87.6155 },
        aliases: ['McCormick'],
      },
      {
        name: 'Javits Center',
        city: 'New York',
        state: 'NY',
        country: 'US',
        nearestAirport: 'JFK',
        coordinates: { lat: 40.7579, lng: -74.0021 },
        aliases: ['Jacob Javits', 'Javits Convention Center'],
      },
      {
        name: 'Austin Convention Center',
        city: 'Austin',
        state: 'TX',
        country: 'US',
        nearestAirport: 'AUS',
        coordinates: { lat: 30.2634, lng: -97.7399 },
        aliases: ['ACC', 'SXSW venue'],
      },
      {
        name: 'The Venetian Resort',
        city: 'Las Vegas',
        state: 'NV',
        country: 'US',
        nearestAirport: 'LAS',
        coordinates: { lat: 36.1211, lng: -115.1697 },
        aliases: ['Venetian', 'The Venetian', 'Sands Expo'],
      },
    ];

    for (const loc of defaults) {
      this.add(loc);
    }
  }
}

export const knownLocationStore = new KnownLocationStore();
