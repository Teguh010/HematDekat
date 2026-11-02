import assert from "node:assert/strict";
import { readdirSync, readFileSync } from "node:fs";
import { join, relative } from "node:path";
import test from "node:test";

// Guard for the theming rules in AGENTS.md "Styling": components use design tokens
// (brand-*, ink-*, danger-*, warn-*, surface, on-brand) defined in app/globals.css,
// never raw palette classes or hex colors.

const root = join(import.meta.dirname, "..");
const scanned = ["app", "components"];

// Intentional exceptions: metadata files that cannot use CSS classes.
const allowedFiles = new Set(["app/opengraph-image.tsx", "app/manifest.ts"]);

const rawPalette =
  /\b(?:slate|gray|zinc|neutral|stone|red|orange|amber|yellow|lime|green|emerald|teal|cyan|sky|blue|indigo|violet|purple|fuchsia|pink|rose)-\d{2,3}\b/;
const rawBlackWhite = /\b(?:bg|text|border|ring|fill|stroke)-(?:white|black)\b/;
const hexColor = /#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3})\b/;

function sourceFiles(dir: string): string[] {
  return readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const path = join(dir, entry.name);
    if (entry.isDirectory()) {
      return sourceFiles(path);
    }
    return /\.(?:ts|tsx)$/.test(entry.name) ? [path] : [];
  });
}

export function findViolations(files: Array<{ path: string; text: string }>): string[] {
  return files.flatMap(({ path, text }) =>
    text.split("\n").flatMap((line, index) =>
      [rawPalette, rawBlackWhite, hexColor]
        .filter((pattern) => pattern.test(line))
        .map(() => `${path}:${index + 1}: ${line.trim()}`),
    ),
  );
}

test("components use design tokens instead of raw palette classes or hex colors", () => {
  const files = scanned
    .flatMap((dir) => sourceFiles(join(root, dir)))
    .map((file) => ({ path: relative(root, file), text: readFileSync(file, "utf8") }))
    .filter(({ path }) => !allowedFiles.has(path));

  assert.ok(files.length > 20, "expected to scan the app and components folders");
  assert.deepEqual(findViolations(files), []);
});

test("the guard detects raw palette classes and hex colors", () => {
  const violations = findViolations([
    { path: "a.tsx", text: '<p className="text-emerald-600">x</p>' },
    { path: "b.tsx", text: '<p className="bg-white">x</p>' },
    { path: "c.tsx", text: 'const c = "#059669";' },
    { path: "d.tsx", text: '<a href="#content" className="text-brand-600 bg-surface">x</a>' },
  ]);

  assert.equal(violations.length, 3);
});
