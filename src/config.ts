import path from "node:path";

export type AppConfig = {
  baseUrl: string;
  discoveryUrl: string;
  stateFile: string;
  outputDir: string;
  tmpDir: string;
  googleClientId?: string;
  googleClientSecret?: string;
  googleRedirectUri: string;
  googleDriveFolderId?: string;
  googleTokenFile: string;
  pollIntervalMinutes: number;
  pollDays: number[];
  port: number;
  enableAuthRoutes: boolean;
  userAgent: string;
};

export function loadConfig(): AppConfig {
  const baseUrl = process.env.TCB_BASE_URL ?? "https://tcbonepiecechapters.com";
  const discoveryUrl = process.env.DISCOVERY_URL
    ? new URL(process.env.DISCOVERY_URL, baseUrl).toString()
    : baseUrl;

  return {
    baseUrl,
    discoveryUrl,
    stateFile: process.env.STATE_FILE ?? path.join("data", "processed-chapters.json"),
    outputDir: process.env.OUTPUT_DIR ?? path.join("downloads", "out"),
    tmpDir: process.env.TMP_DIR ?? path.join("downloads", "tmp"),
    googleClientId: process.env.GOOGLE_CLIENT_ID || undefined,
    googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || undefined,
    googleRedirectUri: process.env.GOOGLE_REDIRECT_URI ?? "http://localhost:3333/oauth/callback",
    googleDriveFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID || undefined,
    googleTokenFile: process.env.GOOGLE_TOKEN_FILE ?? path.join("data", "google-token.json"),
    pollIntervalMinutes: parsePositiveInteger(process.env.POLL_INTERVAL_MINUTES, 30),
    pollDays: parsePollDays(process.env.POLL_DAYS, [0, 6]),
    port: parsePositiveInteger(process.env.PORT, 3333),
    enableAuthRoutes: parseBoolean(process.env.ENABLE_AUTH_ROUTES, false),
    userAgent: process.env.HTTP_USER_AGENT ?? "morgans-cli/0.1",
  };
}

function parsePositiveInteger(value: string | undefined, fallback: number): number {
  if (!value) return fallback;
  const parsed = Number.parseInt(value, 10);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function parseBoolean(value: string | undefined, fallback: boolean): boolean {
  if (!value) return fallback;
  return ["1", "true", "yes", "on"].includes(value.toLowerCase());
}

function parsePollDays(value: string | undefined, fallback: number[]): number[] {
  if (!value) return fallback;

  const days = value
    .split(",")
    .map((day) => Number.parseInt(day.trim(), 10))
    .filter((day) => Number.isInteger(day) && day >= 0 && day <= 6);

  return days.length > 0 ? [...new Set(days)] : fallback;
}
