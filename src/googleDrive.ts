import { createServer } from "node:http";
import { createReadStream } from "node:fs";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { google } from "googleapis";
import open from "open";
import type { AppConfig } from "./config.js";

const DRIVE_FILE_SCOPE = "https://www.googleapis.com/auth/drive.file";

type StoredGoogleToken = {
  access_token?: string | null;
  refresh_token?: string | null;
  scope?: string;
  token_type?: string | null;
  expiry_date?: number | null;
};

export type GoogleDriveUploadResult = {
  id?: string;
  location: string;
};

export async function authorizeGoogleDrive(config: AppConfig): Promise<void> {
  const oauth2Client = createOAuthClient(config);
  const callbackUrl = new URL(config.googleRedirectUri);

  const authUrl = oauth2Client.generateAuthUrl({
    access_type: "offline",
    prompt: "consent",
    scope: [DRIVE_FILE_SCOPE],
  });

  const code = await waitForOAuthCode(callbackUrl, authUrl);
  const { tokens } = await oauth2Client.getToken(code);

  await mkdir(path.dirname(config.googleTokenFile), { recursive: true });
  await writeFile(config.googleTokenFile, `${JSON.stringify(tokens, null, 2)}\n`, "utf8");
}

export async function uploadToGoogleDrive(filePath: string, config: AppConfig): Promise<GoogleDriveUploadResult> {
  const oauth2Client = createOAuthClient(config);
  const token = await readStoredToken(config.googleTokenFile);
  oauth2Client.setCredentials(token);

  const drive = google.drive({ version: "v3", auth: oauth2Client });
  const fileName = path.basename(filePath);

  const response = await drive.files.create({
    requestBody: {
      name: fileName,
      parents: config.googleDriveFolderId ? [config.googleDriveFolderId] : undefined,
    },
    media: {
      mimeType: "application/zip",
      body: createReadStream(filePath),
    },
    fields: "id,name,webViewLink",
  });

  const id = response.data.id;
  const location = response.data.webViewLink ?? (id ? `google-drive://${id}` : fileName);
  return { id: id ?? undefined, location };
}

function createOAuthClient(config: AppConfig) {
  if (!config.googleClientId || !config.googleClientSecret) {
    throw new Error("GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are required for Google Drive API delivery");
  }

  return new google.auth.OAuth2(config.googleClientId, config.googleClientSecret, config.googleRedirectUri);
}

async function readStoredToken(tokenFile: string): Promise<StoredGoogleToken> {
  try {
    return JSON.parse(await readFile(tokenFile, "utf8")) as StoredGoogleToken;
  } catch (error) {
    if (isNodeError(error) && error.code === "ENOENT") {
      throw new Error(`Google token file not found at ${tokenFile}. Run: npm run drive:auth`);
    }
    throw error;
  }
}

async function waitForOAuthCode(callbackUrl: URL, authUrl: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = createServer((request, response) => {
      try {
        const requestUrl = new URL(request.url ?? "/", callbackUrl.origin);
        if (requestUrl.pathname !== callbackUrl.pathname) {
          response.writeHead(404);
          response.end("Not found");
          return;
        }

        const error = requestUrl.searchParams.get("error");
        if (error) {
          response.writeHead(400, { "Content-Type": "text/plain" });
          response.end(`Authorization failed: ${error}`);
          reject(new Error(`Google authorization failed: ${error}`));
          return;
        }

        const code = requestUrl.searchParams.get("code");
        if (!code) {
          response.writeHead(400, { "Content-Type": "text/plain" });
          response.end("Missing authorization code.");
          reject(new Error("Missing authorization code in Google OAuth callback"));
          return;
        }

        response.writeHead(200, { "Content-Type": "text/plain" });
        response.end("Google Drive authorization complete. You can close this tab.");
        resolve(code);
      } catch (error) {
        reject(error);
      } finally {
        server.close();
      }
    });

    server.on("error", reject);
    server.listen(Number(callbackUrl.port || 80), callbackUrl.hostname, () => {
      void open(authUrl).catch(() => {
        console.log(`Open this URL to authorize Google Drive:\n${authUrl}`);
      });
    });
  });
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
