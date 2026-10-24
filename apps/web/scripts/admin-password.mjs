// =============================================================================
// SET THE DASHBOARD PASSWORD
//   npm run admin:password          (asks twice, nothing is shown while you type)
//   npm run admin:password -- --remove     (removes the password: the dashboard is open again)
// It writes ONE line, ADMIN_PASSWORD_HASH=..., in apps/web/.env.local. That file is
// ignored by git and only the dev server reads it. The line is a one-way fingerprint:
// nobody can get the password back from it, and the browser never receives it.
// Restart `npm run dev` afterwards.
// =============================================================================
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { createInterface } from "node:readline";
import { MIN_PASSWORD_LENGTH, hashPassword } from "../src/lib/admin/passwordHash.mjs";

const envFile = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..", ".env.local");
const KEY = "ADMIN_PASSWORD_HASH";

/** Writes (or removes) one KEY=value line and leaves every other line untouched. */
export function setEnvLine(text, key, value) {
  const lines = text.split(/\r?\n/).filter((line) => line.trim() !== "" || false);
  const kept = lines.filter((line) => !line.startsWith(`${key}=`));
  if (value !== null) kept.push(`${key}=${value}`);
  return kept.length ? `${kept.join("\n")}\n` : "";
}

/** Asks a question; the typed letters are not shown. */
function ask(question) {
  return new Promise((resolve) => {
    const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
    const write = rl._writeToOutput?.bind(rl);
    rl._writeToOutput = (text) => {
      // show the question, but print nothing for the typed characters
      if (text.includes(question)) write?.(text);
    };
    rl.question(question, (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

async function main() {
  const current = existsSync(envFile) ? readFileSync(envFile, "utf8") : "";

  if (process.argv.includes("--remove")) {
    writeFileSync(envFile, setEnvLine(current, KEY, null));
    console.log("Password removed. Restart `npm run dev`: the dashboard is open again (own computer only).");
    return;
  }

  const first = await ask(`New dashboard password (at least ${MIN_PASSWORD_LENGTH} characters): `);
  if (first.length < MIN_PASSWORD_LENGTH) {
    console.error(`Too short: use at least ${MIN_PASSWORD_LENGTH} characters (a few words together work well).`);
    process.exit(1);
  }
  const second = await ask("Type it again: ");
  if (first !== second) {
    console.error("The two passwords are different. Nothing was changed.");
    process.exit(1);
  }

  writeFileSync(envFile, setEnvLine(current, KEY, hashPassword(first)));
  console.log("Done. Only a fingerprint was saved in apps/web/.env.local (git ignores it).");
  console.log("Restart `npm run dev`, then open /admindash: it asks for the password.");
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) await main();
