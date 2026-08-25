import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID, createHmac } from "crypto";
import bcrypt from "bcryptjs";

type LocalUser = {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
  createdAt: string;
};

type ResetToken = {
  email: string;
  codeHash: string;
  expiresAt: number;
};

type LocalStore = {
  users: LocalUser[];
  shortlists: Record<string, string[]>;
  resetTokens: ResetToken[];
};

declare global {
  // Global cache to maintain in-memory state across serverless requests
  var __PAKS_STORE: LocalStore | undefined;
}

const HMAC_SECRET = process.env.AUTH_SECRET || "pak-uni-advisor-stateless-secret-2026";

// Target /tmp directory for writable filesystem access on Vercel / serverless
const tmpStorePath = path.join(os.tmpdir(), "pak_uni_advisor_store.json");
const fallbackStorePath = path.join(process.cwd(), "data", "runtime", "store.json");

function getStatelessOtpForBucket(email: string, bucket: number): string {
  const hmac = createHmac("sha256", HMAC_SECRET).update(`${email.toLowerCase().trim()}:${bucket}`).digest("hex");
  const num = parseInt(hmac.slice(0, 8), 16) % 1000000;
  return num.toString().padStart(6, "0");
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
  const store = await readStore();
  const normalizedEmail = email.toLowerCase().trim();

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
  const store = await readStore();
  const normalizedEmail = email.toLowerCase().trim();
  const user = store.users.find((item) => item.email === normalizedEmail);
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function createResetToken(email: string, customCode?: string): Promise<string> {
  const normalizedEmail = email.toLowerCase().trim();
  const store = await readStore();

  const currentBucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const otpCode = customCode || getStatelessOtpForBucket(normalizedEmail, currentBucket);

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
  const store = await readStore();

  // 1. Check in-memory / file store
  const token = store.resetTokens.find((item) => item.email === normalizedEmail);
  if (token && token.expiresAt >= Date.now() && await bcrypt.compare(cleanCode, token.codeHash)) {
    return true;
  }

  // 2. Check stateless HMAC bucket (current or previous 15-minute window)
  const currentBucket = Math.floor(Date.now() / (15 * 60 * 1000));
  const previousBucket = currentBucket - 1;

  const validCurrent = getStatelessOtpForBucket(normalizedEmail, currentBucket);
  const validPrevious = getStatelessOtpForBucket(normalizedEmail, previousBucket);

  if (cleanCode === validCurrent || cleanCode === validPrevious) {
    return true;
  }

  return false;
}

export async function resetPassword(email: string, code: string, password: string): Promise<boolean> {
  const normalizedEmail = email.toLowerCase().trim();

  const isValid = await verifyResetToken(normalizedEmail, code);
  if (!isValid) {
    return false;
  }

  const store = await readStore();
  let user = store.users.find((item) => item.email === normalizedEmail);
  const newHash = await bcrypt.hash(password, 12);

  if (user) {
    user.passwordHash = newHash;
  } else {
    // If user registered on a different serverless lambda instance, create/update entry now
    user = {
      id: randomUUID(),
      name: normalizedEmail.split("@")[0],
      email: normalizedEmail,
      passwordHash: newHash,
      createdAt: new Date().toISOString()
    };
    store.users.push(user);
  }

  store.resetTokens = store.resetTokens.filter((item) => item.email !== normalizedEmail);
  await writeStore(store);
  return true;
}

export async function getStoredShortlist(userId: string) {
  const store = await readStore();
  return store.shortlists[userId] || [];
}

export async function updateStoredShortlist(userId: string, universityId: string, add: boolean) {
  const store = await readStore();
  const shortlist = new Set(store.shortlists[userId] || []);
  if (add) shortlist.add(universityId);
  else shortlist.delete(universityId);
  store.shortlists[userId] = Array.from(shortlist);
  await writeStore(store);
}