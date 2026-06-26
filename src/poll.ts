import path from "node:path";
import type { AppConfig } from "./config.js";
import { parseChapterImages, parseChapterList } from "./chapters.js";
import { downloadChapterImages } from "./download.js";
import { uploadToGoogleDrive } from "./googleDrive.js";
import { fetchText } from "./http.js";
import { packageCbz } from "./packageCbz.js";
import { JsonChapterStore } from "./store.js";
import type { Chapter, ProcessResult } from "./types.js";

export type PollOptions = {
  dryRun: boolean;
  limit?: number;
};

export type PollSummary = {
  discovered: Chapter[];
  newChapters: Chapter[];
  processed: ProcessResult[];
};

export async function poll(config: AppConfig, options: PollOptions): Promise<PollSummary> {
  const store = new JsonChapterStore(config.stateFile);
  const sourceHtml = await fetchText(config.discoveryUrl, config.userAgent);
  const discovered = parseChapterList(sourceHtml, config.baseUrl);
  const state = await store.load();

  const newChapters = discovered
    .filter((chapter) => !(chapter.slug in state.processed))
    .slice(0, options.limit);

  if (options.dryRun) {
    return { discovered, newChapters, processed: [] };
  }

  const processed: ProcessResult[] = [];

  for (const chapter of newChapters) {
    const pageHtml = await fetchText(chapter.url, config.userAgent);
    const imageUrls = parseChapterImages(pageHtml, chapter.url);
    if (imageUrls.length === 0) {
      throw new Error(`No page images found for ${chapter.url}`);
    }

    const pages = await downloadChapterImages(chapter, imageUrls, config.tmpDir, config.userAgent);
    const outputFile = await packageCbz(chapter, pages, config.outputDir);
    const uploaded = await uploadToGoogleDrive(outputFile, config);

    await store.markProcessed(chapter, {
      processedAt: new Date().toISOString(),
      outputFile: uploaded.location,
    });

    processed.push({
      chapter,
      imageCount: imageUrls.length,
      outputFile: path.resolve(outputFile),
      deliveredFile: uploaded.location,
    });
  }

  return { discovered, newChapters, processed };
}
