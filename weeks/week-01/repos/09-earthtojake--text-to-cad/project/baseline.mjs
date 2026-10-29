import { readFile, writeFile } from "node:fs/promises";
import { performance } from "node:perf_hooks";

const [promptPath, outputPath] = process.argv.slice(2);

if (!promptPath || !outputPath) {
  console.error("Usage: node baseline.mjs <prompt.txt> <output.json>");
  process.exit(1);
}

const startedAt = performance.now();
const prompt = await readFile(promptPath, "utf8");
const checks = {
  width40mm: /40\s*mm\s+wide/i.test(prompt),
  depth30mm: /30\s*mm\s+deep/i.test(prompt),
  thickness4mm: /4\s*mm\s+thick/i.test(prompt),
  fourHoles: /four\s+3\s*mm\s+diameter\s+through-holes/i.test(prompt),
  diameter3mm: /3\s*mm\s+diameter/i.test(prompt),
  edgeOffset5mm: /5\s*mm\s+from/i.test(prompt),
};
const extractedRequirementCount = Object.values(checks).filter(Boolean).length;

const result = {
  analyzer: "authored-text-requirement-baseline",
  checks,
  extractedRequirementCount,
  stepGenerated: false,
  stlGenerated: false,
  boundingBoxVerified: false,
  volumeAndTopologyVerified: false,
  quality: {
    score: extractedRequirementCount,
    maximum: 10,
    rubric: "6 requirement facts + STEP + STL + bounding box + volume/topology",
  },
  errors: [],
  elapsedMs: Number((performance.now() - startedAt).toFixed(3)),
};

await writeFile(outputPath, `${JSON.stringify(result, null, 2)}\n`, "utf8");
console.log(JSON.stringify(result));