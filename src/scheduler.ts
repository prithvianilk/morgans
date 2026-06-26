import type { AppConfig } from "./config.js";
import { poll, type PollSummary } from "./poll.js";

export type PollRunStatus = {
  running: boolean;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastSuccessAt?: string;
  lastError?: string;
  lastSummary?: {
    discovered: number;
    newChapters: number;
    processed: number;
  };
};

export class PollScheduler {
  private timer: NodeJS.Timeout | undefined;
  private activeRun: Promise<PollSummary> | undefined;
  private status: PollRunStatus = { running: false };

  constructor(private readonly config: AppConfig) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.runOnce().catch(() => undefined);
    }, this.config.pollIntervalMinutes * 60 * 1000);

    void this.runOnce().catch(() => undefined);
  }

  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = undefined;
    }
  }

  async runOnce(): Promise<PollSummary> {
    if (this.activeRun) {
      return this.activeRun;
    }

    this.status = {
      ...this.status,
      running: true,
      lastStartedAt: new Date().toISOString(),
      lastError: undefined,
    };

    this.activeRun = poll(this.config, { dryRun: false })
      .then((summary) => {
        this.status = {
          ...this.status,
          running: false,
          lastFinishedAt: new Date().toISOString(),
          lastSuccessAt: new Date().toISOString(),
          lastSummary: {
            discovered: summary.discovered.length,
            newChapters: summary.newChapters.length,
            processed: summary.processed.length,
          },
        };
        return summary;
      })
      .catch((error: unknown) => {
        this.status = {
          ...this.status,
          running: false,
          lastFinishedAt: new Date().toISOString(),
          lastError: error instanceof Error ? error.message : String(error),
        };
        throw error;
      })
      .finally(() => {
        this.activeRun = undefined;
      });

    return this.activeRun;
  }

  getStatus(): PollRunStatus {
    return { ...this.status };
  }
}
