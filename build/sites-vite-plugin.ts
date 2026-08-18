import { access, cp, mkdir, readdir, rm } from "node:fs/promises";
import { resolve } from "node:path";
import type { Plugin } from "vite";

async function exists(path: string): Promise<boolean> {
  try {
    await access(path);
    return true;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return false;
    }
    throw error;
  }
}

// Top-level repo entries that must NOT be copied into the Worker's static
// assets output (dist/client). This is either tooling/source for the new
// Next.js app, or a legacy static file that a real app/ route now replaces
// (those are excluded on purpose so the old file can't shadow the new page).
const LEGACY_ASSET_EXCLUDES = new Set([
  ".git",
  ".github",
  ".assetsignore",
  ".gitignore",
  ".openai",
  ".wrangler",
  "node_modules",
  "app",
  "src",
  "build",
  "scripts",
  "worker",
  "tests",
  "public",
  "dist",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "next.config.ts",
  "postcss.config.mjs",
  "vite.config.ts",
  "wrangler.jsonc",
  "wrangler.toml",
  "README.md",
  "SECURITY.md",
  // Superseded by real app/ routes added in the commerce rebuild — keep the
  // new pages in charge instead of letting the old static file win.
  "index.html",
  "disclaimer.html",
  "privacy.html",
  "refund.html",
  "terms.html",
]);

// The pre-rebuild site was served as one big static-assets directory (every
// file in the repo root). The Next.js rebuild only ships what vinext
// renders into dist/client, so without this step every legacy page
// (self-mirror, misophonia, shadow-work, the song pages, protocol PDFs,
// etc.) would 404 the moment this Worker took over production traffic.
// Copy everything else through unchanged so those routes keep working.
async function copyLegacyStaticAssets(root: string, outDir: string) {
  const entries = await readdir(root, { withFileTypes: true });
  for (const entry of entries) {
    if (LEGACY_ASSET_EXCLUDES.has(entry.name)) continue;
    if (entry.name.startsWith(".env")) continue;
    const from = resolve(root, entry.name);
    const to = resolve(outDir, entry.name);
    await cp(from, to, { recursive: true, force: false, errorOnExist: false });
  }
}

// Packages Sites metadata and migrations after Vite finishes compiling.
export function sites(): Plugin {
  let root = process.cwd();

  return {
    name: "sites",
    apply: "build",
    configResolved(config) {
      root = config.root;
    },
    async closeBundle() {
      const outputDirectory = resolve(root, "dist", ".openai");
      const hostingConfig = resolve(root, ".openai", "hosting.json");
      const drizzleSource = resolve(root, "drizzle");

      await rm(outputDirectory, { recursive: true, force: true });
      await mkdir(outputDirectory, { recursive: true });

      if (await exists(hostingConfig)) {
        await cp(hostingConfig, resolve(outputDirectory, "hosting.json"));
      }
      if (await exists(drizzleSource)) {
        await cp(drizzleSource, resolve(outputDirectory, "drizzle"), {
          recursive: true,
        });
      }

      const clientOutDir = resolve(root, "dist", "client");
      if (await exists(clientOutDir)) {
        await copyLegacyStaticAssets(root, clientOutDir);
      }
    },
  };
}
