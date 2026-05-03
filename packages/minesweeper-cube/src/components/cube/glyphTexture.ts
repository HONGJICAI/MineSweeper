import { CanvasTexture, LinearFilter, SRGBColorSpace, type Texture } from "three";

// Renders a single glyph (emoji or text) to a canvas and wraps it as a Three.js texture.
// Cached by content + style so each unique glyph is rasterized once.
//
// We use this instead of @threlte/extras' <Text> (troika-three-text) to avoid pulling in the
// ~200KB SDF text engine — for the cube minesweeper we only ever render single characters.

const TEXT_FONT_STACK =
    'system-ui, -apple-system, "Segoe UI", Roboto, "Helvetica Neue", Helvetica, Arial, sans-serif';
const EMOJI_FONT_STACK =
    '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';

const cache = new Map<string, CanvasTexture>();

type GlyphOpts = {
    text: string;
    color: string;
    fontStack: string;
    pixelSize: number;
    scale: number;       // glyph height as fraction of pixelSize
    bold?: boolean;
};

function getGlyph(opts: GlyphOpts): Texture {
    const key = `${opts.text}|${opts.color}|${opts.fontStack}|${opts.pixelSize}|${opts.bold ? "b" : ""}|${opts.scale}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = opts.pixelSize;
    canvas.height = opts.pixelSize;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, opts.pixelSize, opts.pixelSize);
    ctx.font = `${opts.bold ? "bold " : ""}${Math.floor(opts.pixelSize * opts.scale)}px ${opts.fontStack}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = opts.color;
    ctx.fillText(opts.text, opts.pixelSize / 2, opts.pixelSize / 2);

    const tex = new CanvasTexture(canvas);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.anisotropy = 4;
    tex.colorSpace = SRGBColorSpace;
    cache.set(key, tex);
    return tex;
}

export function getEmojiTexture(emoji: string, pixelSize = 192): Texture {
    // Color is irrelevant: the system color-emoji font supplies its own colors per glyph and
    // ignores fillStyle for color emojis.
    return getGlyph({ text: emoji, color: "#000", fontStack: EMOJI_FONT_STACK, pixelSize, scale: 0.78 });
}

export function getNumberTexture(n: number, color: string, pixelSize = 192): Texture {
    return getGlyph({ text: String(n), color, fontStack: TEXT_FONT_STACK, pixelSize, scale: 0.72, bold: true });
}
