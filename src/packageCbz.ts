import { createWriteStream } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import archiver from "archiver";
import { safeFileName } from "./files.js";
import type { DownloadedPage } from "./download.js";
import type { Chapter } from "./types.js";

export async function packageCbz(chapter: Chapter, pages: DownloadedPage[], outputDir: string): Promise<string> {
  await mkdir(outputDir, { recursive: true });

  const outputPath = path.join(outputDir, `${safeFileName(chapter.title)}.cbz`);
  const output = createWriteStream(outputPath);
  const archive = archiver("zip", { zlib: { level: 9 } });

  const done = new Promise<void>((resolve, reject) => {
    output.on("close", resolve);
    output.on("error", reject);
    archive.on("error", reject);
  });

  archive.pipe(output);
  for (const page of [...pages].sort((a, b) => a.archiveName.localeCompare(b.archiveName))) {
    archive.append(await readFile(page.filePath), { name: page.archiveName });
  }
  await archive.finalize();
  await done;

  return outputPath;
}
