import { mkdirSync, rmSync, writeFileSync } from "node:fs";
import { performance } from "node:perf_hooks";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { PolyglotExecutor } from "../../../../../_sources/context-mode/src/executor.ts";

const projectDir = dirname(fileURLToPath(import.meta.url));
const artifactsDir = join(projectDir, "..", "artifacts");
const fixturePath = join(projectDir, ".benchmark-fixture.json");
const resultPath = join(artifactsDir, "benchmark-result.json");

const records = Array.from({ length: 1_000 }, (_, index) => ({
  id: `event-${String(index + 1).padStart(4, "0")}`,
  status: index % 20 === 0 ? 500 : index % 10 === 0 ? 404 : 200,
  latencyMs: (index * 37) % 997,
  route: `/api/resource/${index % 25}`,
  message: `Deterministic local benchmark event ${index + 1}; no external or personal data.`,
}));

const statusCounts = records.reduce<Record<string, number>>((counts, record) => {
  const status = String(record.status);
  counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}, {});
const expected = {
  records: records.length,
  errors: records.filter((record) => record.status >= 400).length,
  statusCounts,
  averageLatencyMs: Number(
    (records.reduce((sum, record) => sum + record.latencyMs, 0) / records.length).toFixed(2),
  ),
  uniqueRoutes: new Set(records.map((record) => record.route)).size,
};

const fixture = JSON.stringify(records, null, 2);
mkdirSync(artifactsDir, { recursive: true });
writeFileSync(fixturePath, fixture, "utf8");

const treatmentCode = String.raw`
const records = JSON.parse(FILE_CONTENT);
const statusCounts = records.reduce((counts, record) => {
  const status = String(record.status);
  counts[status] = (counts[status] ?? 0) + 1;
  return counts;
}, {});
const summary = {
  records: records.length,
  errors: records.filter((record) => record.status >= 400).length,
  statusCounts,
  averageLatencyMs: Number(
    (records.reduce((sum, record) => sum + record.latencyMs, 0) / records.length).toFixed(2),
  ),
  uniqueRoutes: new Set(records.map((record) => record.route)).size,
};
console.log(JSON.stringify(summary));
`;

const executor = new PolyglotExecutor({ projectRoot: projectDir });
const startedAt = performance.now();

try {
  const execution = await executor.executeFile({
    path: fixturePath,
    language: "javascript",
    code: treatmentCode,
    timeout: 30_000,
  });
  const elapsedMs = Number((performance.now() - startedAt).toFixed(2));

  if (execution.exitCode !== 0) {
    throw new Error(`PolyglotExecutor failed: ${execution.stderr}`);
  }

  const actual = JSON.parse(execution.stdout.trim()) as typeof expected;
  const checks = {
    records: actual.records === expected.records,
    errors: actual.errors === expected.errors,
    statusCounts: JSON.stringify(actual.statusCounts) === JSON.stringify(expected.statusCounts),
    averageLatencyMs: actual.averageLatencyMs === expected.averageLatencyMs,
    uniqueRoutes: actual.uniqueRoutes === expected.uniqueRoutes,
  };
  const fidelityPassed = Object.values(checks).filter(Boolean).length;
  const rawBytes = Buffer.byteLength(fixture, "utf8");
  const returnedBytes = Buffer.byteLength(execution.stdout, "utf8");
  const reductionPercent = Number(((1 - returnedBytes / rawBytes) * 100).toFixed(2));

  const result = {
    source: {
      repository: "https://github.com/mksglu/context-mode",
      commit: "90af14e34bf35120c3310f7a75f54fa99d2cabba",
      version: "1.0.169",
      component: "src/executor.ts PolyglotExecutor.executeFile",
    },
    environment: {
      bun: Bun.version,
      platform: process.platform,
      dependencyInstallPerformed: false,
    },
    experiment: {
      records: records.length,
      rawBytes,
      returnedBytes,
      reductionPercent,
      estimatedRawTokens: Math.ceil(rawBytes / 4),
      estimatedReturnedTokens: Math.ceil(returnedBytes / 4),
      elapsedMs,
      fidelityChecksPassed: fidelityPassed,
      fidelityChecksTotal: Object.keys(checks).length,
      checks,
      expected,
      actual,
    },
  };

  writeFileSync(resultPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(result, null, 2));

  if (fidelityPassed !== Object.keys(checks).length) {
    process.exitCode = 1;
  }
} finally {
  rmSync(fixturePath, { force: true });
}
