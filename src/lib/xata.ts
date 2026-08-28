import { buildClient } from "@xata.io/client";
import type { University } from "@/types";
import masterJsonData from "@/../data/processed/master_universities.json";

// Types for Xata auto-generated client wrapper
const tables = [
  {
    name: "universities",
    columns: []
  }
] as const;

export class XataClient extends buildClient() {
  constructor(options = {}) {
    super(
      {
        databaseURL: process.env.XATA_DATABASE_URL || "",
        apiKey: process.env.XATA_API_KEY || "",
        branch: process.env.XATA_BRANCH || "main",
        ...options,
      },
      tables
    );
  }
}

let instance: XataClient | undefined = undefined;

export const getXataClient = () => {
  if (instance) return instance;
  instance = new XataClient();
  return instance;
};

/** Production user data must live in a durable database, never in a serverless filesystem. */
export const hasXataPersistence = () => Boolean(
  process.env.XATA_DATABASE_URL && process.env.XATA_API_KEY
);

// Fallback helper when Xata credentials are not active in environment
export const getLocalMasterUniversities = (): University[] => {
  return masterJsonData as unknown as University[];
};
