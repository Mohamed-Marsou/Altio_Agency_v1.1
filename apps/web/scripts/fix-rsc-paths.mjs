// =============================================================================
// FIX FOR STATIC HOSTING  (runs after `next build` in export mode)
// -----------------------------------------------------------------------------
// When a visitor moves between pages, Next.js downloads small data files such as
//     /en/services/__next.!KHNpdGUp.$d$locale.services.__PAGE__.txt
// but the static export writes the same file in folders:
//     /en/services/__next.!KHNpdGUp/$d$locale/services/__PAGE__.txt
// A normal web server (Vercel, Node) maps one to the other. A plain static host
// (Hostinger) does not, so every move produced a 404 and a slower full page load.
// This script copies each file to the "dotted" name too, so both addresses work and
// no server rule is needed.
// =============================================================================
import { copyFileSync, existsSync, readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const OUT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", "out");

function* files(dir, prefix = "") {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* files(full, `${prefix}${entry}.`);
    else yield [full, `${prefix}${entry}`];
  }
}

function* segmentFolders(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (!statSync(full).isDirectory()) continue;
    if (entry.startsWith("__next.")) yield full;
    else if (entry !== "_next") yield* segmentFolders(full);
  }
}

export function fixRscPaths(out = OUT) {
  let copied = 0;
  for (const folder of segmentFolders(out)) {
    for (const [file, dotted] of files(folder)) {
      const target = path.join(path.dirname(folder), `${path.basename(folder)}.${dotted}`);
      if (!existsSync(target)) {
        copyFileSync(file, target);
        copied++;
      }
    }
  }
  return copied;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  if (!existsSync(OUT)) {
    console.error("out/ not found. Run the export build first.");
    process.exit(1);
  }
  console.log(`fix-rsc-paths: ${fixRscPaths()} data file(s) copied to their dotted names.`);
}
