import http from "node:http";
import fs from "node:fs/promises";
import path from "node:path";
import { handle } from "../server/worker.mjs";
const root = path.resolve("public"),
  types = {
    ".html": "text/html",
    ".mjs": "text/javascript",
    ".css": "text/css",
    ".json": "application/json",
    ".svg": "image/svg+xml",
  };
const env = {
  ASSETS: {
    async fetch(r) {
      try {
        const u = new URL(r.url),
          file = path.resolve(
            root,
            "." + (u.pathname === "/" ? "/index.html" : u.pathname),
          );
        if (!file.startsWith(root + path.sep))
          return new Response("Not found", { status: 404 });
        return new Response(await fs.readFile(file), {
          headers: {
            "Content-Type": types[path.extname(file)] || "text/plain",
          },
        });
      } catch {
        return new Response("Not found", { status: 404 });
      }
    },
  },
};
const port = Number(process.env.PORT) || 8877;
http
  .createServer(async (req, res) => {
    const request = new Request(`http://localhost:${port}${req.url}`, {
      method: req.method,
      headers: req.headers,
    });
    const r = await handle(request, env);
    res.writeHead(r.status, Object.fromEntries(r.headers));
    res.end(Buffer.from(await r.arrayBuffer()));
  })
  .listen(port, "0.0.0.0", () =>
    console.log(
      "GameCenter http://localhost:" +
        port +
        " (no production credentials loaded)",
    ),
  );
