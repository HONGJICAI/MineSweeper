<script lang="ts">
    // Wraps three.js TrackballControls so the cube can tumble freely in all axes (no
    // up-vector / polar-angle constraint that OrbitControls imposes). Pattern mirrors
    // @threlte/extras' OrbitControls.svelte: instantiate once, sync props via <T is={...}>,
    // tick via useTask, invalidate on change for on-demand rendering.

    import { T, useTask, useThrelte } from "@threlte/core";
    import { TrackballControls } from "three/examples/jsm/controls/TrackballControls.js";
    import { onDestroy, untrack } from "svelte";

    type Props = {
        rotateSpeed?: number;
        zoomSpeed?: number;
        panSpeed?: number;
        noPan?: boolean;
        noZoom?: boolean;
        noRotate?: boolean;
        staticMoving?: boolean;
        dynamicDampingFactor?: number;
        minDistance?: number;
        maxDistance?: number;
    };

    let props: Props = $props();

    const { dom, canvas, camera, invalidate } = useThrelte();

    const controls = new TrackballControls(untrack(() => camera.current), dom);

    // TrackballControls caches the canvas bounding rect for math; refresh on resize.
    function handleResize() {
        controls.handleResize();
    }
    handleResize();

    $effect(() => {
        const ro = new ResizeObserver(handleResize);
        ro.observe(canvas);
        window.addEventListener("resize", handleResize);
        return () => {
            ro.disconnect();
            window.removeEventListener("resize", handleResize);
        };
    });

    // Each frame: if controls are still animating (damping/inertia), update + force a redraw.
    // autoInvalidate:false to avoid invalidating every frame unconditionally.
    useTask(
        () => {
            controls.update();
        },
        { autoInvalidate: false },
    );

    $effect(() => {
        const onChange = () => invalidate();
        controls.addEventListener("change", onChange);
        return () => controls.removeEventListener("change", onChange);
    });

    onDestroy(() => controls.dispose());
</script>

<T is={controls} {...props} />
