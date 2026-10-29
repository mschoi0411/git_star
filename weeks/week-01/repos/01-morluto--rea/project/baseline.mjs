import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node baseline.mjs <input.dll> <output.json>");
  process.exit(1);
}

const expectedTypes = ["ReaLab.ScoreEngine", "ReaLab.Program"];
const expectedMethods = ["ComputeScore", "ChooseMessage", "Main"];
const expectedMarker = "REA_LAB_MARKER";
const startedAt = performance.now();
const input = await readFile(inputPath);
const utf8Text = input.toString("utf8");
const utf16Text = input.toString("utf16le");
const contains = (value) => utf8Text.includes(value) || utf16Text.includes(value);
const detectedTypes = expectedTypes.filter(
  (fullName) => contains(fullName) || fullName.split(".").every(contains),
);
const detectedMethods = expectedMethods.filter(contains);
const markerDetected = contains(expectedMarker);
const qualityScore = detectedTypes.length + detectedMethods.length + Number(markerDetected);

const result = {
  analyzer: "authored-byte-scan-baseline",
  input: {
    bytes: input.length,
    sha256: createHash("sha256").update(input).digest("hex"),
  },
  expectedTypes,
  detectedTypes,
  expectedMethods,
  detectedMethods,
  expectedMarker,
  markerDetected,
  assemblyIdentityRecovered: false,
  cilRecovered: false,
  callEdgesRecovered: false,
  quality: {
    score: qualityScore,
    maximum: 9,
    rubric: "2 types + 3 methods + marker + assembly identity + CIL + call edge",
  },
  errors: [],
  elapsedMs: Number((performance.now() - startedAt).toFixed(3)),
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));