import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { getConfig } from '../config/index.js';
import { userStore } from './store.js';
import type { User } from '../types/index.js';

export interface JwtPayload {
  userId: string;
  email: string;
  role: string;
  organizationId: string | null;
}

export interface AuthResult {
  user: Omit<User, 'passwordHash'>;
  token: string;
}

/**
 * Register a new user account.
 */
export async function registerUser(
  email: string,
  password: string,
  name: string
): Promise<AuthResult> {
  const existing = userStore.getUserByEmail(email);
  if (existing) {
    throw new Error('Email already registered');
  }

  const passwordHash = await bcrypt.hash(password, 12);
  const now = new Date().toISOString();

  // Auto-detect organization by email domain
  const domain = email.split('@')[1];
  let organizationId: string | null = null;
  if (domain) {
    const org = userStore.getOrganizationByDomain(domain);
    if (org) {
      organizationId = org.id;
    }
  }

  const user: User = {
    id: uuidv4(),
    email,
    name,
    passwordHash,
    organizationId,
    role: 'member',
    createdAt: now,
    updatedAt: now,
  };

  userStore.createUser(user);

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Authenticate an existing user.
 */
export async function loginUser(email: string, password: string): Promise<AuthResult> {
  const user = userStore.getUserByEmail(email);
  if (!user) {
    throw new Error('Invalid email or password');
  }

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) {
    throw new Error('Invalid email or password');
  }

  const token = generateToken(user);
  const { passwordHash: _, ...safeUser } = user;
  return { user: safeUser, token };
}

/**
 * Validate a JWT and return the payload.
 */
export function verifyToken(token: string): JwtPayload {
  const config = getConfig();
  try {
    return jwt.verify(token, config.JWT_SECRET) as JwtPayload;
  } catch {
    throw new Error('Invalid or expired token');
  }
}

/**
 * Get user from token, stripping sensitive fields.
 */
export function getUserFromToken(token: string): Omit<User, 'passwordHash'> | undefined {
  const payload = verifyToken(token);
  const user = userStore.getUserById(payload.userId);
  if (!user) return undefined;
  const { passwordHash: _, ...safeUser } = user;
  return safeUser;
}

function generateToken(user: User): string {
  const config = getConfig();
  const payload: JwtPayload = {
    userId: user.id,
    email: user.email,
    role: user.role,
    organizationId: user.organizationId,
  };
  return jwt.sign(payload, config.JWT_SECRET, { expiresIn: '7d' });
}
