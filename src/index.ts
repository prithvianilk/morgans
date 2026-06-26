#!/usr/bin/env node
import "dotenv/config";
import { Command } from "commander";
import { loadConfig } from "./config.js";
import { authorizeGoogleDrive } from "./googleDrive.js";
import { poll } from "./poll.js";

const program = new Command();

program
  .name("morgans")
  .description("Poll TCB chapters, package new chapters as CBZ, and optionally copy them to Google Drive.")
  .option("--dry-run", "show unprocessed chapters without downloading", false)
  .option("--limit <count>", "maximum number of new chapters to process", parsePositiveInteger)
  .option("--source <url-or-path>", "chapter listing URL/path to scan")
  .action(async (options: { dryRun: boolean; limit?: number; source?: string }) => {
    const config = loadConfig();
    if (options.source) {
      config.discoveryUrl = new URL(options.source, config.baseUrl).toString();
    }
    const summary = await poll(config, {
      dryRun: options.dryRun,
      limit: options.limit,
    });

    console.log(`Discovered ${summary.discovered.length} chapter(s).`);

    if (summary.newChapters.length === 0) {
      console.log("No new chapters to process.");
      return;
    }

    console.log(`New chapter(s):`);
    for (const chapter of summary.newChapters) {
      console.log(`- ${chapter.title} (${chapter.url})`);
    }

    if (options.dryRun) {
      return;
    }

    console.log("Processed:");
    for (const result of summary.processed) {
      console.log(`- ${result.chapter.title}: ${result.imageCount} image(s) -> ${result.outputFile}`);
      if (result.deliveredFile) {
        console.log(`  delivered to ${result.deliveredFile}`);
      }
    }
  });

program
  .command("drive")
  .description("Google Drive helpers")
  .command("auth")
  .description("Authorize Google Drive API access and store a refresh token")
  .action(async () => {
    const config = loadConfig();
    await authorizeGoogleDrive(config);
    console.log(`Google Drive token saved to ${config.googleTokenFile}`);
  });

program.parseAsync().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
});

function parsePositiveInteger(value: string): number {
  const parsed = Number.parseInt(value, 10);
  if (!Number.isInteger(parsed) || parsed < 1) {
    throw new Error(`Expected a positive integer, got ${value}`);
  }
  return parsed;
}
