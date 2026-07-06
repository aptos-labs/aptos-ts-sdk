import { describe, expect, it } from "vitest";
import {
  computeNextVersion,
  getUnreleasedSection,
  hasUnreleasedContent,
  isStrictlyGreater,
  parseArgs,
  setPackageVersion,
  stampChangelog,
} from "../../scripts/prepareRelease.mjs";

describe("computeNextVersion", () => {
  it("bumps patch", () => expect(computeNextVersion("7.2.0", "patch")).toBe("7.2.1"));
  it("bumps minor and zeroes patch", () => expect(computeNextVersion("7.2.3", "minor")).toBe("7.3.0"));
  it("bumps major and zeroes minor+patch", () => expect(computeNextVersion("7.2.3", "major")).toBe("8.0.0"));
  it("rejects non-plain-semver current", () => expect(() => computeNextVersion("7.2.0-beta.1", "patch")).toThrow());
  it("rejects unknown bump", () =>
    // @ts-expect-error deliberately invalid bump
    expect(() => computeNextVersion("7.2.0", "nope")).toThrow());
});

describe("isStrictlyGreater", () => {
  it("true when greater", () => expect(isStrictlyGreater("7.3.0", "7.2.9")).toBe(true));
  it("false when equal", () => expect(isStrictlyGreater("7.2.0", "7.2.0")).toBe(false));
  it("false when lower", () => expect(isStrictlyGreater("7.1.0", "7.2.0")).toBe(false));
});

const CHANGELOG_EMPTY = `# Changelog

Intro paragraph.

# Unreleased

# 7.2.0 (2026-07-06)

## Added

- something old
`;

const CHANGELOG_FULL = `# Changelog

Intro paragraph.

# Unreleased

## Added

- a brand new feature

## Fixed

- a bug

# 2.0.0 (2026-01-01)

## Added

- older
`;

describe("getUnreleasedSection / hasUnreleasedContent", () => {
  it("empty Unreleased has no content", () => {
    expect(hasUnreleasedContent(CHANGELOG_EMPTY)).toBe(false);
  });
  it("populated Unreleased has content", () => {
    expect(hasUnreleasedContent(CHANGELOG_FULL)).toBe(true);
  });
  it("section stops at next top-level heading", () => {
    const section = getUnreleasedSection(CHANGELOG_FULL);
    expect(section).toContain("a brand new feature");
    expect(section).not.toContain("older");
  });
  it("throws when no Unreleased heading", () => {
    expect(() => getUnreleasedSection("# Changelog\n\n# 1.0.0\n")).toThrow();
  });
});

describe("stampChangelog", () => {
  it("renames Unreleased and inserts a fresh empty Unreleased on top", () => {
    const out = stampChangelog(CHANGELOG_FULL, "2.1.0", "2026-07-06");
    // fresh empty Unreleased still present
    expect(out).toContain("# Unreleased\n\n# 2.1.0 (2026-07-06)");
    // the previous entries now sit under the stamped version
    const stampedIdx = out.indexOf("# 2.1.0 (2026-07-06)");
    const featureIdx = out.indexOf("a brand new feature");
    const olderIdx = out.indexOf("# 2.0.0 (2026-01-01)");
    expect(stampedIdx).toBeLessThan(featureIdx);
    expect(featureIdx).toBeLessThan(olderIdx);
  });
  it("throws when no Unreleased heading", () => {
    expect(() => stampChangelog("# Changelog\n", "1.0.0", "2026-07-06")).toThrow();
  });
});

describe("setPackageVersion", () => {
  it("replaces only the top-level version, preserving formatting", () => {
    const pkg = `{\n  "name": "@aptos-labs/ts-sdk",\n  "dependencies": {\n    "x": "1.2.3"\n  },\n  "version": "7.2.0"\n}\n`;
    const out = setPackageVersion(pkg, "7.3.0");
    expect(out).toContain(`"version": "7.3.0"`);
    expect(out).toContain(`"x": "1.2.3"`); // dependency version untouched
  });
  it("throws when no version field", () => {
    expect(() => setPackageVersion(`{\n  "name": "x"\n}\n`, "1.0.0")).toThrow();
  });
});

describe("parseArgs", () => {
  it("parses package + bump", () => {
    expect(parseArgs(["--package", "ts-sdk", "--bump", "minor"])).toEqual({
      pkg: "ts-sdk",
      bump: "minor",
    });
  });
  it("parses package + explicit version", () => {
    expect(parseArgs(["--package", "confidential-asset", "--version", "2.1.0"])).toEqual({
      pkg: "confidential-asset",
      version: "2.1.0",
    });
  });
  it("rejects unknown package", () => expect(() => parseArgs(["--package", "nope", "--bump", "patch"])).toThrow());
  it("rejects both bump and version", () =>
    expect(() => parseArgs(["--package", "ts-sdk", "--bump", "patch", "--version", "1.0.0"])).toThrow());
  it("rejects neither bump nor version", () => expect(() => parseArgs(["--package", "ts-sdk"])).toThrow());
});
