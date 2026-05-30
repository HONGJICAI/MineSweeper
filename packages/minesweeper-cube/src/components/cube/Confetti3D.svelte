<script lang="ts">
    import { T, useThrelte } from "@threlte/core";
    import { Color, DoubleSide, InstancedMesh, MeshBasicMaterial, Object3D, PlaneGeometry } from "three";

    // In-scene confetti burst. Replaces canvas-confetti, whose fullscreen 2D <canvas> forced the
    // compositor to allocate a separate fullscreen GPU shared-image (CanvasResourceRasterGmb) —
    // on a fully-revealed board, with the AdMob SDK resident, that allocation could exhaust the
    // GPU pool and drop our WebGL context (the post-win white screen). These flakes render inside
    // the *existing* WebGL context, so nothing new is allocated and there is no failure point.
    //
    // Each flake is a small instanced quad that tumbles (random angular velocity) and flutters
    // (horizontal sine sway) as it falls — the tumble flips it front/back so it reads as paper
    // confetti rather than flat dots. depthTest is off + a high renderOrder so they overlay the
    // cube. Driven by `trigger`: each increment spawns a fresh burst. We run our own rAF loop and
    // invalidate() per frame because the renderer is on-demand (see Cube3D).
    type Props = { trigger: number };
    let { trigger }: Props = $props();

    const { invalidate } = useThrelte();

    const COUNT = 160;
    const GRAVITY = 6.6;        // world units / s²
    const DRAG = 1.4;           // horizontal velocity damping per second

    // Per-flake state (plain arrays — cheap to mutate each frame).
    const px = new Float32Array(COUNT), py = new Float32Array(COUNT), pz = new Float32Array(COUNT);
    const vx = new Float32Array(COUNT), vy = new Float32Array(COUNT), vz = new Float32Array(COUNT);
    const rx = new Float32Array(COUNT), ry = new Float32Array(COUNT), rz = new Float32Array(COUNT);
    const wx = new Float32Array(COUNT), wy = new Float32Array(COUNT), wz = new Float32Array(COUNT); // angular vel
    const sz = new Float32Array(COUNT);     // per-flake scale
    const phase = new Float32Array(COUNT);  // flutter phase offset
    const life = new Float32Array(COUNT);   // remaining seconds; <=0 means parked

    const PALETTE = [
        0xee4444, 0xfbc02d, 0x4cc471, 0x4589f5, 0xab66eb, 0xf5f5fa,
    ].map((h) => new Color(h));

    // Slightly rectangular flake. DoubleSide so the back face shows when it tumbles past edge-on.
    const geometry = new PlaneGeometry(0.09, 0.13);
    const material = new MeshBasicMaterial({ vertexColors: false, transparent: true, side: DoubleSide, depthTest: false });

    const dummy = new Object3D();
    let mesh = $state.raw<InstancedMesh | undefined>(undefined);
    let running = false;
    let lastT = 0;

    // InstancedMesh starts with every instance at the identity matrix (full-size quad at origin),
    // which would show 160 flakes stacked on the cube before any burst. Park them all at scale 0
    // as soon as the mesh ref is available. `life` is already 0 for all, so the step loop also
    // treats them as parked.
    $effect(() => {
        if (!mesh) return;
        for (let i = 0; i < COUNT; i++) {
            dummy.position.set(0, 1e6, 0);
            dummy.rotation.set(0, 0, 0);
            dummy.scale.setScalar(0);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);
        }
        mesh.instanceMatrix.needsUpdate = true;
        invalidate();
    });

    function spawn() {
        if (!mesh) return;
        for (let i = 0; i < COUNT; i++) {
            px[i] = 0; py[i] = 0; pz[i] = 0;

            const theta = Math.random() * Math.PI * 2;
            const phi = Math.acos(2 * Math.random() - 1);
            const speed = 2.5 + Math.random() * 3.5;
            vx[i] = Math.sin(phi) * Math.cos(theta) * speed;
            vy[i] = Math.abs(Math.cos(phi)) * speed + 2.0; // upward bias
            vz[i] = Math.sin(phi) * Math.sin(theta) * speed;

            rx[i] = Math.random() * Math.PI * 2;
            ry[i] = Math.random() * Math.PI * 2;
            rz[i] = Math.random() * Math.PI * 2;
            wx[i] = (Math.random() - 0.5) * 15;
            wy[i] = (Math.random() - 0.5) * 15;
            wz[i] = (Math.random() - 0.5) * 15;

            sz[i] = 0.7 + Math.random() * 0.8;
            phase[i] = Math.random() * Math.PI * 2;
            life[i] = 1.0 + Math.random() * 0.6;

            mesh.setColorAt(i, PALETTE[(Math.random() * PALETTE.length) | 0]);
        }
        if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;
        material.opacity = 1;

        if (!running) {
            running = true;
            lastT = performance.now();
            requestAnimationFrame(step);
        }
        invalidate();
    }

    function step(now: number) {
        if (!mesh) { running = false; return; }
        const dt = Math.min((now - lastT) / 1000, 0.05); // clamp to survive frame hitches
        lastT = now;
        const drag = Math.max(0, 1 - DRAG * dt);

        let alive = 0;
        let maxLife = 0;
        for (let i = 0; i < COUNT; i++) {
            if (life[i] <= 0) {
                dummy.position.set(0, 1e6, 0);
                dummy.scale.setScalar(0);
                dummy.rotation.set(0, 0, 0);
                dummy.updateMatrix();
                mesh.setMatrixAt(i, dummy.matrix);
                continue;
            }
            life[i] -= dt;

            vy[i] -= GRAVITY * dt;
            vx[i] = vx[i] * drag + Math.sin(now * 0.004 + phase[i]) * 1.6 * dt; // flutter
            vz[i] = vz[i] * drag + Math.cos(now * 0.004 + phase[i]) * 1.6 * dt;
            px[i] += vx[i] * dt;
            py[i] += vy[i] * dt;
            pz[i] += vz[i] * dt;

            rx[i] += wx[i] * dt;
            ry[i] += wy[i] * dt;
            rz[i] += wz[i] * dt;

            dummy.position.set(px[i], py[i], pz[i]);
            dummy.rotation.set(rx[i], ry[i], rz[i]);
            dummy.scale.setScalar(sz[i]);
            dummy.updateMatrix();
            mesh.setMatrixAt(i, dummy.matrix);

            if (life[i] > 0) {
                alive++;
                if (life[i] > maxLife) maxLife = life[i];
            }
        }
        mesh.instanceMatrix.needsUpdate = true;
        // Fade the whole burst out over its final ~0.5s for a soft finish.
        material.opacity = Math.min(1, maxLife / 0.5);
        invalidate();

        if (alive > 0) requestAnimationFrame(step);
        else running = false;
    }

    // Fire a burst whenever `trigger` increments. prevTrigger starts null so the first effect run
    // just records the mount value without spawning; only later changes trigger a burst.
    let prevTrigger: number | null = null;
    $effect(() => {
        const t = trigger;
        if (prevTrigger === null) {
            prevTrigger = t;
            return;
        }
        if (t !== prevTrigger) {
            prevTrigger = t;
            spawn();
        }
    });

    // Free GPU/JS resources when the component unmounts.
    $effect(() => () => {
        geometry.dispose();
        material.dispose();
    });
</script>

<T.InstancedMesh
    args={[geometry, material, COUNT]}
    bind:ref={mesh}
    renderOrder={999}
    frustumCulled={false}
/>
