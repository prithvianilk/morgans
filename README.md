# Morgans

<p align="center">
  <img src="assets/morgans-mascot.webp" alt="Morgans mascot" width="220">
</p>

Morgans watches TCB Scans for new One Piece chapters, downloads the chapter images, packages them as a CBZ, and uploads the result to Google Drive for Kobo sync.

It can run in two modes:

- **Web service:** a long-running Render app that polls automatically every 30 minutes.
- **CLI:** a local TypeScript command for dry-runs, one-off polls, and local testing.

For now, discovery only processes One Piece chapter links.

## Web App

The web service starts polling on boot and repeats every `POLL_INTERVAL_MINUTES`, defaulting to `30`.

Routes:

```txt
GET  /healthz
GET  /status
POST /poll
GET  /auth/google      # only when ENABLE_AUTH_ROUTES=true
GET  /oauth/callback   # only when ENABLE_AUTH_ROUTES=true
```

`/status` shows whether Google Drive is authorized, whether a poll is currently running, and when the last poll succeeded.

Render deployment is described in [SETUP.md](SETUP.md).

## CLI

Useful local commands:

```bash
npm run poll -- --dry-run
npm run poll -- --limit 1
npm run poll -- --dry-run --source /mangas/5/one-piece
npm run drive:auth
```

The CLI uses the same core polling, download, CBZ, and Google Drive upload modules as the web service.

## Project Shape

```txt
src/
  index.ts        # CLI entrypoint
  server.ts       # web service entrypoint
  scheduler.ts    # recurring poll loop
  poll.ts         # shared orchestration
  chapters.ts     # TCB parsing
  googleDrive.ts  # OAuth and upload
  store.ts        # processed-chapter JSON state
```

Generated files and runtime state are intentionally not committed.
