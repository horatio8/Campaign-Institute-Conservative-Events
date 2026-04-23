// Assert every path in the running /openapi.json corresponds to a handler file
// under src/app/api/v1, and vice versa. Requires the server running on
// APP_URL (default http://localhost:3000).

import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";

async function main() {
  const ROOT = fileURLToPath(new URL("..", import.meta.url));
  const BASE = process.env.APP_URL ?? "http://localhost:3000";

  const res = await fetch(`${BASE}/openapi.json`);
  if (!res.ok) {
    console.error(`Could not fetch ${BASE}/openapi.json — is the server running?`);
    process.exit(1);
  }
  const spec = (await res.json()) as { paths: Record<string, unknown> };
  const specPaths = new Set(Object.keys(spec.paths));

  function walk(dir: string): string[] {
    const out: string[] = [];
    for (const name of readdirSync(dir)) {
      const full = join(dir, name);
      if (statSync(full).isDirectory()) out.push(...walk(full));
      else if (name === "route.ts") out.push(full);
    }
    return out;
  }

  const routeFiles = walk(join(ROOT, "src/app/api/v1"));
  const actual = new Set(
    routeFiles.map((f) => {
      const rel = relative(join(ROOT, "src/app/api"), f);
      const parts = rel.split("/").slice(0, -1);
      return "/" + parts.join("/");
    })
  );

  const missingHandlers: string[] = [];
  for (const p of specPaths) if (!actual.has(p)) missingHandlers.push(p);
  const undocumented: string[] = [];
  for (const a of actual) if (!specPaths.has(a)) undocumented.push(a);

  if (missingHandlers.length) {
    console.error("Spec paths without route handlers:");
    for (const p of missingHandlers) console.error("  -", p);
  }
  if (undocumented.length) {
    console.error("Route handlers not in spec:");
    for (const p of undocumented) console.error("  -", p);
  }
  if (missingHandlers.length || undocumented.length) process.exit(1);
  console.log(`OK — ${specPaths.size} paths, ${actual.size} handlers, all in sync.`);
}

main();
