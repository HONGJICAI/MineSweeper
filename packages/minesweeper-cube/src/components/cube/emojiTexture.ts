import { CanvasTexture, LinearFilter, SRGBColorSpace, type Texture } from "three";

// Renders an emoji to a canvas and wraps it in a Three.js texture so we get the OS color emoji
// font (Segoe UI Emoji / Apple Color Emoji / Noto Color Emoji) instead of the troika SDF text
// renderer's monochrome fallback.
//
// Cached by `${emoji}:${pixelSize}` so each emoji is rasterized at most once per resolution.

const cache = new Map<string, CanvasTexture>();

const EMOJI_FONT_STACK = '"Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", "Twemoji Mozilla", system-ui, sans-serif';

export function getEmojiTexture(emoji: string, pixelSize = 192): Texture {
    const key = `${emoji}:${pixelSize}`;
    const cached = cache.get(key);
    if (cached) return cached;

    const canvas = document.createElement("canvas");
    canvas.width = pixelSize;
    canvas.height = pixelSize;
    const ctx = canvas.getContext("2d")!;
    ctx.clearRect(0, 0, pixelSize, pixelSize);
    // 0.78 leaves a small margin around the glyph; some emoji fonts have inconsistent metrics
    // and clip if drawn at full size.
    ctx.font = `${Math.floor(pixelSize * 0.78)}px ${EMOJI_FONT_STACK}`;
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillText(emoji, pixelSize / 2, pixelSize / 2);

    const tex = new CanvasTexture(canvas);
    tex.minFilter = LinearFilter;
    tex.magFilter = LinearFilter;
    tex.anisotropy = 4;
    tex.colorSpace = SRGBColorSpace;
    cache.set(key, tex);
    return tex;
}
