export type Chapter = {
  id: string;
  slug: string;
  title: string;
  url: string;
  publishedAt?: string;
};

export type ProcessedChapter = {
  url: string;
  title: string;
  processedAt: string;
  outputFile: string;
};

export type StoreState = {
  processed: Record<string, ProcessedChapter>;
};

export type ProcessResult = {
  chapter: Chapter;
  imageCount: number;
  outputFile: string;
  deliveredFile?: string;
};
