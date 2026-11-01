import fs from "node:fs/promises";
import path from "node:path";
import { build } from "esbuild";
await fs.rm("dist", { recursive: true, force: true });
await fs.cp("public", "dist", { recursive: true });
await build({
  entryPoints: ["server/worker.mjs"],
  bundle: true,
  format: "esm",
  platform: "browser",
  target: "es2022",
  outfile: "dist/_worker.js",
  minify: true,
});
await fs.writeFile(
  "dist/_routes.json",
  JSON.stringify({ version: 1, include: ["/api/*", "/fantasy"], exclude: [] }),
);
const files = await fs.readdir("dist");
if (!files.includes("index.html") || !files.includes("_worker.js"))
  throw Error("Build incomplete");
console.log(
  "Built Cloudflare Pages assets and server worker in " + path.resolve("dist"),
);
