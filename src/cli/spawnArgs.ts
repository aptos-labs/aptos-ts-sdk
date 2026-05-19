// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

import { existsSync } from "node:fs";
import { platform } from "node:os";
import { dirname, join } from "node:path";

/**
 * Shell metacharacters that would be interpreted if a caller-supplied CLI
 * argument were ever to pass through a shell. Kept as defense-in-depth even
 * though `LocalNode.start` and `Move.runCommand` now invoke `node` directly
 * with `npx-cli.js` and never set `shell: true` on any platform — this guards
 * against future regressions and against any downstream consumer that wires
 * these args into a different spawn invocation.
 *
 * - cmd.exe metacharacters: `& | < > ^ ( ) " ' % !` plus newlines
 *   (`%` triggers environment-variable expansion like `%USERPROFILE%`;
 *   `!` triggers delayed expansion).
 * - /bin/sh metacharacters: `& | ; < > ` $ ( ) "` `'` plus newlines.
 *
 * Backslash is intentionally NOT in the blocklist even though it's a
 * /bin/sh escape character — Windows paths (`C:\Program Files\...`) and
 * Windows-style flag values rely on it, and disallowing it would break
 * legitimate `extraArgs` usage on every Move/LocalNode call from a Windows
 * developer machine.
 *
 * Common, legitimate CLI argument characters (letters, digits, `-`, `_`,
 * `=`, `.`, `,`, `:`, `/`, `\`, space) are unaffected.
 */
const UNSAFE_SHELL_CHARS = /[&|;<>`$()"'\n\r^!*?%]/;

/**
 * Validates that a CLI argument does not contain shell metacharacters that
 * could be interpreted by the shell when passed via `spawn(..., { shell: true })`.
 *
 * @throws Error if `arg` contains any unsafe shell character.
 */
export function assertSafeCliArg(arg: string): void {
  if (typeof arg !== "string") {
    throw new Error(`CLI argument must be a string, received ${typeof arg}`);
  }
  if (UNSAFE_SHELL_CHARS.test(arg)) {
    throw new Error(
      `CLI argument contains characters that could be interpreted by the shell: ${JSON.stringify(arg)}. ` +
        "Remove shell metacharacters (& | ; < > \" ' ` $ ( ) ^ ! * ? % newlines).",
    );
  }
}

/**
 * Validates every element of an args array. See {@link assertSafeCliArg}.
 */
export function assertSafeCliArgs(args: ReadonlyArray<string>): void {
  for (const arg of args) {
    assertSafeCliArg(arg);
  }
}

/**
 * Locates the `npx-cli.js` script bundled with the active Node.js
 * installation so callers can invoke it via `spawn(process.execPath, ...)`
 * instead of going through the `npx` / `npx.cmd` shim.
 *
 * Why: Node.js 18.20.2+ / 20.12.2+ refuses to spawn `.cmd` / `.bat` files
 * on Windows without `shell: true` (CVE-2024-27980 mitigation). Using
 * `shell: true` re-introduces shell-injection surface that static analyzers
 * (CodeQL `js/shell-command-constructed-from-input`) flag whenever any part
 * of the args array originates from caller input. Invoking the underlying
 * `npx-cli.js` directly with `node` sidesteps the shim entirely, lets us
 * keep `shell: false` on every platform, and removes the injection sink
 * regardless of what's in the args.
 *
 * Search layout (covers nodejs.org installers, nvm, fnm, asdf, the Windows
 * MSI, and most Linux distro packages):
 * - Windows: `<execDir>/node_modules/npm/bin/npx-cli.js`
 * - POSIX:   `<execDir>/../lib/node_modules/npm/bin/npx-cli.js`
 *
 * @throws Error if `npx-cli.js` cannot be located.
 */
export function resolveNpxCli(): string {
  const execDir = dirname(process.execPath);
  const candidates =
    platform() === "win32"
      ? [join(execDir, "node_modules", "npm", "bin", "npx-cli.js")]
      : [join(execDir, "..", "lib", "node_modules", "npm", "bin", "npx-cli.js")];

  for (const candidate of candidates) {
    if (existsSync(candidate)) {
      return candidate;
    }
  }

  throw new Error(
    "Unable to locate npx-cli.js bundled with Node.js. The Aptos SDK CLI helpers " +
      "(LocalNode, Move) require npm to be co-installed with Node.js (the default " +
      `for installs from nodejs.org, nvm, fnm, asdf, the Windows MSI, etc.). Searched: ${candidates.join(", ")}`,
  );
}
