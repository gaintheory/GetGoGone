#!/usr/bin/env node
/**
 * Set the GetGoGone site password.
 *
 * The site password is not recoverable — it only exists in the environment where
 * the app runs (`.env.local` locally, the host's env vars when deployed). There is
 * no user table and no reset email. If you don't know it, you set a new one.
 *
 * Usage:
 *   node scripts/set-site-password.mjs 'my new password'
 *   node scripts/set-site-password.mjs            # prompts, input hidden
 *
 * Writes SITE_PASSWORD to .env.local, and generates SITE_AUTH_COOKIE_SECRET if it
 * is missing. Every other line in the file is preserved byte for byte.
 *
 * Restart `npm run dev` afterwards — Next.js reads env vars at boot.
 */

import crypto from "node:crypto";
import fs from "node:fs";
import path from "node:path";
import readline from "node:readline";

const ENV_PATH = path.resolve(".env.local");
const MIN_LENGTH = 8;

/** Prompt for a password without echoing it to the terminal. */
function promptHidden(question) {
  return new Promise((resolve, reject) => {
    if (!process.stdin.isTTY) {
      reject(new Error(
        "No password argument given and stdin is not a terminal.\n" +
        "Pass it directly:  node scripts/set-site-password.mjs 'my new password'"
      ));
      return;
    }

    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    process.stdout.write(question);

    // Suppress echo for everything typed until Enter.
    const onData = (char) => {
      if (["\n", "\r", ""].includes(char.toString("utf8"))) {
        process.stdin.removeListener("data", onData);
      } else {
        process.stdout.clearLine(0);
        process.stdout.cursorTo(0);
        process.stdout.write(question);
      }
    };
    process.stdin.on("data", onData);

    rl.question("", (answer) => {
      rl.close();
      process.stdout.write("\n");
      resolve(answer);
    });
  });
}

/**
 * Replace `key`'s line in the env file, or append it. Returns the new contents.
 * Values are single-quoted and internal quotes escaped, so passwords containing
 * spaces, `#` or `$` survive intact.
 */
function upsertEnvLine(contents, key, value) {
  const quoted = `'${String(value).replace(/'/g, "'\\''")}'`;
  const line = `${key}=${quoted}`;
  const pattern = new RegExp(`^${key}=.*$`, "m");

  if (pattern.test(contents)) return contents.replace(pattern, line);
  const separator = contents.length === 0 || contents.endsWith("\n") ? "" : "\n";
  return `${contents}${separator}${line}\n`;
}

function hasKey(contents, key) {
  return new RegExp(`^${key}=.+$`, "m").test(contents);
}

async function main() {
  const fromArg = process.argv[2];
  const password = fromArg ?? await promptHidden("New site password: ");

  if (!password || !password.trim()) {
    throw new Error("Password cannot be empty.");
  }
  if (password.length < MIN_LENGTH) {
    throw new Error(`Password must be at least ${MIN_LENGTH} characters (got ${password.length}).`);
  }

  const existing = fs.existsSync(ENV_PATH) ? fs.readFileSync(ENV_PATH, "utf8") : "";
  let next = upsertEnvLine(existing, "SITE_PASSWORD", password);

  // The cookie secret signs sessions. Rotating it would log everyone out, so only
  // generate one when it is genuinely absent.
  let generatedSecret = false;
  if (!hasKey(next, "SITE_AUTH_COOKIE_SECRET")) {
    next = upsertEnvLine(next, "SITE_AUTH_COOKIE_SECRET", crypto.randomBytes(32).toString("hex"));
    generatedSecret = true;
  }

  fs.writeFileSync(ENV_PATH, next, { mode: 0o600 });

  const created = existing.length === 0;
  console.log(`${created ? "Created" : "Updated"} ${ENV_PATH}`);
  console.log("  SITE_PASSWORD set");
  if (generatedSecret) console.log("  SITE_AUTH_COOKIE_SECRET generated (32 random bytes)");
  console.log("\nRestart the dev server, then sign in at http://localhost:3000/login");

  if (!hasKey(next, "NEXT_PUBLIC_SUPABASE_URL") || !hasKey(next, "SUPABASE_SERVICE_ROLE_KEY")) {
    console.log(
      "\nNote: Supabase vars are not set, so most screens will be empty.\n" +
      "See .env.example for the full list."
    );
  }
}

main().catch((error) => {
  console.error(`\n${error.message}`);
  process.exit(1);
});
