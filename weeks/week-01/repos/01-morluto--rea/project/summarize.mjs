import assert from "node:assert/strict";
import { readFile, writeFile } from "node:fs/promises";

const [
  baselinePath,
  artifactPath,
  membersPath,
  outputPath,
  artifactElapsed,
  membersElapsed,
] = process.argv.slice(2);

if (
  !baselinePath ||
  !artifactPath ||
  !membersPath ||
  !outputPath ||
  !artifactElapsed ||
  !membersElapsed
) {
  console.error(
    "Usage: node summarize.mjs <baseline.json> <artifact.json> <members.json> <output.json> <artifact-ms> <members-ms>",
  );
  process.exit(1);
}

const parseResult = async (path) => {
  const document = JSON.parse(await readFile(path, "utf8"));
  assert.notEqual(document.ok, false);
  return document.data?.normalized_result ?? document.normalized_result ?? document.data ?? document;
};

const baseline = JSON.parse(await readFile(baselinePath, "utf8"));
const artifact = await parseResult(artifactPath);
const members = await parseResult(membersPath);
const expectedTypes = ["ReaLab.ScoreEngine", "ReaLab.Program"];
const expectedMethods = ["ComputeScore", "ChooseMessage", "Main"];
const typeNames = members.types.map((type) => type.full_name);
const methodNames = members.methods.map((method) => method.name);
const strings = members.user_strings.literals.map((literal) => literal.value);
const computeScore = members.methods.find((method) => method.name === "ComputeScore");
const calls = members.call_edges.filter(
  (edge) => edge.caller === "ReaLab.Program.Main",
);
const assemblyIdentityRecovered =
  artifact.assembly?.name === "ReaLab" && artifact.classification?.status === "managed";
const cilRecovered =
  computeScore?.body?.opcode_counts?.mul === 1 &&
  computeScore.body.opcode_counts.add === 1 &&
  computeScore.body.opcode_counts["ldc.i4.3"] === 1 &&
  computeScore.body.opcode_counts["ldc.i4.7"] === 1;
const callEdgesRecovered = ["ComputeScore", "ChooseMessage"].every((target) =>
  calls.some((edge) => edge.target_name === target),
);
const markerDetected = strings.some((value) => value.includes("REA_LAB_MARKER"));
const qualityScore =
  expectedTypes.filter((name) => typeNames.includes(name)).length +
  expectedMethods.filter((name) => methodNames.includes(name)).length +
  Number(markerDetected) +
  Number(assemblyIdentityRecovered) +
  Number(cilRecovered) +
  Number(callEdgesRecovered);

assert.deepEqual(baseline.detectedTypes, expectedTypes);
assert.deepEqual(baseline.detectedMethods, expectedMethods);
assert.equal(baseline.markerDetected, true);
assert.equal(artifact.artifact.sha256, baseline.input.sha256);
assert.equal(members.artifact.sha256, baseline.input.sha256);
assert.equal(members.coverage.state, "complete");
assert.deepEqual(members.selection.unmatched_type_names, []);
assert.equal(qualityScore, 9);

const result = {
  fixture: {
    source: "project/Program.cs",
    assemblyBytes: baseline.input.bytes,
    assemblySha256: baseline.input.sha256,
    observedOutput: "REA_LAB_MARKER:analysis-ready:22",
    exitCode: 0,
  },
  baseline: {
    analyzer: baseline.analyzer,
    elapsedMs: baseline.elapsedMs,
    typesDetected: `${baseline.detectedTypes.length}/2`,
    methodsDetected: `${baseline.detectedMethods.length}/3`,
    markerDetected: baseline.markerDetected,
    assemblyIdentityRecovered: false,
    cilRecovered: false,
    callEdgesRecovered: false,
    qualityScore: `${baseline.quality.score}/${baseline.quality.maximum}`,
    errors: baseline.errors.length,
  },
  treatment: {
    analyzer: "REA managed static analysis provider",
    artifactElapsedMs: Number(artifactElapsed),
    membersElapsedMs: Number(membersElapsed),
    typesDetected: `${expectedTypes.filter((name) => typeNames.includes(name)).length}/2`,
    methodsDetected: `${expectedMethods.filter((name) => methodNames.includes(name)).length}/3`,
    markerDetected,
    assemblyIdentityRecovered,
    assembly: artifact.assembly.name,
    targetFrameworks: artifact.target_frameworks,
    managedArchitecture: artifact.classification.managed_architecture,
    cilRecovered,
    computeScoreOpcodes: computeScore.body.opcode_counts,
    callEdgesRecovered,
    selectedCallEdges: calls.map((edge) => ({
      caller: edge.caller,
      target: `${edge.target_declaring_type}.${edge.target_name}`,
    })),
    userStrings: strings,
    coverage: members.coverage.state,
    targetExecuted: false,
    qualityScore: `${qualityScore}/9`,
    errors: 0,
  },
  comparison: {
    nameAndMarkerDetectionChange: "0 (both conditions found 2/2 types, 3/3 methods, and the marker)",
    qualityScoreChange: `+${qualityScore - baseline.quality.score} (${baseline.quality.score}/9 to ${qualityScore}/9)`,
    addedCapabilities: ["assembly identity", "CIL opcode structure", "static call edges"],
    timingComparable: false,
    timingNote: "The baseline byte scan and REA metadata/CIL analysis perform different work.",
  },
  provenance: {
    reaVersion: "6.7.0",
    reaTag: "rea-agents-6.7.0",
    reaCommit: "27dc42d10249f0410904a75c0997842eb03b931c",
    npmIntegrity: "sha512-yhIx2ioJYYT1C/tONfYeitC6LhnKmCh+ZwRUOgYuhSc733lGhkkt73zhug9WmLgxoMdKuqIYGCoBfD4fXkOhFw==",
    nodeVersion: "24.22.1",
    nodeArchiveSha256: "d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5",
    dotnetSdk: "5.0.408",
  },
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));