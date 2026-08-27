import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomInt, randomUUID } from "crypto";
import bcrypt from "bcryptjs";
import { getXataClient, hasXataPersistence } from "@/lib/xata";

export type LocalUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
  preferences?: Record<string, unknown>;
};

export type ResetToken = {
  email: string;
  codeHash: string;
  expiresAt: number;
};

export type LocalStore = {
  users: LocalUser[];
  shortlists: Record<string, string[]>;
  resetTokens: ResetToken[];
};

declare global {
  // Global cache to maintain in-memory state across serverless requests in same process
  var __PAKS_STORE: LocalStore | undefined;
}

// Target /tmp directory for writable filesystem access on Vercel / serverless
const tmpStorePath = path.join(os.tmpdir(), "pak_uni_advisor_store.json");
const fallbackStorePath = path.join(process.cwd(), "data", "runtime", "store.json");

export class PersistenceUnavailableError extends Error {
  constructor() {
    super("A durable database is required for account features in production.");
  }
}

function requirePersistentStore() {
  if (process.env.NODE_ENV === "production" && !hasXataPersistence()) {
    throw new PersistenceUnavailableError();
  }
}

type RemoteRecord = {
  id: string;
  email: string;
  name: string;
  password: string;
  createdAt: string | Date;
  preferences?: Record<string, unknown>;
};

function remoteTables() {
  const db = getXataClient().db as unknown as {
    users: {
      filter: (filter: Record<string, unknown>) => { getFirst: () => Promise<RemoteRecord | null>; getMany: () => Promise<RemoteRecord[]> };
      create: (data: Record<string, unknown>) => Promise<RemoteRecord>;
      update: (id: string, data: Record<string, unknown>) => Promise<RemoteRecord>;
    };
    shortlists: {
      filter: (filter: Record<string, unknown>) => { getFirst: () => Promise<{ id: string; universityId: string } | null>; getMany: () => Promise<{ id: string; universityId: string }[]> };
      create: (data: Record<string, unknown>) => Promise<unknown>;
      delete: (id: string) => Promise<unknown>;
    };
  };
  return db;
}

function toPublicUser(user: RemoteRecord | LocalUser) {
  return { id: user.id, name: user.name, email: user.email };
}

async function readStore(): Promise<LocalStore> {
  if (globalThis.__PAKS_STORE) {
    return globalThis.__PAKS_STORE;
  }

  let store: LocalStore = { users: [], shortlists: {}, resetTokens: [] };

  try {
    const data = await fs.readFile(tmpStorePath, "utf8");
    store = JSON.parse(data) as LocalStore;
  } catch {
    try {
      const data = await fs.readFile(fallbackStorePath, "utf8");
      store = JSON.parse(data) as LocalStore;
    } catch {
      store = { users: [], shortlists: {}, resetTokens: [] };
    }
  }

  globalThis.__PAKS_STORE = store;
  return store;
}

async function writeStore(store: LocalStore) {
  globalThis.__PAKS_STORE = store;

  try {
    await fs.mkdir(path.dirname(tmpStorePath), { recursive: true });
    await fs.writeFile(tmpStorePath, JSON.stringify(store, null, 2), "utf8");
  } catch (err) {
    console.warn("Could not persist store to disk, keeping in memory:", err);
  }
}

export async function registerUser(name: string, email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();

  requirePersistentStore();
  if (hasXataPersistence()) {
    const users = remoteTables().users;
    if (await users.filter({ email: normalizedEmail }).getFirst()) {
      return { error: "An account with this email already exists." };
    }
    const user = await users.create({
      email: normalizedEmail,
      name: name.trim(),
      password: await bcrypt.hash(password, 12),
      preferences: {},
      createdAt: new Date().toISOString()
    });
    return { user: toPublicUser(user) };
  }

  const store = await readStore();

  if (store.users.some((user) => user.email === normalizedEmail)) {
    return { error: "An account with this email already exists." };
  }

  const user: LocalUser = {
    id: randomUUID(),
    name: name.trim(),
    email: normalizedEmail,
    passwordHash: await bcrypt.hash(password, 12),
    createdAt: new Date().toISOString()
  };
  
  store.users.push(user);
  await writeStore(store);

  return { user: { id: user.id, name: user.name, email: user.email } };
}

export async function authenticateUser(email: string, password: string) {
  const normalizedEmail = email.toLowerCase().trim();
  if (hasXataPersistence()) {
    const user = await remoteTables().users.filter({ email: normalizedEmail }).getFirst();
    if (!user || !(await bcrypt.compare(password, user.password))) return null;
    return toPublicUser(user);
  }
  if (process.env.NODE_ENV === "production") return null;
  const store = await readStore();
  const user = store.users.find((item) => item.email === normalizedEmail);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function createResetToken(email: string, customCode?: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  requirePersistentStore();
  const otpCode = customCode || randomInt(0, 1_000_000).toString().padStart(6, "0");

  if (hasXataPersistence()) {
    const users = remoteTables().users;
    const user = await users.filter({ email: normalizedEmail }).getFirst();
    if (!user) return "";
    const preferences = { ...(user.preferences || {}), resetCodeHash: await bcrypt.hash(otpCode, 10), resetExpiresAt: Date.now() + 15 * 60 * 1000 };
    await users.update(user.id, { preferences });
    return otpCode;
  }

  const store = await readStore();

  store.resetTokens = store.resetTokens.filter((token) => token.email !== normalizedEmail);
  store.resetTokens.push({
    email: normalizedEmail,
    codeHash: await bcrypt.hash(otpCode, 10),
    expiresAt: Date.now() + 15 * 60 * 1000
  });
  await writeStore(store);

  return otpCode;
}

export async function verifyResetToken(email: string, code: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  if (hasXataPersistence()) {
    const user = await remoteTables().users.filter({ email: normalizedEmail }).getFirst();
    const resetCodeHash = user?.preferences?.resetCodeHash;
    const resetExpiresAt = user?.preferences?.resetExpiresAt;
    return typeof resetCodeHash === "string" && typeof resetExpiresAt === "number" && resetExpiresAt >= Date.now() && await bcrypt.compare(cleanCode, resetCodeHash);
  }
  if (process.env.NODE_ENV === "production") return false;
  const store = await readStore();

  // 1. Check in-memory / file store
  const token = store.resetTokens.find((item) => item.email === normalizedEmail);
  if (token && token.expiresAt >= Date.now() && await bcrypt.compare(cleanCode, token.codeHash)) {
    return true;
  }

  return false;
}

export async function resetPassword(email: string, code: string, password: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  requirePersistentStore();
  if (hasXataPersistence()) {
    const users = remoteTables().users;
    const user = await users.filter({ email: normalizedEmail }).getFirst();
    const valid = await verifyResetToken(normalizedEmail, code);
    if (!user || !valid) return false;
    const preferences = { ...(user.preferences || {}) };
    delete preferences.resetCodeHash;
    delete preferences.resetExpiresAt;
    await users.update(user.id, { password: await bcrypt.hash(password, 12), preferences });
    return true;
  }

  if (!(await verifyResetToken(normalizedEmail, code))) return false;

  const store = await readStore();
  const user = store.users.find((item) => item.email === normalizedEmail);
  const newHash = await bcrypt.hash(password, 12);

  if (!user) return false;
  user.passwordHash = newHash;

  store.resetTokens = store.resetTokens.filter((item) => item.email !== normalizedEmail);
  await writeStore(store);
  return true;
}

export async function getStoredShortlist(userId: string) {
  if (hasXataPersistence()) {
    const rows = await remoteTables().shortlists.filter({ userId }).getMany();
    return rows.map(row => row.universityId);
  }
  if (process.env.NODE_ENV === "production") return [];
  const store = await readStore();
  return store.shortlists[userId] || [];
}

export async function updateStoredShortlist(userId: string, universityId: string, add: boolean) {
  requirePersistentStore();
  if (hasXataPersistence()) {
    const table = remoteTables().shortlists;
    const existing = await table.filter({ userId, universityId }).getFirst();
    if (add && !existing) await table.create({ userId, universityId, addedAt: new Date().toISOString() });
    if (!add && existing) await table.delete(existing.id);
    return;
  }
  const store = await readStore();
  const shortlist = new Set(store.shortlists[userId] || []);
  if (add) shortlist.add(universityId);
  else shortlist.delete(universityId);
  store.shortlists[userId] = Array.from(shortlist);
  await writeStore(store);
}
