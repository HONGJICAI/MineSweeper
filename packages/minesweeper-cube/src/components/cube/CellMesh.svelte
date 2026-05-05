<script lang="ts">
    import { T } from "@threlte/core";
    import type { CubeCell, CubePosition } from "@caiji-games/minesweeper-cube-core";
    import { GameStatus } from "@caiji-games/minesweeper-cube-core";
    import { getEmojiTexture, getNumberTexture } from "./glyphTexture.ts";

    type Props = {
        cell: CubeCell;
        pos: CubePosition;
        size: number; // cell edge length in world units
        gap: number;  // gap between cells (subtracted from size)
        status: GameStatus;
        isLastStep: boolean; // true for the one mine the player actually stepped on
        isPressed: boolean;  // chord-preview highlight (this cell would be revealed by a chord)
        forceFlag: boolean;  // touch + flag-mode override
        onChordPressStart: (pos: CubePosition) => void;
        onChordPressEnd: () => void;
        onReveal: (pos: CubePosition) => void;
        onFlag: (pos: CubePosition) => void;
        onChord: (pos: CubePosition) => void;
    };

    let {
        cell, pos, size, gap, status, isLastStep, isPressed, forceFlag,
        onChordPressStart, onChordPressEnd,
        onReveal, onFlag, onChord,
    }: Props = $props();

    const NUMBER_COLORS = [
        "#cbd5e1", // 0 — unused; revealed-zero cells render no text
        "#2563eb", // 1
        "#16a34a", // 2
        "#dc2626", // 3
        "#1e3a8a", // 4
        "#9a3412", // 5
        "#0891b2", // 6
        "#0f172a", // 7
        "#475569", // 8
    ];

    let hovered = $state(false);

    let interactive = $derived(status === GameStatus.Init || status === GameStatus.Gaming);

    let color = $derived.by(() => {
        // Stepped-on mine gets the highlight; other revealed mines blend with the safe-cell base
        // so the player can tell which one ended the game (matches the 2D version).
        if (cell.isRevealed && cell.isMine && isLastStep) return "#ef4444"; // red-500
        if (cell.isRevealed) return "#e2e8f0"; // revealed safe (or revealed-but-not-stepped mine)
        // Wrong flag at game over: drop the amber so the X glyph reads as "this flag was a mistake".
        if (cell.isFlagged && status === GameStatus.GameOver && !cell.isMine) return "#475569";
        if (cell.isFlagged) return "#fbbf24"; // amber for flag
        if (isPressed) return "#94a3b8"; // chord preview — slate-400, lighter than hover
        return hovered && interactive ? "#64748b" : "#475569"; // unrevealed slate
    });

    let edgeSize = $derived(Math.max(size - gap, size * 0.05));

    function handleClick(event: any) {
        if (!interactive) return;
        const button = event.button ?? event.nativeEvent?.button;
        const shiftFlag = event.shiftKey || event.nativeEvent?.shiftKey;
        const wantFlag = forceFlag || button === 2 || shiftFlag;

        // Revealed numbered cells always chord — chord doesn't conflict with flag mode since
        // a revealed cell can't be flagged anyway, so this stays intuitive on touch.
        if (cell.isRevealed && cell.adjacentMines > 0) {
            onChord(pos);
        } else if (wantFlag) {
            onFlag(pos);
        } else {
            onReveal(pos);
        }
        event.stopPropagation?.();
    }

    function handleContextMenu(event: any) {
        if (!interactive) return;
        onFlag(pos);
        event.stopPropagation?.();
        event.nativeEvent?.preventDefault?.();
    }

    function handlePointerEnter(event: any) {
        hovered = true;
        event.stopPropagation?.();
    }

    function handlePointerLeave() {
        hovered = false;
        // If the pointer leaves any cell, drop the chord preview. The leave will fire on the
        // press source cell when the pointer drags off it, which is exactly the cancel signal.
        onChordPressEnd();
    }

    function handlePointerDown(event: any) {
        if (!interactive) return;
        const button = event.button ?? event.nativeEvent?.button;
        // Only the left button drives chord preview; right-click is the flag shortcut.
        if (button === 2) return;
        if (cell.isRevealed && cell.adjacentMines > 0) {
            onChordPressStart(pos);
            event.stopPropagation?.();
        }
    }

    function handlePointerUp() {
        // Release always clears the preview. If the release is still on the same cell, the
        // browser fires `click` next which runs the chord; otherwise nothing happens.
        onChordPressEnd();
    }
</script>

<T.Mesh
    onclick={handleClick}
    oncontextmenu={handleContextMenu}
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointerenter={handlePointerEnter}
    onpointerleave={handlePointerLeave}
>
    <T.PlaneGeometry args={[edgeSize, edgeSize]} />
    <T.MeshStandardMaterial {color} roughness={0.7} metalness={0.05} />

    <!-- Glyph priority (matches the 2D Cell). All glyphs render via canvas-textured planes so
         we drop troika-three-text from the bundle (~200KB savings) and get OS-native color
         emojis for free.
         1. Revealed safe with count → colored number
         2. Revealed mine that was correctly flagged → 🚩
         3. Revealed mine → 💣
         4. Unrevealed flag on a non-mine after game over → ❌ (wrong flag)
         5. Unrevealed flag → 🚩
    -->
    {#if cell.isRevealed && !cell.isMine && cell.adjacentMines > 0}
        <T.Mesh position={[0, 0, 0.001]}>
            <T.PlaneGeometry args={[size * 0.7, size * 0.7]} />
            <T.MeshBasicMaterial
                map={getNumberTexture(cell.adjacentMines, NUMBER_COLORS[cell.adjacentMines] ?? "#0f172a")}
                transparent
                depthWrite={false}
            />
        </T.Mesh>
    {:else if cell.isRevealed && cell.isMine && cell.isFlagged}
        <T.Mesh position={[0, 0, 0.001]}>
            <T.PlaneGeometry args={[size * 0.7, size * 0.7]} />
            <T.MeshBasicMaterial map={getEmojiTexture("🚩")} transparent depthWrite={false} />
        </T.Mesh>
    {:else if cell.isRevealed && cell.isMine}
        <T.Mesh position={[0, 0, 0.001]}>
            <T.PlaneGeometry args={[size * 0.7, size * 0.7]} />
            <T.MeshBasicMaterial map={getEmojiTexture("💣")} transparent depthWrite={false} />
        </T.Mesh>
    {:else if cell.isFlagged && status === GameStatus.GameOver && !cell.isMine}
        <T.Mesh position={[0, 0, 0.001]}>
            <T.PlaneGeometry args={[size * 0.7, size * 0.7]} />
            <T.MeshBasicMaterial map={getEmojiTexture("❌")} transparent depthWrite={false} />
        </T.Mesh>
    {:else if cell.isFlagged}
        <T.Mesh position={[0, 0, 0.001]}>
            <T.PlaneGeometry args={[size * 0.7, size * 0.7]} />
            <T.MeshBasicMaterial map={getEmojiTexture("🚩")} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
</T.Mesh>
