<script lang="ts">
    import { T } from "@threlte/core";
    import { interactivity } from "@threlte/extras";
    import { FACES, type CubePosition } from "@caiji-games/minesweeper-cube-core";
    import CubeFace from "./CubeFace.svelte";
    import CubeControls from "./CubeControls.svelte";
    import type { GameState } from "../../state/game.svelte.ts";

    type Props = {
        game: GameState;
        forceFlag: boolean;
        pressedKeys: Set<string>;
        onChordPressStart: (pos: CubePosition) => void;
        onChordPressEnd: () => void;
    };
    let { game, forceFlag, pressedKeys, onChordPressStart, onChordPressEnd }: Props = $props();

    interactivity();
</script>

<T.PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />

<CubeControls
    rotateSpeed={1.0}
    zoomSpeed={1.0}
    dampingFactor={0.08}
    minDistance={2.5}
    maxDistance={8}
/>

<T.AmbientLight intensity={1.2} color="#ffffff" />
<T.DirectionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
<T.DirectionalLight position={[-5, -3, -5]} intensity={0.5} color="#cbd5ff" />

{#each FACES as face}
    <CubeFace
        {face}
        grid={game.cube[face]}
        N={game.N}
        status={game.status}
        lastStep={game.lastStep && game.lastStep.face === face ? game.lastStep : null}
        {forceFlag}
        {pressedKeys}
        {onChordPressStart}
        {onChordPressEnd}
        onReveal={(p: CubePosition) => game.reveal(p)}
        onFlag={(p: CubePosition) => game.toggleFlag(p)}
        onChord={(p: CubePosition) => game.chord(p)}
    />
{/each}
