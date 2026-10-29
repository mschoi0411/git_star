import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const [baselinePath, treatmentPath, outputPath] = process.argv.slice(2);

if (!baselinePath || !treatmentPath || !outputPath) {
  console.error("Usage: node summarize.mjs <baseline.json> <treatment.json> <output.json>");
  process.exit(1);
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const treatment = JSON.parse(await readFile(treatmentPath, "utf8"));

assert.equal(baseline.extractedRequirementCount, 6);
assert.equal(baseline.quality.score, 6);
assert.equal(baseline.quality.maximum, 10);
assert.equal(treatment.quality.score, 10);
assert.equal(treatment.quality.maximum, 10);
assert.deepEqual(treatment.dimensionsMm.map((value) => Number(value.toFixed(3))), [40, 30, 4]);
assert.equal(treatment.solidCount, 1);
assert.ok(treatment.stlTriangleCount > 0);
assert.ok(Object.values(treatment.checks).every(Boolean));
assert.equal(treatment.telemetryEnabled, false);
assert.equal(treatment.updateCheckEnabled, false);
assert.equal(treatment.viewerOrMcpStarted, false);
assert.equal(treatment.errors.length, 0);

const result = {
  fixture: {
    prompt: "project/design-prompt.txt",
    model: "project/mounting_plate.py",
  },
  baseline: {
    analyzer: baseline.analyzer,
    elapsedMs: baseline.elapsedMs,
    requirementsExtracted: `${baseline.extractedRequirementCount}/6`,
    stepGenerated: false,
    stlGenerated: false,
    geometryVerified: false,
    qualityScore: "6/10",
    errors: baseline.errors.length,
  },
  treatment: {
    analyzer: treatment.analyzer,
    elapsedMs: treatment.elapsedMs,
    requirementsExtracted: "6/6",
    stepGenerated: treatment.checks.stepGenerated,
    stlGenerated: treatment.checks.stlGenerated,
    boundingBoxMm: treatment.dimensionsMm,
    boundingBoxVerified: treatment.checks.boundingBoxVerified,
    volumeMm3: Number(treatment.volumeMm3.toFixed(6)),
    expectedVolumeMm3: Number(treatment.expectedVolumeMm3.toFixed(6)),
    volumeAndTopologyVerified: treatment.checks.volumeAndTopologyVerified,
    solidCount: treatment.solidCount,
    stlTriangleCount: treatment.stlTriangleCount,
    qualityScore: "10/10",
    telemetryEnabled: false,
    updateCheckEnabled: false,
    viewerOrMcpStarted: false,
    errors: treatment.errors.length,
  },
  artifacts: treatment.artifacts,
  comparison: {
    requirementExtractionChange: "0 (6/6 in both)",
    qualityScoreChange: "+4 (6/10 to 10/10)",
    addedCapabilities: ["STEP export", "STL export", "bounding-box validation", "volume/topology validation"],
    timingComparable: false,
    timingNote: "The baseline parses text while Treatment loads a native geometry kernel and exports two CAD formats.",
  },
  provenance: {
    repository: "https://github.com/earthtojake/text-to-cad",
    version: "0.7.26",
    tag: "v0.7.26",
    commit: "2f793659fb7bab537e2f00836e06448fc4087cb2",
    cadgenWheelSha256: "112b8b3a385127b88909255f9d50fd6ed353d087ffae5906de800836da894b48",
    python: "3.12",
  },
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));