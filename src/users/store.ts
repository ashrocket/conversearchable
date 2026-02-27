import type { User, Organization } from '../types/index.js';

/**
 * In-memory data store for users and organizations.
 * In production, this would be backed by PostgreSQL.
 */
class UserStore {
  private users: Map<string, User> = new Map();
  private organizations: Map<string, Organization> = new Map();
  private emailIndex: Map<string, string> = new Map(); // email -> userId

  // ---- Users ----

  createUser(user: User): User {
    if (this.emailIndex.has(user.email)) {
      throw new Error(`User with email ${user.email} already exists`);
    }
    this.users.set(user.id, user);
    this.emailIndex.set(user.email, user.id);
    return user;
  }

  getUserById(id: string): User | undefined {
    return this.users.get(id);
  }

  getUserByEmail(email: string): User | undefined {
    const userId = this.emailIndex.get(email);
    if (!userId) return undefined;
    return this.users.get(userId);
  }

  updateUser(id: string, updates: Partial<User>): User | undefined {
    const existing = this.users.get(id);
    if (!existing) return undefined;

    const updated = { ...existing, ...updates, id: existing.id, updatedAt: new Date().toISOString() };
    this.users.set(id, updated);

    if (updates.email && updates.email !== existing.email) {
      this.emailIndex.delete(existing.email);
      this.emailIndex.set(updates.email, id);
    }

    return updated;
  }

  getUsersByOrganization(orgId: string): User[] {
    return Array.from(this.users.values()).filter((u) => u.organizationId === orgId);
  }

  getAllUsers(): User[] {
    return Array.from(this.users.values());
  }

  // ---- Organizations ----

  createOrganization(org: Organization): Organization {
    this.organizations.set(org.id, org);
    return org;
  }

  getOrganizationById(id: string): Organization | undefined {
    return this.organizations.get(id);
  }

  getOrganizationByDomain(domain: string): Organization | undefined {
    return Array.from(this.organizations.values()).find((o) => o.domain === domain);
  }

  getAllOrganizations(): Organization[] {
    return Array.from(this.organizations.values());
  }

  // ---- Demo Seeding ----

  /**
   * Seed a demo organization with team members in different cities.
   * Idempotent: skips creation if users already exist (matched by email).
   */
  seedDemoOrganization(leadUserId: string): { orgId: string; memberIds: string[] } {
    const now = new Date().toISOString();

    // Check if already seeded
    const existingLead = this.getUserById(leadUserId);
    if (existingLead?.organizationId) {
      const existingMembers = this.getUsersByOrganization(existingLead.organizationId);
      return {
        orgId: existingLead.organizationId,
        memberIds: existingMembers.filter((u) => u.id !== leadUserId).map((u) => u.id),
      };
    }

    // Create organization
    const orgId = crypto.randomUUID();
    this.createOrganization({
      id: orgId,
      name: 'Acme Technologies',
      domain: 'acmetech.com',
      preferredAirlines: [],
      createdAt: now,
    });

    // Update lead user
    this.updateUser(leadUserId, { organizationId: orgId, role: 'admin' });

    // Team members with home cities
    const teamMembers = [
      { name: 'Sarah Chen', email: 'sarah@acmetech.com', homeCity: 'San Francisco', homeAirport: 'SFO' },
      { name: 'Marcus Johnson', email: 'marcus@acmetech.com', homeCity: 'Chicago', homeAirport: 'ORD' },
      { name: 'Priya Patel', email: 'priya@acmetech.com', homeCity: 'Austin', homeAirport: 'AUS' },
      { name: 'David Kim', email: 'david@acmetech.com', homeCity: 'New York', homeAirport: 'JFK' },
    ];

    const memberIds: string[] = [];
    for (const member of teamMembers) {
      // Skip if already exists
      const existing = this.getUserByEmail(member.email);
      if (existing) {
        this.updateUser(existing.id, { organizationId: orgId });
        memberIds.push(existing.id);
        continue;
      }

      const id = crypto.randomUUID();
      this.createUser({
        id,
        email: member.email,
        name: member.name,
        passwordHash: 'demo-hash',
        organizationId: orgId,
        role: 'member',
        homeCity: member.homeCity,
        homeAirport: member.homeAirport,
        createdAt: now,
        updatedAt: now,
      });
      memberIds.push(id);
    }

    return { orgId, memberIds };
  }
}

export const userStore = new UserStore();
