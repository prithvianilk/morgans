import type { AppConfig } from "./config.js";
import { poll, type PollSummary } from "./poll.js";

const POLL_TIME_ZONE = "Asia/Kolkata";

export type PollRunStatus = {
  running: boolean;
  runCount: number;
  skippedCount: number;
  lastStartedAt?: string;
  lastFinishedAt?: string;
  lastSuccessAt?: string;
  lastSkippedAt?: string;
  lastSkippedReason?: string;
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
  private status: PollRunStatus = { running: false, runCount: 0, skippedCount: 0 };

  constructor(private readonly config: AppConfig) {}

  start(): void {
    if (this.timer) return;

    this.timer = setInterval(() => {
      void this.runScheduled().catch(() => undefined);
    }, this.config.pollIntervalMinutes * 60 * 1000);

    void this.runScheduled().catch(() => undefined);
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
      lastSkippedReason: undefined,
    };

    this.activeRun = poll(this.config, { dryRun: false })
      .then((summary) => {
        this.status = {
          ...this.status,
          running: false,
          runCount: this.status.runCount + 1,
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

  private async runScheduled(): Promise<PollSummary | undefined> {
    const now = new Date();
    if (!this.config.pollDays.includes(getDayInTimeZone(now, POLL_TIME_ZONE))) {
      this.status = {
        ...this.status,
        skippedCount: this.status.skippedCount + 1,
        lastSkippedAt: now.toISOString(),
        lastSkippedReason: `Scheduled polls only run on ${POLL_TIME_ZONE} days: ${this.config.pollDays.join(",")}`,
      };
      return undefined;
    }

    return this.runOnce();
  }
}

function getDayInTimeZone(date: Date, timeZone: string): number {
  const weekday = new Intl.DateTimeFormat("en-US", { timeZone, weekday: "short" }).format(date);
  const days: Record<string, number> = {
    Sun: 0,
    Mon: 1,
    Tue: 2,
    Wed: 3,
    Thu: 4,
    Fri: 5,
    Sat: 6,
  };

  return days[weekday] ?? date.getUTCDay();
}
