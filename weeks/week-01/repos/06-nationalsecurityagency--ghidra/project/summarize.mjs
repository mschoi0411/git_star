import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const [baselinePath, treatmentPath, outputPath, treatmentElapsed] = process.argv.slice(2);

if (!baselinePath || !treatmentPath || !outputPath || !treatmentElapsed) {
  console.error(
    "Usage: node summarize.mjs <baseline.json> <treatment.json> <output.json> <treatment-ms>",
  );
  process.exit(1);
}

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const treatment = JSON.parse(await readFile(treatmentPath, "utf8"));
const expectedFunctions = ["choose_message", "compute_score"];

assert.deepEqual(baseline.detectedFunctions, expectedFunctions);
assert.deepEqual(treatment.detectedFunctions, expectedFunctions);
assert.equal(baseline.detectedMarkers.length, 1);
assert.equal(treatment.detectedMarkers.length, 1);
assert.equal(baseline.highLevelDecompilation, false);
assert.equal(treatment.highLevelDecompilation, true);
assert.match(treatment.decompiledFunction, /param_1 \* 3 \+ 7/);

const result = {
  fixture: {
    source: "project/lab_sample.c",
    executableBytes: baseline.input.bytes,
    executableSha256: baseline.input.sha256,
    observedOutput: "GHIDRA_LAB_MARKER:analysis-ready:22",
    exitCode: 0,
  },
  baseline: {
    analyzer: baseline.analyzer,
    elapsedMs: baseline.elapsedMs,
    expectedFunctionsDetected: `${baseline.detectedFunctions.length}/2`,
    expectedMarkerDetected: true,
    highLevelDecompilation: false,
  },
  treatment: {
    analyzer: treatment.analyzer,
    wallElapsedMs: Number(treatmentElapsed),
    recoveredFunctionCount: treatment.functionCount,
    expectedFunctionsDetected: `${treatment.detectedFunctions.length}/2`,
    expectedMarkerDetected: true,
    highLevelDecompilation: true,
    semanticExpressionRecovered: true,
    decompiledFunction: treatment.decompiledFunction.trim(),
  },
  comparison: {
    functionNameDetectionChange: "0 (2/2 in both)",
    markerDetectionChange: "0 (1/1 in both)",
    addedCapability: "high-level function decompilation",
    timingComparable: false,
    timingNote: "The baseline byte scan and full Ghidra analysis perform different work.",
  },
  provenance: {
    ghidraVersion: "12.2",
    ghidraTag: "Ghidra_12.2_build",
    ghidraCommit: "8ca9077040cc43cd790babcfccf19475622a3e9a",
    ghidraReleaseSha256: "2c2cd776db3c1f6a097ba418922378ac3649cadd5e844a6f5f088ae628a7be67",
    jdk: "Eclipse Temurin 25.0.4.1+1",
    jdkArchiveSha256: "00c847d804f4a78e9f04f2683faf14fed898535b177b7fc704486cb0284e9283",
  },
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));
