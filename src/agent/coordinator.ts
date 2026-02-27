import { v4 as uuidv4 } from 'uuid';
import { userStore } from '../users/index.js';
import { calendarStore } from '../calendar/index.js';
import { DuffelFlightService, rankFlights } from '../flights/index.js';
import { preferenceStore } from '../preferences/index.js';
import type { TravelNeed, FlightOffer, UserPreferences } from '../types/index.js';

/**
 * Group travel coordinator.
 * When multiple users in an organization need to travel to the same destination,
 * this coordinator finds options that work for the group while respecting
 * individual preferences.
 */

export interface MemberAssignment {
  userId: string;
  homeAirport: string;
}

export interface GroupTravelPlan {
  id: string;
  organizationId: string;
  eventTitle: string;
  destination: string;
  destinationAirport: string;
  departureDate: string;
  returnDate?: string;
  members: GroupMemberPlan[];
  sharedFlightOptions: FlightOffer[];
  totalEstimatedCost: number;
  summary: string;
}

export interface GroupMemberPlan {
  userId: string;
  userName: string;
  preferences: UserPreferences;
  recommendedFlight: FlightOffer | null;
  alternativeFlights: FlightOffer[];
  notes: string[];
}

export class GroupTravelCoordinator {
  private flightService = new DuffelFlightService();

  /**
   * Detect overlapping travel needs within an organization.
   */
  detectGroupTravel(organizationId: string): Map<string, TravelNeed[]> {
    const orgUsers = userStore.getUsersByOrganization(organizationId);
    const overlapMap = new Map<string, TravelNeed[]>();

    // Collect all travel needs for org users
    const allNeeds: TravelNeed[] = [];
    for (const user of orgUsers) {
      const needs = calendarStore.getTravelNeedsForUser(user.id);
      allNeeds.push(...needs);
    }

    // Group by destination + approximate date (within 2 days)
    for (const need of allNeeds) {
      const key = `${need.destinationCity.toLowerCase()}_${need.departureDate}`;
      let found = false;

      for (const [existingKey, existingNeeds] of overlapMap) {
        const existingCity = existingKey.split('_')[0];
        const existingDate = existingKey.split('_')[1];
        if (
          existingCity === need.destinationCity.toLowerCase() &&
          existingDate &&
          Math.abs(new Date(existingDate).getTime() - new Date(need.departureDate).getTime()) <= 2 * 24 * 60 * 60 * 1000
        ) {
          existingNeeds.push(need);
          found = true;
          break;
        }
      }

      if (!found) {
        overlapMap.set(key, [need]);
      }
    }

    // Only return groups with 2+ travelers
    const groups = new Map<string, TravelNeed[]>();
    for (const [key, needs] of overlapMap) {
      const uniqueUsers = new Set(needs.map((n) => n.userId));
      if (uniqueUsers.size >= 2) {
        groups.set(key, needs);
      }
    }

    return groups;
  }

  /**
   * Create a coordinated group travel plan with multi-origin support.
   * Each member can fly from their own home airport.
   */
  async planGroupTravel(
    organizationId: string,
    travelNeeds: TravelNeed[],
    memberAssignments?: MemberAssignment[],
    eventTitle?: string,
  ): Promise<GroupTravelPlan> {
    const destination = travelNeeds[0]!.destinationCity;
    const departureDate = travelNeeds[0]!.departureDate;
    const returnDate = travelNeeds[0]!.returnDate;
    const destAirport = travelNeeds[0]!.destinationAirport ?? 'ORD';

    // Build a map of userId → homeAirport from assignments or travel needs
    const memberAirports = new Map<string, string>();
    if (memberAssignments) {
      for (const ma of memberAssignments) {
        memberAirports.set(ma.userId, ma.homeAirport);
      }
    } else {
      for (const need of travelNeeds) {
        memberAirports.set(need.userId, need.originAirport ?? 'JFK');
      }
    }

    // Search flights per unique origin airport
    const uniqueOrigins = [...new Set(memberAirports.values())];
    const searchResults = new Map<string, Awaited<ReturnType<typeof this.flightService.search>>>();
    for (const origin of uniqueOrigins) {
      // Skip search if origin === destination (local member)
      if (origin === destAirport) continue;
      const result = await this.flightService.search({
        origin,
        destination: destAirport,
        departureDate,
        returnDate,
        passengers: 1,
        cabinClass: 'economy',
      });
      searchResults.set(origin, result);
    }

    // For each member, rank flights from their specific origin
    const memberPlans: GroupMemberPlan[] = [];

    const members = memberAssignments ?? travelNeeds.map((n) => ({
      userId: n.userId,
      homeAirport: n.originAirport ?? 'JFK',
    }));

    for (const member of members) {
      const user = userStore.getUserById(member.userId);
      const prefs = preferenceStore.getPreferences(member.userId);
      const notes: string[] = [];

      // Local member — no flight needed
      if (member.homeAirport === destAirport) {
        notes.push(`Local (${member.homeAirport}) — no flight needed`);
        memberPlans.push({
          userId: member.userId,
          userName: user?.name ?? 'Unknown',
          preferences: prefs,
          recommendedFlight: null,
          alternativeFlights: [],
          notes,
        });
        continue;
      }

      const searchResult = searchResults.get(member.homeAirport);
      if (!searchResult) {
        notes.push('No flights found from ' + member.homeAirport);
        memberPlans.push({
          userId: member.userId,
          userName: user?.name ?? 'Unknown',
          preferences: prefs,
          recommendedFlight: null,
          alternativeFlights: [],
          notes,
        });
        continue;
      }

      const ranked = rankFlights(searchResult.offers, prefs);
      const recommended = ranked[0]?.offer ?? null;
      const alternatives = ranked.slice(1, 4).map((r) => r.offer);

      notes.push(`Flying from ${member.homeAirport}`);
      if (prefs.preferredAirlines.length > 0) {
        notes.push(`Prefers: ${prefs.preferredAirlines.join(', ')}`);
      }

      memberPlans.push({
        userId: member.userId,
        userName: user?.name ?? 'Unknown',
        preferences: prefs,
        recommendedFlight: recommended,
        alternativeFlights: alternatives,
        notes,
      });
    }

    // Collect best flights across all searches for shared options
    const allOffers = [...searchResults.values()].flatMap((r) => r.offers);
    const sharedFlights = allOffers.slice(0, 3);

    const totalCost = memberPlans.reduce(
      (sum, mp) => sum + (mp.recommendedFlight?.totalPrice ?? 0),
      0
    );

    const memberCount = memberPlans.length;
    const title = eventTitle ?? destination;
    const summary = `Group travel plan for ${memberCount} team members to ${title}:\n` +
      memberPlans
        .map((mp) => {
          if (!mp.recommendedFlight) {
            const reason = mp.notes[0] ?? 'No flight';
            return `- ${mp.userName}: ${reason}`;
          }
          return `- ${mp.userName}: $${mp.recommendedFlight.totalPrice} (${mp.notes.join(', ')})`;
        })
        .join('\n') +
      `\n\nEstimated total: $${totalCost}`;

    return {
      id: uuidv4(),
      organizationId,
      eventTitle: title,
      destination,
      destinationAirport: destAirport,
      departureDate,
      returnDate,
      members: memberPlans,
      sharedFlightOptions: sharedFlights,
      totalEstimatedCost: totalCost,
      summary,
    };
  }
}
