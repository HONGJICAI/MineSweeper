<script lang="ts">
    import { T, useThrelte } from "@threlte/core";
    import { interactivity } from "@threlte/extras";
    import { tweened } from "svelte/motion";
    import { cubicInOut } from "svelte/easing";
    import {
        FACES,
        type Cube,
        type CubePosition,
        type VoxelCube,
        type VoxelPos,
    } from "@caiji-games/minesweeper-cube-core";
    import CubeFace from "./CubeFace.svelte";
    import CubeControls from "./CubeControls.svelte";
    import VoxelGrid from "./VoxelGrid.svelte";
    import type { GameState } from "../../state/game.svelte.ts";

    type Props = {
        game: GameState;
        forceFlag: boolean;
        pressedKeys: Set<string>;
        onChordPressStart: (pos: CubePosition | VoxelPos) => void;
        onChordPressEnd: () => void;
    };
    let { game, forceFlag, pressedKeys, onChordPressStart, onChordPressEnd }: Props = $props();

    interactivity();

    // Threlte runs in on-demand render mode: frames only redraw when invalidate() is called.
    // OrbitControls / interactivity self-invalidate on user input, but our tween-driven scale
    // changes don't — without an explicit invalidate() per tick, the scale animation looks
    // stutter-y because the renderer is asleep between user inputs.
    const { invalidate } = useThrelte();

    // Level-bump scale animation. svelte/motion's tweened handles the rAF loop + interruption
    // semantics for us — each .set() smoothly retargets from the current value, so back-to-back
    // phase changes (e.g. spamming the cheat code) don't cause stutter.
    const scaleTween = tweened(1, { duration: 250, easing: cubicInOut });
    let cubeScale = $state(1);

    // Mirror the store value into a $state so we can read it in the threlte template (T.Group's
    // scale prop wants a number, not a Writable). Each new value also kicks invalidate() so the
    // on-demand renderer actually draws the frame.
    $effect(() =>
        scaleTween.subscribe((v) => {
            cubeScale = v;
            invalidate();
        }),
    );

    $effect(() => {
        const phase = game.transitionPhase;
        if (phase === "shrinking") scaleTween.set(0);
        else if (phase === "growing") scaleTween.set(1);
        // idle: leave whatever the last animation produced (should be 1).
    });
</script>

<T.PerspectiveCamera makeDefault position={[3, 3, 3]} fov={50} />

<CubeControls
    rotateSpeed={1.0}
    zoomSpeed={1.0}
    dampingFactor={0.08}
    minDistance={1.5}
    maxDistance={8}
/>

<T.AmbientLight intensity={1.2} color="#ffffff" />
<T.DirectionalLight position={[5, 8, 5]} intensity={1.2} color="#ffffff" />
<T.DirectionalLight position={[-5, -3, -5]} intensity={0.5} color="#cbd5ff" />

<T.Group scale={[cubeScale, cubeScale, cubeScale]}>
    {#if game.cubeKind === "voxel"}
        <VoxelGrid
            cube={game.cube as VoxelCube}
            N={game.N}
            status={game.status}
            lastStep={game.lastStep as VoxelPos | null}
            {forceFlag}
            {pressedKeys}
            {onChordPressStart}
            {onChordPressEnd}
            onReveal={(p: VoxelPos) => game.reveal(p)}
            onFlag={(p: VoxelPos) => game.toggleFlag(p)}
            onChord={(p: VoxelPos) => game.chord(p)}
        />
    {:else}
        {@const hollowCube = game.cube as Cube}
        {@const hollowLastStep = game.lastStep as CubePosition | null}
        {#each FACES as face}
            <CubeFace
                {face}
                grid={hollowCube[face]}
                N={game.N}
                status={game.status}
                lastStep={hollowLastStep && hollowLastStep.face === face ? hollowLastStep : null}
                {forceFlag}
                {pressedKeys}
                {onChordPressStart}
                {onChordPressEnd}
                onReveal={(p: CubePosition) => game.reveal(p)}
                onFlag={(p: CubePosition) => game.toggleFlag(p)}
                onChord={(p: CubePosition) => game.chord(p)}
            />
        {/each}
    {/if}
</T.Group>
