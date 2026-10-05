// Usage: node scripts/hash-password.mjs   (prompts for the password without echoing it)
// Prints the value for JARVIS_OWNER_PASSWORD_HASH. Same format as src/server/auth.ts.
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline";

const rl = createInterface({ input: process.stdin, output: process.stdout, terminal: true });
rl._writeToOutput = (s) => { if (s.includes("パスワード")) process.stdout.write(s); };
rl.question("オーナーのパスワード（12文字以上）: ", (password) => {
  rl.close();
  process.stdout.write("\n");
  if (password.length < 12) { console.error("12文字以上にしてください。"); process.exit(1); }
  const salt = randomBytes(16).toString("base64url");
  const hash = scryptSync(password, salt, 32, { N: 16384, r: 8, p: 1 }).toString("base64url");
  console.log(`JARVIS_OWNER_PASSWORD_HASH=scrypt:16384:${salt}:${hash}`);
});
