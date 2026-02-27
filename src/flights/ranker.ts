import type { FlightOffer, UserPreferences } from '../types/index.js';

/**
 * Honest, non-deceptive flight ranking system.
 *
 * This ranker scores flights based SOLELY on user preferences.
 * There are no commission biases, no hidden markups, no deceptive patterns.
 * The scoring criteria are transparent and explainable.
 */

export interface RankedOffer {
  offer: FlightOffer;
  score: number;
  rank: number;
  reasoning: string[];
}

export interface RankingWeights {
  price: number;
  duration: number;
  stops: number;
  departureTime: number;
  airline: number;
}

/**
 * Rank flight offers based on user preferences.
 * Returns offers sorted by score (highest = best match).
 */
export function rankFlights(
  offers: FlightOffer[],
  preferences: UserPreferences
): RankedOffer[] {
  if (offers.length === 0) return [];

  const weights = deriveWeights(preferences);

  // Normalize values for scoring
  const prices = offers.map((o) => o.totalPrice);
  const durations = offers.map((o) => o.totalDurationMinutes);
  const minPrice = Math.min(...prices);
  const maxPrice = Math.max(...prices);
  const minDuration = Math.min(...durations);
  const maxDuration = Math.max(...durations);
  const maxStops = Math.max(...offers.map((o) => o.stops));

  const scored = offers.map((offer) => {
    const reasoning: string[] = [];

    // Price score (0-1, 1 = cheapest)
    const priceRange = maxPrice - minPrice || 1;
    const priceScore = 1 - (offer.totalPrice - minPrice) / priceRange;
    reasoning.push(`Price: $${offer.totalPrice} (${Math.round(priceScore * 100)}% score)`);

    // Duration score (0-1, 1 = shortest)
    const durationRange = maxDuration - minDuration || 1;
    const durationScore = 1 - (offer.totalDurationMinutes - minDuration) / durationRange;
    const hours = Math.floor(offer.totalDurationMinutes / 60);
    const mins = offer.totalDurationMinutes % 60;
    reasoning.push(`Duration: ${hours}h ${mins}m (${Math.round(durationScore * 100)}% score)`);

    // Stops score (0-1, 1 = nonstop)
    const stopsMax = maxStops || 1;
    const stopsScore = 1 - offer.stops / stopsMax;
    reasoning.push(`Stops: ${offer.stops} (${Math.round(stopsScore * 100)}% score)`);

    // Departure time score (based on user preference)
    const departureScore = scoreDepartureTime(offer, preferences);
    reasoning.push(`Departure time fit: ${Math.round(departureScore * 100)}%`);

    // Airline preference score
    const airlineScore = scoreAirline(offer, preferences);
    if (airlineScore > 0.5) {
      reasoning.push(`Preferred airline match`);
    }

    // Weighted total
    const totalScore =
      weights.price * priceScore +
      weights.duration * durationScore +
      weights.stops * stopsScore +
      weights.departureTime * departureScore +
      weights.airline * airlineScore;

    // Transparently note trade-offs
    if (priceScore > 0.8 && durationScore < 0.4) {
      reasoning.push(`Trade-off: cheapest option but longer travel time`);
    }
    if (durationScore > 0.8 && priceScore < 0.4) {
      reasoning.push(`Trade-off: fastest option but higher price`);
    }
    if (stopsScore === 1 && priceScore < 0.5) {
      reasoning.push(`Trade-off: nonstop but costs more`);
    }

    return { offer, score: totalScore, rank: 0, reasoning };
  });

  // Sort by score descending
  scored.sort((a, b) => b.score - a.score);

  // Assign ranks
  scored.forEach((item, index) => {
    item.rank = index + 1;
  });

  return scored;
}

/**
 * Derive ranking weights from user preferences.
 * This makes the ranking transparent and explainable.
 */
function deriveWeights(prefs: UserPreferences): RankingWeights {
  switch (prefs.budgetPriority) {
    case 'cheapest':
      return { price: 0.45, duration: 0.15, stops: 0.15, departureTime: 0.15, airline: 0.10 };
    case 'best_experience':
      return { price: 0.10, duration: 0.25, stops: 0.25, departureTime: 0.20, airline: 0.20 };
    case 'best_value':
      return { price: 0.30, duration: 0.20, stops: 0.20, departureTime: 0.15, airline: 0.15 };
    case 'no_preference':
    default:
      return { price: 0.25, duration: 0.25, stops: 0.20, departureTime: 0.15, airline: 0.15 };
  }
}

/**
 * Score how well the departure time matches user preferences.
 */
function scoreDepartureTime(offer: FlightOffer, prefs: UserPreferences): number {
  if (prefs.timePreference === 'no_preference' || offer.segments.length === 0) return 0.5;

  const firstSegment = offer.segments[0]!;
  const departureHour = new Date(firstSegment.departureTime).getHours();

  const preferenceWindows: Record<string, [number, number]> = {
    early_morning: [5, 8],
    morning: [8, 12],
    afternoon: [12, 17],
    evening: [17, 21],
    red_eye: [21, 5],
  };

  const [start, end] = preferenceWindows[prefs.timePreference] ?? [0, 24];

  if (start < end) {
    // Normal range
    if (departureHour >= start && departureHour < end) return 1.0;
    const distFromWindow = Math.min(
      Math.abs(departureHour - start),
      Math.abs(departureHour - end)
    );
    return Math.max(0, 1 - distFromWindow * 0.15);
  } else {
    // Wrapping range (red_eye: 21-5)
    if (departureHour >= start || departureHour < end) return 1.0;
    const distFromStart = Math.abs(departureHour - start);
    const distFromEnd = departureHour < 12 ? departureHour - end : 24 - departureHour + end;
    return Math.max(0, 1 - Math.min(distFromStart, Math.abs(distFromEnd)) * 0.15);
  }
}

/**
 * Score how well the airline matches user preferences.
 */
function scoreAirline(offer: FlightOffer, prefs: UserPreferences): number {
  if (offer.segments.length === 0) return 0.5;

  const airlines = new Set(offer.segments.map((s) => s.airline));

  // Penalty for avoided airlines
  for (const airline of airlines) {
    if (prefs.avoidAirlines.includes(airline)) return 0.0;
  }

  // Bonus for preferred airlines
  if (prefs.preferredAirlines.length === 0) return 0.5;

  const preferredCount = [...airlines].filter((a) => prefs.preferredAirlines.includes(a)).length;
  return preferredCount > 0 ? 0.8 + (preferredCount / airlines.size) * 0.2 : 0.3;
}

/**
 * Generate a human-readable comparison of top options.
 * This is used by the agent to present honest trade-offs to the user.
 */
export function generateHonestComparison(ranked: RankedOffer[]): string {
  if (ranked.length === 0) return 'No flights found for this route and date.';

  const top = ranked.slice(0, 5);
  const lines: string[] = ['Here are your top flight options, ranked by your preferences:\n'];

  for (const item of top) {
    const { offer, rank, reasoning } = item;
    const firstSeg = offer.segments[0]!;
    const lastSeg = offer.segments[offer.segments.length - 1]!;
    const depTime = new Date(firstSeg.departureTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const arrTime = new Date(lastSeg.arrivalTime).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
    const hours = Math.floor(offer.totalDurationMinutes / 60);
    const mins = offer.totalDurationMinutes % 60;

    lines.push(`#${rank}. ${firstSeg.airlineName} - $${offer.totalPrice}`);
    lines.push(`   ${firstSeg.origin} ${depTime} -> ${lastSeg.destination} ${arrTime}`);
    lines.push(`   ${hours}h ${mins}m | ${offer.stops === 0 ? 'Nonstop' : `${offer.stops} stop${offer.stops > 1 ? 's' : ''}`}`);
    lines.push(`   ${reasoning.filter((r) => r.startsWith('Trade-off')).join('. ') || 'Good all-around option'}`);

    if (offer.deepLink) {
      lines.push(`   Book directly: ${offer.deepLink}`);
    }
    lines.push('');
  }

  return lines.join('\n');
}
