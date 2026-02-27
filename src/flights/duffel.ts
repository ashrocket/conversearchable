import { Duffel } from '@duffel/api';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/index.js';
import { AIRPORTS } from '../locations/airports.js';
import type { FlightSearchRequest, FlightSearchResult, FlightOffer, FlightSegment } from '../types/index.js';

/**
 * Duffel API flight search integration.
 * Searches for real flights and returns honest, unbiased results.
 */
export class DuffelFlightService {
  private duffel: Duffel | null = null;

  private getClient(): Duffel {
    if (!this.duffel) {
      const config = getConfig();
      this.duffel = new Duffel({ token: config.DUFFEL_API_TOKEN ?? '' });
    }
    return this.duffel;
  }

  /**
   * Search for flights via the Duffel API.
   */
  async search(request: FlightSearchRequest): Promise<FlightSearchResult> {
    const config = getConfig();

    if (config.USE_MOCK_FLIGHTS) {
      return this.mockSearch(request);
    }

    return this.realSearch(request);
  }

  private async realSearch(request: FlightSearchRequest): Promise<FlightSearchResult> {
    const duffel = this.getClient();

    const slices: Array<{ origin: string; destination: string; departure_date: string }> = [
      {
        origin: request.origin,
        destination: request.destination,
        departure_date: request.departureDate,
      },
    ];

    if (request.returnDate) {
      slices.push({
        origin: request.destination,
        destination: request.origin,
        departure_date: request.returnDate,
      });
    }

    const cabinMap: Record<string, string> = {
      economy: 'economy',
      premium_economy: 'premium_economy',
      business: 'business',
      first: 'first',
    };

    const offerRequest = await duffel.offerRequests.create({
      slices,
      passengers: [{ type: 'adult' }],
      cabin_class: cabinMap[request.cabinClass] as 'economy' | 'premium_economy' | 'business' | 'first',
      return_offers: true,
      max_connections: (request.maxStops ?? undefined) as 0 | 1 | 2 | undefined,
    });

    const offers: FlightOffer[] = (offerRequest.data.offers ?? []).map((offer) => {
      const segments: FlightSegment[] = offer.slices.flatMap((slice) =>
        slice.segments.map((seg) => ({
          airline: seg.marketing_carrier?.iata_code ?? seg.operating_carrier.iata_code ?? '',
          airlineName: seg.marketing_carrier?.name ?? seg.operating_carrier.name,
          flightNumber: `${seg.marketing_carrier?.iata_code ?? seg.operating_carrier.iata_code}${seg.marketing_carrier_flight_number}`,
          origin: seg.origin.iata_code ?? seg.origin.iata_city_code ?? '',
          originName: seg.origin.name,
          destination: seg.destination.iata_code ?? seg.destination.iata_city_code ?? '',
          destinationName: seg.destination.name,
          departureTime: seg.departing_at,
          arrivalTime: seg.arriving_at,
          durationMinutes: durationToMinutes(seg.duration ?? 'PT0M'),
          aircraft: seg.aircraft?.name,
          cabin: offer.slices[0]?.segments[0]?.passengers[0]?.cabin_class_marketing_name,
        }))
      );

      const totalStops = offer.slices.reduce(
        (sum, slice) => sum + Math.max(0, slice.segments.length - 1),
        0
      );

      const totalDuration = offer.slices.reduce(
        (sum, slice) => sum + durationToMinutes(slice.duration ?? 'PT0M'),
        0
      );

      return {
        id: offer.id,
        source: 'duffel',
        segments,
        totalPrice: parseFloat(offer.total_amount),
        currency: offer.total_currency,
        stops: totalStops,
        totalDurationMinutes: totalDuration,
        bookingUrl: undefined, // Duffel offers direct booking
        deepLink: undefined,
        expiresAt: offer.expires_at ?? undefined,
      };
    });

    // Filter by max price if specified
    const filtered = request.maxPrice
      ? offers.filter((o) => o.totalPrice <= request.maxPrice!)
      : offers;

    // Filter by preferred airlines if specified
    const finalOffers = request.preferredAirlines?.length
      ? filtered.sort((a, b) => {
          const aPreferred = a.segments.some((s) =>
            request.preferredAirlines!.includes(s.airline)
          );
          const bPreferred = b.segments.some((s) =>
            request.preferredAirlines!.includes(s.airline)
          );
          if (aPreferred && !bPreferred) return -1;
          if (!aPreferred && bPreferred) return 1;
          return 0;
        })
      : filtered;

    return {
      searchId: uuidv4(),
      request,
      offers: finalOffers,
      searchedAt: new Date().toISOString(),
      source: 'duffel',
    };
  }

  /**
   * Generate a realistic mock flight search for development.
   */
  private mockSearch(request: FlightSearchRequest): FlightSearchResult {
    const originAirport = AIRPORTS[request.origin];
    const destAirport = AIRPORTS[request.destination];
    const originName = originAirport?.name ?? request.origin;
    const destName = destAirport?.name ?? request.destination;

    const airlines = [
      { code: 'UA', name: 'United Airlines', hub: 'ORD' },
      { code: 'AA', name: 'American Airlines', hub: 'DFW' },
      { code: 'DL', name: 'Delta Air Lines', hub: 'ATL' },
      { code: 'WN', name: 'Southwest Airlines', hub: 'MDW' },
      { code: 'B6', name: 'JetBlue Airways', hub: 'JFK' },
      { code: 'AS', name: 'Alaska Airlines', hub: 'SEA' },
    ];

    const depDate = new Date(request.departureDate + 'T00:00:00');
    const offers: FlightOffer[] = [];

    // Generate 6-8 mock flight options
    const numOffers = 6 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numOffers; i++) {
      const airline = airlines[i % airlines.length]!;
      const isNonstop = i < 3; // First 3 are nonstop
      const departureHour = 6 + Math.floor(Math.random() * 14); // 6am to 8pm
      const flightDuration = isNonstop
        ? 120 + Math.floor(Math.random() * 180) // 2-5 hrs nonstop
        : 240 + Math.floor(Math.random() * 240); // 4-8 hrs with stops

      const departureTime = new Date(depDate);
      departureTime.setHours(departureHour, Math.floor(Math.random() * 4) * 15, 0, 0);
      const arrivalTime = new Date(departureTime.getTime() + flightDuration * 60 * 1000);

      const segments: FlightSegment[] = [];

      if (isNonstop) {
        segments.push({
          airline: airline.code,
          airlineName: airline.name,
          flightNumber: `${airline.code}${1000 + Math.floor(Math.random() * 9000)}`,
          origin: request.origin,
          originName,
          destination: request.destination,
          destinationName: destName,
          departureTime: departureTime.toISOString(),
          arrivalTime: arrivalTime.toISOString(),
          durationMinutes: flightDuration,
          aircraft: ['Boeing 737-800', 'Airbus A320', 'Boeing 737 MAX 8', 'Embraer E175'][Math.floor(Math.random() * 4)],
          cabin: request.cabinClass,
        });
      } else {
        // Connection through hub
        const connectAirport = airline.hub;
        const connectName = AIRPORTS[connectAirport]?.name ?? connectAirport;
        const leg1Duration = Math.floor(flightDuration * 0.45);
        const layover = 60 + Math.floor(Math.random() * 90);
        const leg2Duration = flightDuration - leg1Duration - layover;

        const leg1Arrival = new Date(departureTime.getTime() + leg1Duration * 60 * 1000);
        const leg2Departure = new Date(leg1Arrival.getTime() + layover * 60 * 1000);
        const leg2Arrival = new Date(leg2Departure.getTime() + leg2Duration * 60 * 1000);

        segments.push(
          {
            airline: airline.code,
            airlineName: airline.name,
            flightNumber: `${airline.code}${1000 + Math.floor(Math.random() * 9000)}`,
            origin: request.origin,
            originName,
            destination: connectAirport,
            destinationName: connectName,
            departureTime: departureTime.toISOString(),
            arrivalTime: leg1Arrival.toISOString(),
            durationMinutes: leg1Duration,
            aircraft: 'Boeing 737-800',
            cabin: request.cabinClass,
          },
          {
            airline: airline.code,
            airlineName: airline.name,
            flightNumber: `${airline.code}${1000 + Math.floor(Math.random() * 9000)}`,
            origin: connectAirport,
            originName: connectName,
            destination: request.destination,
            destinationName: destName,
            departureTime: leg2Departure.toISOString(),
            arrivalTime: leg2Arrival.toISOString(),
            durationMinutes: leg2Duration,
            aircraft: 'Embraer E175',
            cabin: request.cabinClass,
          }
        );
      }

      // Price: nonstop is more expensive
      const basePrice = 150 + Math.floor(Math.random() * 300);
      const nonstopPremium = isNonstop ? 50 + Math.floor(Math.random() * 100) : 0;
      const cabinMultiplier: Record<string, number> = {
        economy: 1,
        premium_economy: 1.6,
        business: 3.2,
        first: 5.5,
      };
      const price = Math.round((basePrice + nonstopPremium) * (cabinMultiplier[request.cabinClass] ?? 1));

      // Generate airline deep link
      const deepLink = `https://www.${airline.name.toLowerCase().replace(/\s+/g, '')}.com/booking?origin=${request.origin}&dest=${request.destination}&date=${request.departureDate}`;

      offers.push({
        id: `mock-offer-${uuidv4()}`,
        source: 'duffel-mock',
        segments,
        totalPrice: price,
        currency: 'USD',
        stops: isNonstop ? 0 : 1,
        totalDurationMinutes: flightDuration,
        bookingUrl: deepLink,
        deepLink,
        airlineDirectPrice: price + Math.floor(Math.random() * 10) - 5, // Slight variance
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
      });
    }

    // Sort by price by default
    offers.sort((a, b) => a.totalPrice - b.totalPrice);

    return {
      searchId: uuidv4(),
      request,
      offers,
      searchedAt: new Date().toISOString(),
      source: 'duffel-mock',
    };
  }
}

function durationToMinutes(iso8601Duration: string): number {
  const match = iso8601Duration.match(/PT(?:(\d+)H)?(?:(\d+)M)?/);
  if (!match) return 0;
  const hours = parseInt(match[1] ?? '0', 10);
  const minutes = parseInt(match[2] ?? '0', 10);
  return hours * 60 + minutes;
}
