import "dotenv/config";
import express from "express";
import { loadConfig } from "./config.js";
import { getGoogleAuthUrl, hasGoogleToken, saveGoogleTokenFromCode } from "./googleDrive.js";
import { PollScheduler } from "./scheduler.js";

const config = loadConfig();
const app = express();
const scheduler = new PollScheduler(config);

app.get("/", (_request, response) => {
  response.type("html").send(`
    <h1>Morgans</h1>
    <p>One Piece chapter poller is running.</p>
    <ul>
      <li><a href="/healthz">Health</a></li>
      <li><a href="/status">Status</a></li>
      <li><a href="/auth/google">Authorize Google Drive</a></li>
    </ul>
  `);
});

app.get("/healthz", (_request, response) => {
  response.json({ ok: true });
});

app.get("/status", async (_request, response, next) => {
  try {
    response.json({
      ok: true,
      googleToken: await hasGoogleToken(config),
      pollIntervalMinutes: config.pollIntervalMinutes,
      discoveryUrl: config.discoveryUrl,
      scheduler: scheduler.getStatus(),
    });
  } catch (error) {
    next(error);
  }
});

app.post("/poll", async (_request, response, next) => {
  try {
    const summary = await scheduler.runOnce();
    response.json({
      discovered: summary.discovered.length,
      newChapters: summary.newChapters.length,
      processed: summary.processed,
    });
  } catch (error) {
    next(error);
  }
});

app.get("/auth/google", (_request, response, next) => {
  try {
    response.redirect(getGoogleAuthUrl(config));
  } catch (error) {
    next(error);
  }
});

app.get("/oauth/callback", async (request, response, next) => {
  try {
    const error = typeof request.query.error === "string" ? request.query.error : undefined;
    if (error) {
      response.status(400).send(`Google authorization failed: ${error}`);
      return;
    }

    const code = typeof request.query.code === "string" ? request.query.code : undefined;
    if (!code) {
      response.status(400).send("Missing authorization code.");
      return;
    }

    await saveGoogleTokenFromCode(config, code);
    response.send("Google Drive authorization complete. Morgans can upload chapters now.");
  } catch (error) {
    next(error);
  }
});

app.use((error: unknown, _request: express.Request, response: express.Response, _next: express.NextFunction) => {
  const message = error instanceof Error ? error.message : String(error);
  response.status(500).json({ ok: false, error: message });
});

const server = app.listen(config.port, () => {
  console.log(`Morgans listening on port ${config.port}`);
  console.log(`Polling every ${config.pollIntervalMinutes} minute(s).`);
  scheduler.start();
});

function shutdown(): void {
  scheduler.stop();
  server.close(() => {
    process.exit(0);
  });
}

process.on("SIGTERM", shutdown);
process.on("SIGINT", shutdown);
