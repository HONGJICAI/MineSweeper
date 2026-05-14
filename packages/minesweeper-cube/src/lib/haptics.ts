// Manual haptic feedback. Gated on VITE_PLATFORM=mobile so web / desktop builds never vibrate:
//   - Desktop has no vibration motor; the call would be a no-op anyway.
//   - Web users in mobile Chrome don't expect a random web game to buzz their phone — HTML5
//     game convention is silent, even though `navigator.vibrate` is technically supported.
//   - Tauri Android explicitly disables system long-press haptic in AndroidManifest, so we
//     manually buzz here on the events that warrant feedback (flag toggle, mine stepped on).
const ENABLED = import.meta.env.VITE_PLATFORM === "mobile";

export function buzz(pattern: number | number[]): void {
    if (!ENABLED) return;
    if (typeof navigator === "undefined" || typeof navigator.vibrate !== "function") return;
    navigator.vibrate(pattern);
}
