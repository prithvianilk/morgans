# Morgans

<p align="center">
  <img src="assets/morgans-mascot.webp" alt="Morgans mascot" width="220">
</p>

Small TypeScript CLI for polling TCB chapters, packaging unprocessed chapters as CBZ files, and optionally copying them into a Google Drive-synced folder for Kobo.

For now, discovery only processes One Piece chapter links.

## Setup

```bash
npm install
cp .env.example .env
```

For local testing, create a Google OAuth desktop client and set these in `.env`:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_REDIRECT_URI=http://localhost:3333/oauth/callback
GOOGLE_DRIVE_FOLDER_ID=...
```

When this moves to a web service, keep the same Drive upload flow and swap `GOOGLE_REDIRECT_URI` to the deployed callback URL.

Then run the one-time auth flow:

```bash
npm run drive:auth
```

## Local Commands

```bash
npm run poll -- --dry-run
npm run poll -- --limit 1
npm run poll -- --dry-run --source /mangas/5/one-piece
npm run drive:auth
```

The processed-chapter state lives at `data/processed-chapters.json` by default. Generated files live under `downloads/`.

## Web Service

Run the web service locally:

```bash
npm run dev:server
```

Useful routes:

```txt
GET  /healthz
GET  /status
GET  /auth/google
GET  /oauth/callback
POST /poll
```

The service starts polling immediately and repeats every `POLL_INTERVAL_MINUTES`, defaulting to `30`.

## Render

This repo includes `render.yaml` for a Render web service. It uses a persistent disk mounted at `/var/data` for:

```txt
/var/data/google-token.json
/var/data/processed-chapters.json
```

Set these secret env vars in Render:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_REDIRECT_URI=https://YOUR_RENDER_SERVICE.onrender.com/oauth/callback
```

After the first deploy, open:

```txt
https://YOUR_RENDER_SERVICE.onrender.com/auth/google
```

Approve Google Drive access once. The service will then upload new CBZ files to Drive and mark chapters processed only after upload succeeds.
