# Setup

This guide covers local CLI setup and Render deployment for Morgans.

## Local Setup

Install dependencies and create a local env file:

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

Then run the one-time local auth flow:

```bash
npm run drive:auth
```

Local state defaults:

```txt
data/google-token.json
data/processed-chapters.json
downloads/
```

## Local Web Service

Run:

```bash
npm run dev:server
```

Useful routes:

```txt
GET  http://localhost:3333/healthz
GET  http://localhost:3333/status
POST http://localhost:3333/poll
```

If `ENABLE_AUTH_ROUTES=true`, OAuth routes are also available:

```txt
GET http://localhost:3333/auth/google
GET http://localhost:3333/oauth/callback
```

## Render

This repo includes `render.yaml` for a Render web service.

It uses a persistent disk mounted at `/var/data` for:

```txt
/var/data/google-token.json
/var/data/processed-chapters.json
```

Render persistent disks require a paid service plan and billing information on the account.

Set these secret env vars in Render:

```bash
GOOGLE_CLIENT_ID=...
GOOGLE_CLIENT_SECRET=...
GOOGLE_DRIVE_FOLDER_ID=...
GOOGLE_REDIRECT_URI=https://YOUR_RENDER_SERVICE.onrender.com/oauth/callback
ENABLE_AUTH_ROUTES=true
```

After the first deploy, open:

```txt
https://YOUR_RENDER_SERVICE.onrender.com/auth/google
```

Approve Google Drive access once. The service will save the token to the persistent disk.

After `/status` shows:

```json
{
  "googleToken": true
}
```

set:

```bash
ENABLE_AUTH_ROUTES=false
```

Then redeploy. Keep auth routes off unless you need to reauthorize Google Drive.

## Render Status Checks

Check:

```txt
https://YOUR_RENDER_SERVICE.onrender.com/status
```

The scheduler is healthy when `lastStartedAt` and `lastSuccessAt` advance every polling interval. `running: false` usually means the app is idle between polls, not broken.

Scheduled polls only run on `POLL_DAYS`, defaulting to `0,6` for Sunday and Saturday in IST. On other days, `/status` will show `lastSkippedAt` and `lastSkippedReason`.
