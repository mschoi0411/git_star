import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, resolve } from "node:path";
import { performance } from "node:perf_hooks";

function baselineReleaseDecision(input) {
  const testsPassed = input.testsPassed;
  const hasSecurityFindings = input.hasSecurityFindings;
  const breakingChanges = input.breakingChanges;
  const approvalCount = input.approvalCount;
  const isHotfix = input.isHotfix;
  let decision;

  if (testsPassed === true) {
    if (hasSecurityFindings === false) {
      if (breakingChanges === true) {
        if (approvalCount >= 2) {
          decision = "ready";
        } else {
          decision = "review";
        }
      } else if (isHotfix === true) {
        if (approvalCount >= 1) {
          decision = "ready";
        } else {
          decision = "review";
        }
      } else if (approvalCount >= 1) {
        decision = "ready";
      } else {
        decision = "review";
      }
    } else {
      decision = "blocked";
    }
  } else {
    decision = "blocked";
  }

  return decision;
}

function treatmentReleaseDecision(input) {
  const { testsPassed, hasSecurityFindings, breakingChanges, approvalCount } = input;

  if (!testsPassed || hasSecurityFindings) {
    return "blocked";
  }

  const requiredApprovals = breakingChanges ? 2 : 1;
  return approvalCount >= requiredApprovals ? "ready" : "review";
}

function buildCases() {
  const values = [false, true];
  const cases = [];

  for (const testsPassed of values) {
    for (const hasSecurityFindings of values) {
      for (const breakingChanges of values) {
        for (const isHotfix of values) {
          for (let approvalCount = 0; approvalCount <= 3; approvalCount += 1) {
            cases.push({
              testsPassed,
              hasSecurityFindings,
              breakingChanges,
              isHotfix,
              approvalCount,
            });
          }
        }
      }
    }
  }

  return cases;
}

function sourceMetrics(fn) {
  const source = fn.toString();
  const lines = source.split("\n").filter((line) => line.trim().length > 0);
  const decisionPatterns = [/\bif\s*\(/g, /&&/g, /\|\|/g, /\?/g];
  let decisionTokens = 0;
  let depth = 0;
  let maxBraceDepth = 0;

  for (const pattern of decisionPatterns) {
    decisionTokens += source.match(pattern)?.length ?? 0;
  }

  for (const character of source) {
    if (character === "{") {
      depth += 1;
      maxBraceDepth = Math.max(maxBraceDepth, depth);
    } else if (character === "}") {
      depth -= 1;
    }
  }

  return {
    utf8Bytes: Buffer.byteLength(source, "utf8"),
    nonEmptyLines: lines.length,
    decisionTokens,
    maxBraceDepth,
  };
}

function runTimed(fn, cases, iterations) {
  let checksum = 0;
  const startedAt = performance.now();

  for (let iteration = 0; iteration < iterations; iteration += 1) {
    for (const input of cases) {
      checksum += fn(input).length;
    }
  }

  return {
    milliseconds: Number((performance.now() - startedAt).toFixed(3)),
    checksum,
  };
}

function median(values) {
  const sorted = [...values].sort((left, right) => left - right);
  return sorted[Math.floor(sorted.length / 2)];
}

function benchmark() {
  const cases = buildCases();
  const mismatches = cases.filter(
    (input) => baselineReleaseDecision(input) !== treatmentReleaseDecision(input),
  );

  for (let warmup = 0; warmup < 2_000; warmup += 1) {
    for (const input of cases) {
      baselineReleaseDecision(input);
      treatmentReleaseDecision(input);
    }
  }

  const iterationsPerRound = 20_000;
  const baselineTimes = [];
  const treatmentTimes = [];
  let expectedChecksum = null;

  for (let round = 0; round < 7; round += 1) {
    const order = round % 2 === 0
      ? [baselineReleaseDecision, treatmentReleaseDecision]
      : [treatmentReleaseDecision, baselineReleaseDecision];

    for (const fn of order) {
      const measurement = runTimed(fn, cases, iterationsPerRound);
      expectedChecksum ??= measurement.checksum;

      if (measurement.checksum !== expectedChecksum) {
        throw new Error("Runtime checksum mismatch");
      }

      if (fn === baselineReleaseDecision) {
        baselineTimes.push(measurement.milliseconds);
      } else {
        treatmentTimes.push(measurement.milliseconds);
      }
    }
  }

  const baselineMetrics = sourceMetrics(baselineReleaseDecision);
  const treatmentMetrics = sourceMetrics(treatmentReleaseDecision);
  const baselineMedianMs = median(baselineTimes);
  const treatmentMedianMs = median(treatmentTimes);

  return {
    experiment: "code-simplifier-static-application",
    inputCases: cases.length,
    behavior: {
      matchingCases: cases.length - mismatches.length,
      mismatches: mismatches.length,
      outputs: ["blocked", "ready", "review"],
    },
    source: {
      baseline: baselineMetrics,
      treatment: treatmentMetrics,
      changes: {
        utf8BytesReductionPercent: Number(
          ((1 - treatmentMetrics.utf8Bytes / baselineMetrics.utf8Bytes) * 100).toFixed(2),
        ),
        nonEmptyLinesReductionPercent: Number(
          ((1 - treatmentMetrics.nonEmptyLines / baselineMetrics.nonEmptyLines) * 100).toFixed(2),
        ),
        decisionTokensRemoved:
          baselineMetrics.decisionTokens - treatmentMetrics.decisionTokens,
        braceDepthRemoved:
          baselineMetrics.maxBraceDepth - treatmentMetrics.maxBraceDepth,
      },
    },
    runtime: {
      nodeVersion: process.version,
      rounds: 7,
      iterationsPerRound,
      callsPerRound: cases.length * iterationsPerRound,
      baselineMilliseconds: baselineTimes,
      treatmentMilliseconds: treatmentTimes,
      baselineMedianMilliseconds: baselineMedianMs,
      treatmentMedianMilliseconds: treatmentMedianMs,
      medianChangePercent: Number(
        ((treatmentMedianMs / baselineMedianMs - 1) * 100).toFixed(2),
      ),
      checksum: expectedChecksum,
    },
  };
}

const result = benchmark();
const outputIndex = process.argv.indexOf("--output");

if (outputIndex !== -1) {
  const outputPath = resolve(process.argv[outputIndex + 1]);
  mkdirSync(dirname(outputPath), { recursive: true });
  writeFileSync(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
}

console.log(JSON.stringify(result, null, 2));

if (result.behavior.mismatches > 0) {
  process.exitCode = 1;
}
