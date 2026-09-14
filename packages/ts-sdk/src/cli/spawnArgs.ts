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
const UNSAFE_SHELL_CHARS = /[&|;<>`$()[\]#"'\n\r^!*?%]/;

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
        "Remove shell metacharacters (& | ; < > \" ' ` $ ( ) [ ] # ^ ! * ? % newlines).",
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
 * Validates a single CLI argument and returns a copy with any shell
 * metacharacters stripped out.
 *
 * {@link assertSafeCliArg} already rejects every shell metacharacter, so the
 * scrubbing chain below is a runtime no-op for any argument that passes
 * validation. We keep it as defense-in-depth and, importantly, so that static
 * analysis (e.g. CodeQL's "Unsafe shell command constructed from library
 * input" query) can see that the value flowing into `spawn(..., { shell: true })`
 * on Windows has been stripped of shell metacharacters. CodeQL only recognizes
 * a sequence of `String.prototype.replace` calls that covers every shell
 * metacharacter as a sanitizer barrier; a `RegExp.test`-based guard in a
 * separate function is not enough to break the tracked data flow.
 *
 * The chain strips every character that {@link UNSAFE_SHELL_CHARS}/
 * {@link assertSafeCliArg} reject, so the scrub is a complete superset of the
 * validation blocklist rather than only the subset CodeQL requires.
 *
 * @returns the validated argument with shell metacharacters removed.
 * @throws Error if `arg` contains any unsafe shell character.
 */
export function sanitizeCliArg(arg: string): string {
  assertSafeCliArg(arg);
  return arg
    .replace(/&/g, "")
    .replace(/\|/g, "")
    .replace(/;/g, "")
    .replace(/</g, "")
    .replace(/>/g, "")
    .replace(/`/g, "")
    .replace(/\$/g, "")
    .replace(/\(/g, "")
    .replace(/\)/g, "")
    .replace(/\[/g, "")
    .replace(/\]/g, "")
    .replace(/#/g, "")
    .replace(/"/g, "")
    .replace(/'/g, "")
    .replace(/\^/g, "")
    .replace(/!/g, "")
    .replace(/\*/g, "")
    .replace(/\?/g, "")
    .replace(/%/g, "")
    .replace(/\n/g, "")
    .replace(/\r/g, "");
}

/**
 * Validates and scrubs every element of an args array, returning the sanitized
 * array that should be passed to `spawn`. See {@link sanitizeCliArg}.
 */
export function sanitizeCliArgs(args: ReadonlyArray<string>): string[] {
  return args.map(sanitizeCliArg);
}
