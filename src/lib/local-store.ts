import { promises as fs } from "fs";
import path from "path";
import os from "os";
import { randomUUID } from "crypto";
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

// Target /tmp directory for writable filesystem access on Vercel / serverless
const tmpStorePath = path.join(os.tmpdir(), "pak_uni_advisor_store.json");
const fallbackStorePath = path.join(process.cwd(), "data", "runtime", "store.json");

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
  const user = store.users.find((item) => item.email === email.toLowerCase().trim());
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) return null;
  return { id: user.id, name: user.name, email: user.email };
}

export async function createResetToken(email: string, code: string) {
  const store = await readStore();
  store.resetTokens = store.resetTokens.filter((token) => token.email !== email);
  store.resetTokens.push({
    email,
    codeHash: await bcrypt.hash(code, 10),
    expiresAt: Date.now() + 15 * 60 * 1000
  });
  await writeStore(store);
}

export async function resetPassword(email: string, code: string, password: string) {
  const store = await readStore();
  const token = store.resetTokens.find((item) => item.email === email);
  const user = store.users.find((item) => item.email === email);
  if (!token || !user || token.expiresAt < Date.now() || !(await bcrypt.compare(code, token.codeHash))) {
    return false;
  }
  user.passwordHash = await bcrypt.hash(password, 12);
  store.resetTokens = store.resetTokens.filter((item) => item !== token);
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

export async function verifyResetToken(email: string, code: string) {
  const store = await readStore();
  const token = store.resetTokens.find((item) => item.email === email);
  return Boolean(token && token.expiresAt >= Date.now() && await bcrypt.compare(code, token.codeHash));
}