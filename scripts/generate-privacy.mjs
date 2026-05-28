#!/usr/bin/env node
// Generates per-app privacy policies from docs/privacy/template.md + apps.json.
//
// Run from anywhere via `pnpm gen:privacy` (registered in root package.json scripts).
//
// Template syntax (mustache-ish, but custom — no dependency):
//   {{var}}                      Variable substitution from the merged ctx (common + app)
//   {{#if <cond>}}…{{/if}}       Include block when condition is truthy
//   {{#unless <cond>}}…{{/unless}} Include block when condition is falsy
//
// Conditions: either `has_X` (true when X appears in the app's `sdks` array) or any
// other key in ctx (truthy check). No expressions, no comparisons — kept deliberately
// minimal so the policy stays auditable and we don't reinvent Handlebars.
//
// Output goes to docs/privacy/generated/<app-key>.md (committed — diffable history).
// Each file is what you paste into the corresponding Play Console listing / Notion
// privacy page. Regenerate any time you change template.md or apps.json. If the
// committed output drifts from a fresh generation, someone forgot to run the script
// after editing — a future CI check can catch that.

import { readFile, writeFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, "..");
const PRIVACY_DIR = join(ROOT, "docs", "privacy");
const OUT_DIR = join(PRIVACY_DIR, "generated");

// Mustache-style "standalone tag" handling. A block tag that's the only non-whitespace
// content on its line is treated as invisible to layout: the tag's own line break is
// eaten, but surrounding blank lines (paragraph separators) are preserved. Without this,
// `{{#if X}}` lines leave a blank line between list items when X is true.
//
// Implementation: collapse each standalone tag onto the start of the following non-tag
// line, dropping the tag's own trailing newline. Variable tags `{{var}}` are always
// inline so they don't need this treatment.
function preprocessStandalone(s) {
    const lines = s.split("\n");
    const out = [];
    let pending = "";
    const STANDALONE = /^\s*(\{\{(?:#if|#unless)\s+\w+\}\}|\{\{\/(?:if|unless)\}\})\s*$/;
    for (const line of lines) {
        const m = line.match(STANDALONE);
        if (m) pending += m[1];
        else { out.push(pending + line); pending = ""; }
    }
    if (pending) out.push(pending);
    return out.join("\n");
}

// `has_X` checks the app's `sdks` array. Anything else falls back to a truthy lookup
// on ctx. Intentionally narrow: extending this means extending the auditability story
// too (a future reader has to understand more grammar).
function evaluateCondition(condition, ctx) {
    const m = condition.match(/^has_(\w+)$/);
    if (m) return Array.isArray(ctx.sdks) && ctx.sdks.includes(m[1]);
    return !!ctx[condition];
}

// Recursive descent: walks the source character by character, splicing in block
// contents (or skipping them) and inlining variables. Recurses on block bodies so
// nested `{{#if}}` inside an outer `{{#if}}` resolves correctly. The depth counter
// in the close-tag search lets us match the right `{{/if}}` when blocks are nested.
function render(source, ctx) {
    const OPEN_IF = "{{#if ";
    const OPEN_UNLESS = "{{#unless ";
    const CLOSE_IF = "{{/if}}";
    const CLOSE_UNLESS = "{{/unless}}";

    let out = "";
    let i = 0;
    while (i < source.length) {
        const isIf = source.startsWith(OPEN_IF, i);
        const isUnless = !isIf && source.startsWith(OPEN_UNLESS, i);

        if (isIf || isUnless) {
            const openTag = isIf ? OPEN_IF : OPEN_UNLESS;
            const closeTag = isIf ? CLOSE_IF : CLOSE_UNLESS;
            const headEnd = source.indexOf("}}", i + openTag.length);
            if (headEnd < 0) throw new Error(`Unclosed opening tag at index ${i}`);
            const condition = source.slice(i + openTag.length, headEnd).trim();

            // Scan forward for the matching close tag, respecting nesting of the same
            // block type. Different block types don't nest into each other for depth
            // purposes — `{{#if X}}{{#unless Y}}…{{/unless}}{{/if}}` resolves naturally.
            let depth = 1;
            let j = headEnd + 2;
            let contentEnd = -1;
            let blockEnd = -1;
            while (j < source.length) {
                if (source.startsWith(openTag, j)) {
                    depth++;
                    const nextHead = source.indexOf("}}", j);
                    if (nextHead < 0) throw new Error(`Unclosed nested tag at ${j}`);
                    j = nextHead + 2;
                } else if (source.startsWith(closeTag, j)) {
                    depth--;
                    if (depth === 0) {
                        contentEnd = j;
                        blockEnd = j + closeTag.length;
                        break;
                    }
                    j += closeTag.length;
                } else {
                    j++;
                }
            }
            if (depth !== 0) throw new Error(`Unclosed block: ${openTag.trim()}${condition}`);

            const truth = evaluateCondition(condition, ctx);
            const include = isIf ? truth : !truth;
            if (include) out += render(source.slice(headEnd + 2, contentEnd), ctx);
            // else: omit the block entirely (including its leading/trailing whitespace
            // around the tags — `cleanWhitespace` collapses any blank-line buildup).
            i = blockEnd;
        } else if (source.startsWith("{{", i)) {
            const end = source.indexOf("}}", i);
            if (end < 0) throw new Error(`Unclosed variable at index ${i}`);
            const varName = source.slice(i + 2, end).trim();
            const value = ctx[varName];
            // Unresolved variables stay visible in the output so the reader notices the
            // gap rather than seeing a silent empty string. Easy to grep for after a run.
            out += value != null ? String(value) : `{{${varName}}}`;
            i = end + 2;
        } else {
            out += source[i];
            i++;
        }
    }
    return out;
}

// Conditional blocks usually sit on their own lines, so removing them leaves runs of
// blank lines behind. Collapse 3+ newlines to exactly 2 (one blank line — standard
// paragraph spacing). Also trim trailing whitespace per-line to keep diffs clean.
function cleanWhitespace(s) {
    return s
        .replace(/[ \t]+\n/g, "\n")
        .replace(/\n{3,}/g, "\n\n")
        .replace(/^\n+/, "")
        .replace(/\n+$/, "\n");
}

async function main() {
    const tpl = await readFile(join(PRIVACY_DIR, "template.md"), "utf8");
    const cfg = JSON.parse(await readFile(join(PRIVACY_DIR, "apps.json"), "utf8"));

    await mkdir(OUT_DIR, { recursive: true });

    const preprocessed = preprocessStandalone(tpl);
    for (const [key, app] of Object.entries(cfg.apps)) {
        // Merge common values with per-app values. App-specific keys win on collision —
        // this is how you'd override (e.g.) contact_email for a single app if ever needed.
        const ctx = { ...cfg.common, ...app };
        const rendered = cleanWhitespace(render(preprocessed, ctx));
        const outPath = join(OUT_DIR, `${key}.md`);
        await writeFile(outPath, rendered, "utf8");
        const sdkSummary = ctx.sdks?.length ? ctx.sdks.join(",") : "(no SDKs)";
        console.log(`✓ ${outPath}  [${sdkSummary}]`);
    }
}

main().catch((e) => {
    console.error("generate-privacy failed:", e);
    process.exit(1);
});
