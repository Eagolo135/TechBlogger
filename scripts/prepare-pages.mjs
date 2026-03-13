import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import process from "node:process";

async function main() {
  const outDir = path.join(process.cwd(), "out");

  await mkdir(outDir, { recursive: true });
  await writeFile(path.join(outDir, ".nojekyll"), "", "utf8");

  if (process.env.CNAME) {
    await writeFile(path.join(outDir, "CNAME"), `${process.env.CNAME}\n`, "utf8");
  }

  console.log("Prepared static export for GitHub Pages.");
}

main().catch((error) => {
  console.error(error.message);
  process.exitCode = 1;
});