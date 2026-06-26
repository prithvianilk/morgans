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
    userAgent: process.env.HTTP_USER_AGENT ?? "morgans-cli/0.1",
  };
}
