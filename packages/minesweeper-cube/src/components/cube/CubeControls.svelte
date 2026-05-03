<script lang="ts">
    import { useTask, useThrelte } from "@threlte/core";
    import { onDestroy, untrack } from "svelte";
    import type { PerspectiveCamera } from "three";
    import { CubeControls } from "./cubeControls.ts";

    type Props = {
        rotateSpeed?: number;
        zoomSpeed?: number;
        minDistance?: number;
        maxDistance?: number;
        dampingFactor?: number;
    };

    let props: Props = $props();

    const { dom, camera, invalidate } = useThrelte();

    // Construct with just the wiring deps; all knobs flow through $effect below so the initial
    // read of props sits inside a reactive context (avoids state_referenced_locally warnings).
    const controls = new CubeControls(
        untrack(() => camera.current as PerspectiveCamera),
        dom,
        { onChange: invalidate },
    );

    $effect(() => { controls.rotateSpeed = props.rotateSpeed ?? 1.0; });
    $effect(() => { controls.zoomSpeed = props.zoomSpeed ?? 1.0; });
    $effect(() => { controls.minDistance = props.minDistance ?? 0; });
    $effect(() => { controls.maxDistance = props.maxDistance ?? Infinity; });
    $effect(() => { controls.dampingFactor = props.dampingFactor ?? 0.08; });

    useTask(() => controls.update(), { autoInvalidate: false });

    onDestroy(() => controls.dispose());
</script>
