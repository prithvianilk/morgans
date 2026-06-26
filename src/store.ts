import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import type { Chapter, ProcessedChapter, StoreState } from "./types.js";

export class JsonChapterStore {
  constructor(private readonly filePath: string) {}

  async load(): Promise<StoreState> {
    try {
      const content = await readFile(this.filePath, "utf8");
      const parsed = JSON.parse(content) as StoreState;
      return { processed: parsed.processed ?? {} };
    } catch (error) {
      if (isNodeError(error) && error.code === "ENOENT") {
        return { processed: {} };
      }
      throw error;
    }
  }

  async isProcessed(chapter: Chapter): Promise<boolean> {
    const state = await this.load();
    return chapter.slug in state.processed;
  }

  async markProcessed(chapter: Chapter, processed: Omit<ProcessedChapter, "url" | "title">): Promise<void> {
    const state = await this.load();
    state.processed[chapter.slug] = {
      url: chapter.url,
      title: chapter.title,
      ...processed,
    };
    await mkdir(path.dirname(this.filePath), { recursive: true });
    await writeFile(this.filePath, `${JSON.stringify(state, null, 2)}\n`);
  }
}

function isNodeError(error: unknown): error is NodeJS.ErrnoException {
  return error instanceof Error && "code" in error;
}
