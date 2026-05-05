<script lang="ts">
    import { T } from "@threlte/core";
    import type { CubeCell, VoxelPos } from "@caiji-games/minesweeper-cube-core";
    import { GameStatus } from "@caiji-games/minesweeper-cube-core";
    import { getEmojiTexture, getNumberTexture } from "./glyphTexture.ts";

    type Props = {
        cell: CubeCell;
        pos: VoxelPos;
        size: number;       // box edge length in world units (slightly less than 2/N for the gap)
        depth: number;      // box thickness — for voxels we use full size (cube)
        N: number;
        status: GameStatus;
        isLastStep: boolean;
        isPressed: boolean; // chord-preview highlight
        forceFlag: boolean;
        // Pre-computed: which axis-aligned faces of the box point outward (i.e. visible).
        // Booleans for ±x, ±y, ±z. Glyphs render on every outward face.
        outward: { posX: boolean; negX: boolean; posY: boolean; negY: boolean; posZ: boolean; negZ: boolean };
        onChordPressStart: (pos: VoxelPos) => void;
        onChordPressEnd: () => void;
        onReveal: (pos: VoxelPos) => void;
        onFlag: (pos: VoxelPos) => void;
        onChord: (pos: VoxelPos) => void;
    };

    let {
        cell, pos, size, depth, status, isLastStep, isPressed, forceFlag, outward,
        onChordPressStart, onChordPressEnd,
        onReveal, onFlag, onChord,
    }: Props = $props();

    const NUMBER_COLORS = [
        "#cbd5e1", "#2563eb", "#16a34a", "#dc2626", "#1e3a8a",
        "#9a3412", "#0891b2", "#0f172a", "#475569",
    ];

    let hovered = $state(false);
    let interactive = $derived(status === GameStatus.Init || status === GameStatus.Gaming);

    let color = $derived.by(() => {
        if (cell.isRevealed && cell.isMine && isLastStep) return "#ef4444";
        if (cell.isRevealed) return "#e2e8f0";
        // Wrong flag at game over: drop amber → unrevealed slate so the X reads as "mistake".
        if (cell.isFlagged && status === GameStatus.GameOver && !cell.isMine) return "#475569";
        if (cell.isFlagged) return "#fbbf24";
        if (isPressed) return "#94a3b8";
        return hovered && interactive ? "#64748b" : "#475569";
    });

    // No-op raycast: glyph planes shouldn't intercept clicks intended for the box behind them.
    // (Three.js's Mesh.raycast hits transparent meshes too, so without this the box never gets
    // its onclick fired — the glyph plane is closer to the camera and "consumes" the hit.)
    const noRaycast = () => {};

    function handleClick(event: any) {
        if (!interactive) return;
        const button = event.button ?? event.nativeEvent?.button;
        const shiftFlag = event.shiftKey || event.nativeEvent?.shiftKey;
        const wantFlag = forceFlag || button === 2 || shiftFlag;
        if (cell.isRevealed && cell.adjacentMines > 0) onChord(pos);
        else if (wantFlag) onFlag(pos);
        else onReveal(pos);
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
        // Leaving any cell drops the chord preview — the leave fires on the press source first
        // when the pointer drags off it, which is the cancel signal.
        onChordPressEnd();
    }

    function handlePointerDown(event: any) {
        if (!interactive) return;
        const button = event.button ?? event.nativeEvent?.button;
        if (button === 2) return;
        if (cell.isRevealed && cell.adjacentMines > 0) {
            onChordPressStart(pos);
            event.stopPropagation?.();
        }
    }

    function handlePointerUp() {
        onChordPressEnd();
    }

    // Glyph plane offsets + rotations for each of the 6 outward face directions. The plane is
    // pushed `size/2 + ε` along the face normal so it sits flush on the box surface; rotation
    // turns the plane (default normal +Z) to face the same direction as the box face.
    const GLYPH_OFFSET_EPS = 0.002;

    function glyphTexture() {
        if (cell.isRevealed && !cell.isMine && cell.adjacentMines > 0) {
            return getNumberTexture(cell.adjacentMines, NUMBER_COLORS[cell.adjacentMines] ?? "#0f172a");
        }
        if (cell.isRevealed && cell.isMine && cell.isFlagged) return getEmojiTexture("🚩");
        if (cell.isRevealed && cell.isMine) return getEmojiTexture("💣");
        if (cell.isFlagged && status === GameStatus.GameOver && !cell.isMine) return getEmojiTexture("❌");
        if (cell.isFlagged) return getEmojiTexture("🚩");
        return null;
    }

    let texture = $derived(glyphTexture());
    // Glyph plane size: 70% of the box face (matches the hollow cell glyph proportion).
    let glyphSize = $derived(size * 0.7);
    let halfDepth = $derived(depth / 2);
</script>

<T.Mesh
    onclick={handleClick}
    oncontextmenu={handleContextMenu}
    onpointerdown={handlePointerDown}
    onpointerup={handlePointerUp}
    onpointerenter={handlePointerEnter}
    onpointerleave={handlePointerLeave}
>
    <T.BoxGeometry args={[size, size, depth]} />
    <T.MeshStandardMaterial {color} roughness={0.7} metalness={0.05} />
</T.Mesh>

{#if texture}
    {#if outward.posX}
        <T.Mesh position={[halfDepth + GLYPH_OFFSET_EPS, 0, 0]} rotation={[0, Math.PI / 2, 0]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
    {#if outward.negX}
        <T.Mesh position={[-halfDepth - GLYPH_OFFSET_EPS, 0, 0]} rotation={[0, -Math.PI / 2, 0]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
    {#if outward.posY}
        <T.Mesh position={[0, halfDepth + GLYPH_OFFSET_EPS, 0]} rotation={[-Math.PI / 2, 0, 0]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
    {#if outward.negY}
        <T.Mesh position={[0, -halfDepth - GLYPH_OFFSET_EPS, 0]} rotation={[Math.PI / 2, 0, 0]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
    {#if outward.posZ}
        <T.Mesh position={[0, 0, halfDepth + GLYPH_OFFSET_EPS]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
    {#if outward.negZ}
        <T.Mesh position={[0, 0, -halfDepth - GLYPH_OFFSET_EPS]} rotation={[0, Math.PI, 0]} raycast={noRaycast}>
            <T.PlaneGeometry args={[glyphSize, glyphSize]} />
            <T.MeshBasicMaterial map={texture} transparent depthWrite={false} />
        </T.Mesh>
    {/if}
{/if}
