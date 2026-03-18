import { buildServer } from "../src/app";

type BenchmarkSummary = {
  scenario: string;
  avgMs: number;
  p95Ms: number;
  reqPerSecAvg: number;
  errorCount: number;
};

function percentile(values: number[], p: number): number {
  if (values.length === 0) {
    return 0;
  }

  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.ceil((p / 100) * sorted.length) - 1;
  return sorted[Math.max(0, Math.min(index, sorted.length - 1))];
}

async function runScenario(
  name: string,
  url: string,
  options: { requests: number; concurrency: number; warmup: number }
): Promise<BenchmarkSummary> {
  const durations: number[] = [];
  let errorCount = 0;
  let nextRequest = 0;

  for (let i = 0; i < options.warmup; i += 1) {
    await fetch(url);
  }

  const startedAt = performance.now();

  async function worker() {
    while (true) {
      const current = nextRequest;
      nextRequest += 1;
      if (current >= options.requests) {
        return;
      }

      const requestStartedAt = performance.now();
      try {
        const response = await fetch(url);
        if (!response.ok) {
          errorCount += 1;
        }
      } catch {
        errorCount += 1;
      }
      durations.push(performance.now() - requestStartedAt);
    }
  }

  await Promise.all(Array.from({ length: options.concurrency }, () => worker()));
  const totalMs = performance.now() - startedAt;

  const avgMs = durations.reduce((sum, duration) => sum + duration, 0) / durations.length;
  const p95Ms = percentile(durations, 95);
  const reqPerSecAvg = (options.requests / totalMs) * 1000;

  return {
    scenario: name,
    avgMs: Number(avgMs.toFixed(2)),
    p95Ms: Number(p95Ms.toFixed(2)),
    reqPerSecAvg: Number(reqPerSecAvg.toFixed(2)),
    errorCount
  };
}

async function main() {
  const app = buildServer();
  await app.listen({ port: 3000, host: "127.0.0.1" });

  try {
    const noCache = await runScenario(
      "no-cache",
      "http://127.0.0.1:3000/demo/no-cache?id=bench",
      { requests: 300, concurrency: 30, warmup: 20 }
    );
    const withCache = await runScenario(
      "with-cache",
      "http://127.0.0.1:3000/demo/with-cache?id=bench",
      { requests: 300, concurrency: 30, warmup: 20 }
    );

    const summaries = [noCache, withCache];

    // eslint-disable-next-line no-console
    console.log(JSON.stringify(summaries, null, 2));
  } finally {
    await app.close();
  }
}

void main();
