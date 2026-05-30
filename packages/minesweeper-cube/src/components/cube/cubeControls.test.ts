// Pointer-driven tests for the orbit camera controls. three.js's math classes (Vector3,
// Quaternion, PerspectiveCamera) are pure JS — they run fine under happy-dom — so we
// construct a real camera, attach the controls to a happy-dom <div>, and drive the public
// surface (pointer events + wheel + update + dispose). No WebGL involved.

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { PerspectiveCamera } from "three";
import { CubeControls } from "./cubeControls.ts";

const DRAG_THRESHOLD_PX = 6;

// happy-dom doesn't run layout, so element.getBoundingClientRect() returns zeros. The pix-to-rad
// calibration in rotate() divides by min(width, height) — zero would NaN the camera. Stub a
// realistic viewport rect so the math comes out finite.
function setupDom(viewport = { width: 800, height: 600 }) {
    const dom = document.createElement("div");
    document.body.appendChild(dom);
    dom.getBoundingClientRect = () => ({
        x: 0, y: 0,
        left: 0, top: 0,
        right: viewport.width, bottom: viewport.height,
        width: viewport.width, height: viewport.height,
        toJSON: () => ({}),
    });
    return dom;
}

function makeCamera() {
    const cam = new PerspectiveCamera(50, 800 / 600, 0.1, 1000);
    // Place the camera straight back along +Z so the math has a stable reference.
    cam.position.set(0, 0, 10);
    cam.up.set(0, 1, 0);
    cam.lookAt(0, 0, 0);
    return cam;
}

function pointerDown(dom: HTMLElement, opts: { pointerId?: number; clientX: number; clientY: number }) {
    dom.dispatchEvent(new PointerEvent("pointerdown", {
        pointerId: opts.pointerId ?? 1,
        clientX: opts.clientX,
        clientY: opts.clientY,
        bubbles: true,
    }));
}
function pointerMove(opts: { pointerId?: number; clientX: number; clientY: number }) {
    window.dispatchEvent(new PointerEvent("pointermove", {
        pointerId: opts.pointerId ?? 1,
        clientX: opts.clientX,
        clientY: opts.clientY,
        bubbles: true,
    }));
}
function pointerUp(opts: { pointerId?: number; clientX: number; clientY: number }) {
    window.dispatchEvent(new PointerEvent("pointerup", {
        pointerId: opts.pointerId ?? 1,
        clientX: opts.clientX,
        clientY: opts.clientY,
        bubbles: true,
    }));
}
function wheel(dom: HTMLElement, deltaY: number) {
    dom.dispatchEvent(new WheelEvent("wheel", { deltaY, bubbles: true, cancelable: true }));
}

describe("CubeControls — construction", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
    });
    afterEach(() => {
        controls?.dispose();
        dom.remove();
    });

    test("sets touch-action: none on the dom element", () => {
        controls = new CubeControls(cam, dom);
        expect(dom.style.touchAction).toBe("none");
    });

    test("invokes onChange once at construction (camera aimed at target)", () => {
        let calls = 0;
        controls = new CubeControls(cam, dom, { onChange: () => calls++ });
        expect(calls).toBeGreaterThanOrEqual(1);
    });

    test("applies option defaults", () => {
        controls = new CubeControls(cam, dom);
        expect(controls.rotateSpeed).toBe(1);
        expect(controls.zoomSpeed).toBe(1);
        expect(controls.minDistance).toBe(0);
        expect(controls.maxDistance).toBe(Infinity);
        expect(controls.dampingFactor).toBeCloseTo(0.08);
        expect(controls.enabled).toBe(true);
    });

    test("respects custom options", () => {
        controls = new CubeControls(cam, dom, {
            rotateSpeed: 2,
            zoomSpeed: 0.5,
            minDistance: 3,
            maxDistance: 20,
            dampingFactor: 0.2,
        });
        expect(controls.rotateSpeed).toBe(2);
        expect(controls.minDistance).toBe(3);
        expect(controls.maxDistance).toBe(20);
        expect(controls.dampingFactor).toBeCloseTo(0.2);
    });
});

describe("CubeControls — rotate dead-zone", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;
    let posSnapshot: { x: number; y: number; z: number };

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
        controls = new CubeControls(cam, dom);
        posSnapshot = { x: cam.position.x, y: cam.position.y, z: cam.position.z };
    });
    afterEach(() => {
        controls.dispose();
        dom.remove();
    });

    test("sub-threshold drag does NOT move the camera", () => {
        pointerDown(dom, { clientX: 100, clientY: 100 });
        pointerMove({ clientX: 100 + (DRAG_THRESHOLD_PX - 1), clientY: 100 });
        expect(cam.position.x).toBeCloseTo(posSnapshot.x);
        expect(cam.position.y).toBeCloseTo(posSnapshot.y);
        expect(cam.position.z).toBeCloseTo(posSnapshot.z);
        pointerUp({ clientX: 100 + (DRAG_THRESHOLD_PX - 1), clientY: 100 });
    });

    test("crossing the threshold starts rotation, but the first delta is not the threshold size", () => {
        // Crossing the threshold by exactly 0 pixels: the *first* qualifying move arms drag.
        // The next move's delta is what actually rotates — verifying we don't get a snap-rotate
        // by the threshold value.
        pointerDown(dom, { clientX: 100, clientY: 100 });
        pointerMove({ clientX: 100 + DRAG_THRESHOLD_PX + 1, clientY: 100 });
        const after1 = cam.position.clone();
        pointerMove({ clientX: 100 + DRAG_THRESHOLD_PX + 2, clientY: 100 });
        // Tiny additional move → tiny additional change, not a big jump.
        expect(cam.position.distanceTo(after1)).toBeLessThan(0.1);
        pointerUp({ clientX: 100 + DRAG_THRESHOLD_PX + 2, clientY: 100 });
    });

    test("a tap (no drag) leaves no residual velocity for update() to apply", () => {
        pointerDown(dom, { clientX: 100, clientY: 100 });
        // Single small move that won't cross the dead zone.
        pointerMove({ clientX: 102, clientY: 100 });
        pointerUp({ clientX: 102, clientY: 100 });

        const before = cam.position.clone();
        // Spin the task loop a bunch — if there were residual velocity it would accumulate.
        for (let i = 0; i < 30; i++) controls.update();
        expect(cam.position.distanceTo(before)).toBeLessThan(1e-6);
    });
});

describe("CubeControls — rotate produces motion", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
        controls = new CubeControls(cam, dom);
    });
    afterEach(() => {
        controls.dispose();
        dom.remove();
    });

    test("a horizontal drag well past threshold rotates the camera", () => {
        const before = cam.position.clone();
        pointerDown(dom, { clientX: 400, clientY: 300 });
        // First move crosses dead-zone (rebases position); second move applies real delta.
        pointerMove({ clientX: 500, clientY: 300 });
        pointerMove({ clientX: 600, clientY: 300 });
        expect(cam.position.distanceTo(before)).toBeGreaterThan(0.1);
        // Distance to origin is preserved by orbit rotation.
        expect(cam.position.length()).toBeCloseTo(before.length(), 4);
        pointerUp({ clientX: 600, clientY: 300 });
    });

    test("rotation preserves orbit radius across many moves (no drift)", () => {
        const radius = cam.position.length();
        pointerDown(dom, { clientX: 400, clientY: 300 });
        // First crosses dead-zone.
        pointerMove({ clientX: 411, clientY: 300 });
        for (let i = 1; i < 20; i++) {
            pointerMove({ clientX: 411 + i * 20, clientY: 300 + i * 5 });
        }
        pointerUp({ clientX: 411 + 19 * 20, clientY: 300 + 19 * 5 });
        // Allow a hair of FP drift; certainly not >1%.
        expect(cam.position.length()).toBeCloseTo(radius, 3);
    });

    test("damping decays residual velocity after release", () => {
        pointerDown(dom, { clientX: 400, clientY: 300 });
        pointerMove({ clientX: 411, clientY: 300 });    // crosses dead-zone
        pointerMove({ clientX: 511, clientY: 300 });    // big delta → high velocity
        pointerUp({ clientX: 511, clientY: 300 });

        // Capture the first post-release update, then keep ticking until updates stop changing.
        controls.update();
        const afterFirstTick = cam.position.clone();
        let prev = afterFirstTick.clone();
        let lastDelta = Infinity;
        for (let i = 0; i < 500; i++) {
            controls.update();
            lastDelta = cam.position.distanceTo(prev);
            prev = cam.position.clone();
            if (lastDelta < 1e-5) break;
        }
        // Should have converged to (near) zero motion within the iteration budget.
        expect(lastDelta).toBeLessThan(1e-4);
        // And total movement post-release should be small but non-zero (fling settled).
        const totalFling = afterFirstTick.distanceTo(prev);
        expect(totalFling).toBeGreaterThan(0);
    });
});

describe("CubeControls — zoom (wheel)", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
    });
    afterEach(() => {
        controls.dispose();
        dom.remove();
    });

    test("positive deltaY zooms out (radius grows); negative zooms in", () => {
        controls = new CubeControls(cam, dom);
        const start = cam.position.length();
        wheel(dom, 100);
        const afterOut = cam.position.length();
        expect(afterOut).toBeGreaterThan(start);

        wheel(dom, -100);
        const afterIn = cam.position.length();
        expect(afterIn).toBeLessThan(afterOut);
    });

    test("wheel zoom clamps at minDistance", () => {
        controls = new CubeControls(cam, dom, { minDistance: 5 });
        // Spam zoom-in well past minDistance.
        for (let i = 0; i < 100; i++) wheel(dom, -100);
        expect(cam.position.length()).toBeGreaterThanOrEqual(5 - 1e-6);
    });

    test("wheel zoom clamps at maxDistance", () => {
        controls = new CubeControls(cam, dom, { maxDistance: 15 });
        for (let i = 0; i < 100; i++) wheel(dom, 100);
        expect(cam.position.length()).toBeLessThanOrEqual(15 + 1e-6);
    });

    test("wheel event is preventDefault'd (so the browser doesn't scroll the page)", () => {
        controls = new CubeControls(cam, dom);
        const e = new WheelEvent("wheel", { deltaY: 100, bubbles: true, cancelable: true });
        dom.dispatchEvent(e);
        expect(e.defaultPrevented).toBe(true);
    });

    test("disabled controls ignore wheel", () => {
        controls = new CubeControls(cam, dom);
        controls.enabled = false;
        const before = cam.position.length();
        wheel(dom, 100);
        expect(cam.position.length()).toBeCloseTo(before, 6);
    });
});

describe("CubeControls — pinch zoom (two pointers)", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
        controls = new CubeControls(cam, dom);
    });
    afterEach(() => {
        controls.dispose();
        dom.remove();
    });

    test("widening pinch zooms in (radius shrinks)", () => {
        const before = cam.position.length();
        pointerDown(dom, { pointerId: 1, clientX: 300, clientY: 300 });
        pointerDown(dom, { pointerId: 2, clientX: 500, clientY: 300 }); // initial dist 200
        // Spread fingers further apart → pinch-zoom in.
        pointerMove({ pointerId: 1, clientX: 200, clientY: 300 });
        pointerMove({ pointerId: 2, clientX: 600, clientY: 300 }); // dist 400
        expect(cam.position.length()).toBeLessThan(before);
        pointerUp({ pointerId: 1, clientX: 200, clientY: 300 });
        pointerUp({ pointerId: 2, clientX: 600, clientY: 300 });
    });

    test("releasing one finger of a pinch resumes rotation with the other", () => {
        pointerDown(dom, { pointerId: 1, clientX: 300, clientY: 300 });
        pointerDown(dom, { pointerId: 2, clientX: 500, clientY: 300 });
        // Lift pointer 2 — pointer 1 should become the rotation pointer with no snap-rotate.
        pointerUp({ pointerId: 2, clientX: 500, clientY: 300 });
        const before = cam.position.clone();
        // A tiny move with pointer 1: still in dead-zone after rebase, so no rotation.
        pointerMove({ pointerId: 1, clientX: 302, clientY: 300 });
        expect(cam.position.distanceTo(before)).toBeLessThan(1e-6);
        // A larger move crosses dead-zone and rotates.
        pointerMove({ pointerId: 1, clientX: 320, clientY: 300 });
        pointerMove({ pointerId: 1, clientX: 380, clientY: 300 });
        expect(cam.position.distanceTo(before)).toBeGreaterThan(0.01);
        pointerUp({ pointerId: 1, clientX: 380, clientY: 300 });
    });
});

describe("CubeControls — enabled flag and dispose", () => {
    let dom: HTMLElement;
    let cam: PerspectiveCamera;
    let controls: CubeControls;

    beforeEach(() => {
        dom = setupDom();
        cam = makeCamera();
    });
    afterEach(() => {
        dom.remove();
    });

    test("enabled=false ignores pointerdown (no rotation)", () => {
        controls = new CubeControls(cam, dom);
        controls.enabled = false;
        const before = cam.position.clone();
        pointerDown(dom, { clientX: 100, clientY: 100 });
        pointerMove({ clientX: 200, clientY: 100 });
        pointerMove({ clientX: 300, clientY: 100 });
        pointerUp({ clientX: 300, clientY: 100 });
        expect(cam.position.distanceTo(before)).toBeLessThan(1e-6);
        controls.dispose();
    });

    test("dispose restores touch-action and detaches handlers", () => {
        dom.style.touchAction = "manipulation";
        controls = new CubeControls(cam, dom);
        expect(dom.style.touchAction).toBe("none");
        controls.dispose();
        expect(dom.style.touchAction).toBe("manipulation");

        // After dispose, events should be inert.
        const before = cam.position.clone();
        pointerDown(dom, { clientX: 100, clientY: 100 });
        pointerMove({ clientX: 200, clientY: 100 });
        pointerMove({ clientX: 300, clientY: 100 });
        wheel(dom, 100);
        expect(cam.position.distanceTo(before)).toBeLessThan(1e-6);
    });
});
