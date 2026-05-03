<script lang="ts">
    import { T } from "@threlte/core";
    import type { CubeCell, CubePosition, Face, GameStatus } from "@caiji-games/minesweeper-cube-core";
    import CellMesh from "./CellMesh.svelte";
    import { FACE_PLACEMENT, cellLocalPosition, cellSize } from "./faceGeometry.ts";

    type Props = {
        face: Face;
        grid: CubeCell[][];
        N: number;
        status: GameStatus;
        // Pre-filtered to this face by the parent (null if the stepped mine is on another face).
        lastStep: CubePosition | null;
        forceFlag: boolean;
        pressedKeys: Set<string>;
        onChordPressStart: (pos: CubePosition) => void;
        onChordPressEnd: () => void;
        onReveal: (pos: CubePosition) => void;
        onFlag: (pos: CubePosition) => void;
        onChord: (pos: CubePosition) => void;
    };

    let {
        face, grid, N, status, lastStep, forceFlag,
        pressedKeys, onChordPressStart, onChordPressEnd,
        onReveal, onFlag, onChord,
    }: Props = $props();

    const placement = $derived(FACE_PLACEMENT[face]);
    const cs = $derived(cellSize(N));
</script>

<T.Group position={placement.position} rotation={placement.rotation}>
    <!-- Backing plate so the face has a visible base color even between cells. -->
    <T.Mesh position={[0, 0, -0.001]}>
        <T.PlaneGeometry args={[2, 2]} />
        <T.MeshStandardMaterial color="#1e293b" roughness={0.9} />
    </T.Mesh>

    {#each grid as row, r}
        {#each row as cell, c (face + ":" + r + "," + c)}
            {@const [cx, cy] = cellLocalPosition(r, c, N)}
            <T.Group position={[cx, cy, 0]}>
                <CellMesh
                    {cell}
                    pos={{ face, r, c }}
                    size={cs}
                    gap={cs * 0.08}
                    {status}
                    isLastStep={!!lastStep && lastStep.r === r && lastStep.c === c}
                    isPressed={pressedKeys.has(`${face}:${r},${c}`)}
                    {forceFlag}
                    {onChordPressStart}
                    {onChordPressEnd}
                    {onReveal}
                    {onFlag}
                    {onChord}
                />
            </T.Group>
        {/each}
    {/each}
</T.Group>
