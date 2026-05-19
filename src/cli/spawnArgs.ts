// Copyright © Aptos Foundation
// SPDX-License-Identifier: Apache-2.0

/**
 * Shell metacharacters that enable command injection when passed through
 * `spawn(..., { shell: true })`. We have to keep `shell: true` on Windows
 * because Node.js 18.20.2+ / 20.12.2+ refuses to spawn `.cmd`/`.bat` shims
 * (like `npx.cmd`) without it (CVE-2024-27980 mitigation), so the next-best
 * mitigation is to reject argument strings that contain characters the shell
 * would interpret.
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
 * developer machine. The trade-off: on POSIX a caller passing `"a\b"` will
 * have the backslash interpreted by `/bin/sh`, but our spawn call uses
 * `shell: false` on POSIX anyway, so this doesn't materially matter.
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
