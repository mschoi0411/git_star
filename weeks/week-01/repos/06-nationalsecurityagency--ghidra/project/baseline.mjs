import { createHash } from "node:crypto";
import { readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const [inputPath, outputPath] = process.argv.slice(2);

if (!inputPath || !outputPath) {
  console.error("Usage: node baseline.mjs <input.exe> <output.json>");
  process.exit(1);
}

const expectedFunctions = ["choose_message", "compute_score"];
const expectedMarker = "GHIDRA_LAB_MARKER";
const startedAt = performance.now();
const input = await readFile(inputPath);
const binaryText = input.toString("latin1");
const detectedFunctions = expectedFunctions.filter((name) => binaryText.includes(name));
const detectedMarkers = binaryText.includes(expectedMarker) ? [expectedMarker] : [];

const result = {
  analyzer: "authored-byte-scan-baseline",
  input: {
    bytes: input.length,
    sha256: createHash("sha256").update(input).digest("hex"),
  },
  expectedFunctions,
  detectedFunctions,
  expectedMarker,
  detectedMarkers,
  highLevelDecompilation: false,
  elapsedMs: Number((performance.now() - startedAt).toFixed(3)),
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));
