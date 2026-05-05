<script lang="ts">
    import { T } from "@threlte/core";
    import {
        isSurface,
        GameStatus,
        type VoxelCube,
        type VoxelPos,
    } from "@caiji-games/minesweeper-cube-core";
    import VoxelCellMesh from "./VoxelCellMesh.svelte";

    type Props = {
        cube: VoxelCube;
        N: number;
        status: GameStatus;
        lastStep: VoxelPos | null;
        forceFlag: boolean;
        pressedKeys: Set<string>;
        onChordPressStart: (pos: VoxelPos) => void;
        onChordPressEnd: () => void;
        onReveal: (pos: VoxelPos) => void;
        onFlag: (pos: VoxelPos) => void;
        onChord: (pos: VoxelPos) => void;
    };

    let {
        cube, N, status, lastStep, forceFlag,
        pressedKeys, onChordPressStart, onChordPressEnd,
        onReveal, onFlag, onChord,
    }: Props = $props();

    // Voxel cube spans world coords [-1, 1] in each axis. Cell size = 2/N. We leave a small gap
    // by making the visible box slightly smaller than the cell slot so neighbors don't z-fight.
    const cellSlot = $derived(2 / N);
    const boxSize = $derived(cellSlot * 0.9);

    // Layout list — depends only on N, NOT on cube cell state. Recomputing this when a cell is
    // revealed would re-walk every voxel and rebuild the list for nothing; by reading cube only
    // inside the {#each} body we let Svelte 5 track per-cell mutations and re-render just the
    // affected `<VoxelCellMesh>`. Position + outward face flags are precomputed here so the
    // template stays a single tight loop.
    const surfaceVoxels = $derived.by(() => {
        const half = cellSlot / 2;
        const list: Array<{
            pos: VoxelPos;
            key: string;
            center: [number, number, number];
            outward: { posX: boolean; negX: boolean; posY: boolean; negY: boolean; posZ: boolean; negZ: boolean };
        }> = [];
        for (let x = 0; x < N; x++)
            for (let y = 0; y < N; y++)
                for (let z = 0; z < N; z++) {
                    if (!isSurface(x, y, z, N)) continue;
                    list.push({
                        pos: { x, y, z },
                        key: `${x},${y},${z}`,
                        center: [
                            -1 + x * cellSlot + half,
                            -1 + y * cellSlot + half,
                            -1 + z * cellSlot + half,
                        ],
                        outward: {
                            posX: x === N - 1, negX: x === 0,
                            posY: y === N - 1, negY: y === 0,
                            posZ: z === N - 1, negZ: z === 0,
                        },
                    });
                }
        return list;
    });
</script>

{#each surfaceVoxels as item (item.key)}
    {@const p = item.pos}
    {@const c = cube[p.x][p.y][p.z]}
    <T.Group position={item.center}>
        <VoxelCellMesh
            cell={c}
            pos={p}
            size={boxSize}
            depth={boxSize}
            {N}
            {status}
            isLastStep={!!lastStep && lastStep.x === p.x && lastStep.y === p.y && lastStep.z === p.z}
            isPressed={pressedKeys.has(item.key)}
            {forceFlag}
            outward={item.outward}
            {onChordPressStart}
            {onChordPressEnd}
            {onReveal}
            {onFlag}
            {onChord}
        />
    </T.Group>
{/each}
