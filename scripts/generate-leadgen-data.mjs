import { mkdir, writeFile } from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";

import { loadLeadgenData } from "../lib/leadgen-data.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, "..");
const publicDir = path.join(root, "public");
const outputPath = path.join(publicDir, "leadgen-data.json");

async function main() {
  await mkdir(publicDir, { recursive: true });

  const data = loadLeadgenData();
  const serialized = JSON.stringify(data, null, 2);

  await writeFile(outputPath, `${serialized}\n`, "utf8");
  console.log(`Wrote lead snapshot to ${outputPath}`);
}

main().catch((error) => {
  console.error("Failed to generate lead snapshot:", error);
  process.exit(1);
});
