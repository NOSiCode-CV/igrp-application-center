// Wraps `next dev` so the startup banner also prints the app URL under
// NEXT_PUBLIC_BASE_PATH. Next's own "Local:" line is always the server root,
// which 404s when a basePath is configured.
//
// The URL is derived from Next's "Local:" line rather than from PORT, so it
// stays correct when Next falls back to another port.

import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { parseEnv } from "node:util";

const appDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");

// Same files and precedence Next uses in development; the shell wins over all.
const readBasePath = () => {
  if (process.env.NEXT_PUBLIC_BASE_PATH !== undefined) {
    return process.env.NEXT_PUBLIC_BASE_PATH;
  }
  for (const file of [".env.development.local", ".env.local", ".env.development", ".env"]) {
    const envPath = path.join(appDir, file);
    if (!existsSync(envPath)) continue;
    const value = parseEnv(readFileSync(envPath, "utf8")).NEXT_PUBLIC_BASE_PATH;
    if (value !== undefined) return value;
  }
  return "";
};

const basePath = readBasePath().trim().replace(/\/+$/, "");

const nextBin = createRequire(path.join(appDir, "package.json")).resolve("next/dist/bin/next");

const child = spawn(process.execPath, [nextBin, "dev", "--turbopack", ...process.argv.slice(2)], {
  cwd: appDir,
  // stdout is piped, so keep Next's colours on explicitly.
  env: { ...process.env, FORCE_COLOR: process.env.FORCE_COLOR ?? "1" },
  stdio: ["inherit", "pipe", "inherit"],
});

// biome-ignore lint/suspicious/noControlCharactersInRegex: strips ANSI colour codes
const ansi = /\x1b\[[0-9;]*m/g;
let printed = !basePath;
let pending = "";

// Until the "Local:" line is seen, output is forwarded line by line so the App
// line lands directly beneath it; afterwards chunks pass straight through.
child.stdout.on("data", (chunk) => {
  if (printed) {
    process.stdout.write(chunk);
    return;
  }

  pending += chunk.toString();
  let newline = pending.indexOf("\n");
  while (newline !== -1 && !printed) {
    const line = pending.slice(0, newline + 1);
    pending = pending.slice(newline + 1);
    process.stdout.write(line);

    const match = line.replace(ansi, "").match(/-\s+Local:\s+(https?:\/\/\S+)/);
    if (match) {
      const appUrl = `${match[1].replace(/\/+$/, "")}${basePath}`;
      process.stdout.write(`   - App:          \x1b[1m\x1b[36m${appUrl}\x1b[0m\n`);
      printed = true;
    }
    newline = pending.indexOf("\n");
  }
  if (printed && pending) {
    process.stdout.write(pending);
    pending = "";
  }
});

child.stdout.on("end", () => {
  if (pending) process.stdout.write(pending);
});

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code, signal) => {
  process.exit(code ?? (signal ? 1 : 0));
});
