export const isTauri = (): boolean =>
    typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export async function setWindowSize(width: number, height: number) {
    if (!isTauri()) return;
    try {
        const { getCurrentWindow } = await import("@tauri-apps/api/window");
        const { LogicalSize } = await import("@tauri-apps/api/dpi");
        await getCurrentWindow().setSize(new LogicalSize(width, height));
    } catch (error) {
        console.warn("Failed to set window size:", error);
    }
}

export async function setAchievements(achievements: string[]) {
    if (!isTauri() || achievements.length === 0) return;
    try {
        const { invoke } = await import("@tauri-apps/api/core");
        await invoke("set_achievements", { achievements });
    } catch (error) {
        console.error("Failed to set achievements:", error);
    }
}
