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

## Commands

```bash
npm run poll -- --dry-run
npm run poll -- --limit 1
npm run poll -- --dry-run --source /mangas/5/one-piece
npm run drive:auth
```

The processed-chapter state lives at `data/processed-chapters.json` by default. Generated files live under `downloads/`.
