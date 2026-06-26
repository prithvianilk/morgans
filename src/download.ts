import { mkdir, rm, writeFile } from "node:fs/promises";
import path from "node:path";
import pLimit from "p-limit";
import { extensionFromUrl, safeFileName } from "./files.js";
import { fetchBytes } from "./http.js";
import type { Chapter } from "./types.js";

export type DownloadedPage = {
  filePath: string;
  archiveName: string;
};

export async function downloadChapterImages(
  chapter: Chapter,
  imageUrls: string[],
  tmpDir: string,
  userAgent: string,
): Promise<DownloadedPage[]> {
  const chapterDir = path.join(tmpDir, chapter.slug);
  await rm(chapterDir, { recursive: true, force: true });
  await mkdir(chapterDir, { recursive: true });

  const width = String(imageUrls.length).length || 1;
  const limit = pLimit(4);

  return Promise.all(
    imageUrls.map((url, index) =>
      limit(async () => {
        const pageNumber = String(index + 1).padStart(width, "0");
        const extension = extensionFromUrl(url);
        const archiveName = `${pageNumber}${extension}`;
        const filePath = path.join(chapterDir, safeFileName(archiveName));
        const bytes = await fetchBytes(url, userAgent);
        await writeFile(filePath, bytes);
        return { filePath, archiveName };
      }),
    ),
  );
}
