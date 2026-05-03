import { Quaternion, Vector3, MathUtils, type PerspectiveCamera } from "three";

// Custom orbit-style controls for the cube minesweeper. Rotation is quaternion-based around the
// camera's local up + right axes, so the cube tumbles freely with no gimbal lock — user can keep
// rotating past the poles in any direction. Per-pixel rotation rate is uniform (matches the feel
// of OrbitControls), unlike TrackballControls' arc projection which slows near screen center.
//
// Kept intentionally narrow: rotate via single pointer, pinch-zoom on touch, wheel-zoom on mouse.
// No pan (cube is centered at origin and we don't want it). Damping is a simple residual-velocity
// continuation after release.

export type CubeControlsOptions = {
    rotateSpeed?: number;
    zoomSpeed?: number;
    minDistance?: number;
    maxDistance?: number;
    dampingFactor?: number; // 0..1, 0 = no decay, 1 = stops instantly
    onChange?: () => void;
};

export class CubeControls {
    rotateSpeed: number;
    zoomSpeed: number;
    minDistance: number;
    maxDistance: number;
    dampingFactor: number;
    enabled = true;

    private camera: PerspectiveCamera;
    private dom: HTMLElement;
    private target = new Vector3(0, 0, 0);
    private onChange: () => void;

    // Tracks all active pointers so we can detect single-finger rotate vs two-finger pinch.
    private pointers = new Map<number, { x: number; y: number }>();
    private rotatePointerId: number | null = null;
    private lastX = 0;
    private lastY = 0;
    private lastPinchDist = 0;

    private dragging = false;
    private vel = { x: 0, y: 0 };

    // Dead-zone: a press doesn't become a drag until the pointer travels this many CSS pixels
    // from where it went down. Without this, every tap registers a sub-pixel jitter that gets
    // amplified by damping into visible rotation drift after release.
    private dragThresholdPx = 6;
    private dragStarted = false;
    private downX = 0;
    private downY = 0;

    private prevTouchAction: string;

    constructor(camera: PerspectiveCamera, dom: HTMLElement, opts: CubeControlsOptions = {}) {
        this.camera = camera;
        this.dom = dom;
        this.rotateSpeed = opts.rotateSpeed ?? 1.0;
        this.zoomSpeed = opts.zoomSpeed ?? 1.0;
        this.minDistance = opts.minDistance ?? 0;
        this.maxDistance = opts.maxDistance ?? Infinity;
        this.dampingFactor = opts.dampingFactor ?? 0.08;
        this.onChange = opts.onChange ?? (() => {});

        // Required on mobile: without `touch-action: none`, the browser interprets single-finger
        // drag as scroll and two-finger as system pinch-zoom, swallowing the pointer events
        // before our handlers see them. (three.js OrbitControls does the same.)
        this.prevTouchAction = this.dom.style.touchAction;
        this.dom.style.touchAction = "none";

        this.dom.addEventListener("pointerdown", this.onPointerDown);
        this.dom.addEventListener("wheel", this.onWheel, { passive: false });

        // Aim the camera at the target on init so the cube is visible from the configured
        // position before the user touches anything. (Otherwise the camera keeps its default
        // -Z forward and the cube sits off-screen until the first rotate.)
        this.camera.lookAt(this.target);
        this.onChange();
    }

    private onPointerDown = (e: PointerEvent) => {
        if (!this.enabled) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.pointers.size === 1) {
            this.rotatePointerId = e.pointerId;
            this.lastX = this.downX = e.clientX;
            this.lastY = this.downY = e.clientY;
            this.dragging = true;
            this.dragStarted = false;
            this.vel.x = 0;
            this.vel.y = 0;
        } else if (this.pointers.size === 2) {
            // Switch to pinch — pause rotation.
            const arr = [...this.pointers.values()];
            this.lastPinchDist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
            this.rotatePointerId = null;
        }

        window.addEventListener("pointermove", this.onPointerMove);
        window.addEventListener("pointerup", this.onPointerUp);
        window.addEventListener("pointercancel", this.onPointerUp);
    };

    private onPointerMove = (e: PointerEvent) => {
        if (!this.enabled || !this.pointers.has(e.pointerId)) return;
        this.pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });

        if (this.pointers.size === 1 && this.rotatePointerId === e.pointerId) {
            if (!this.dragStarted) {
                // Still in dead-zone — see if the cumulative move from the down point crosses it.
                const totalDist = Math.hypot(e.clientX - this.downX, e.clientY - this.downY);
                if (totalDist < this.dragThresholdPx) return;
                this.dragStarted = true;
                // Rebase last position so the first rotate delta is from threshold-crossing,
                // not from pointerdown — otherwise we'd snap-rotate by the threshold size.
                this.lastX = e.clientX;
                this.lastY = e.clientY;
                return;
            }
            const dx = e.clientX - this.lastX;
            const dy = e.clientY - this.lastY;
            this.lastX = e.clientX;
            this.lastY = e.clientY;
            // Calibrate so that dragging across the canvas's shorter side ≈ π radians (180°).
            // Matches the OrbitControls feel: a full sweep flips the view.
            const rect = this.dom.getBoundingClientRect();
            const pixToRad = Math.PI / Math.min(rect.width, rect.height);
            const ax = -dy * pixToRad * this.rotateSpeed;
            const ay = -dx * pixToRad * this.rotateSpeed;
            this.rotate(ax, ay);
            this.vel.x = ax;
            this.vel.y = ay;
        } else if (this.pointers.size === 2) {
            const arr = [...this.pointers.values()];
            const dist = Math.hypot(arr[0].x - arr[1].x, arr[0].y - arr[1].y);
            if (this.lastPinchDist > 0 && dist > 0) this.zoom(this.lastPinchDist / dist);
            this.lastPinchDist = dist;
        }
    };

    private onPointerUp = (e: PointerEvent) => {
        this.pointers.delete(e.pointerId);
        if (this.rotatePointerId === e.pointerId) this.rotatePointerId = null;

        if (this.pointers.size === 1) {
            // Lifted one finger of a pinch — continue rotating with the remaining finger.
            const remaining = [...this.pointers.entries()][0];
            this.rotatePointerId = remaining[0];
            this.lastX = remaining[1].x;
            this.lastY = remaining[1].y;
            this.lastPinchDist = 0;
        }

        if (this.pointers.size === 0) {
            // If the press never crossed the dead-zone, kill any micro-velocity so a tap doesn't
            // animate-drift after release.
            if (!this.dragStarted) {
                this.vel.x = 0;
                this.vel.y = 0;
            }
            this.dragging = false;
            this.dragStarted = false;
            window.removeEventListener("pointermove", this.onPointerMove);
            window.removeEventListener("pointerup", this.onPointerUp);
            window.removeEventListener("pointercancel", this.onPointerUp);
        }
    };

    private onWheel = (e: WheelEvent) => {
        if (!this.enabled) return;
        e.preventDefault();
        const step = 0.1 * this.zoomSpeed;
        const ratio = e.deltaY > 0 ? 1 + step : 1 - step;
        this.zoom(ratio);
    };

    private rotate(ax: number, ay: number) {
        const offset = this.camera.position.clone().sub(this.target);
        const forward = offset.clone().normalize().negate();
        const up = this.camera.up.clone().normalize();
        const right = new Vector3().crossVectors(forward, up).normalize();

        // Compose: rotate around right by ax (vertical drag → pitch) then around up by ay (horizontal → yaw).
        const qX = new Quaternion().setFromAxisAngle(right, ax);
        const qY = new Quaternion().setFromAxisAngle(up, ay);
        const q = new Quaternion().multiplyQuaternions(qY, qX);

        offset.applyQuaternion(q);
        up.applyQuaternion(q);

        this.camera.position.copy(this.target).add(offset);
        this.camera.up.copy(up).normalize();
        this.camera.lookAt(this.target);
        this.onChange();
    }

    private zoom(ratio: number) {
        const offset = this.camera.position.clone().sub(this.target);
        const newLen = MathUtils.clamp(offset.length() * ratio, this.minDistance, this.maxDistance);
        offset.setLength(newLen);
        this.camera.position.copy(this.target).add(offset);
        this.onChange();
    }

    // Called each frame by the Threlte task loop. Continues residual rotation after release for
    // the orbit-style "fling" feel.
    update() {
        if (this.dragging) return;
        const eps = 1e-4;
        if (Math.abs(this.vel.x) < eps && Math.abs(this.vel.y) < eps) return;
        this.rotate(this.vel.x, this.vel.y);
        const decay = 1 - this.dampingFactor;
        this.vel.x *= decay;
        this.vel.y *= decay;
    }

    dispose() {
        this.dom.style.touchAction = this.prevTouchAction;
        this.dom.removeEventListener("pointerdown", this.onPointerDown);
        this.dom.removeEventListener("wheel", this.onWheel);
        window.removeEventListener("pointermove", this.onPointerMove);
        window.removeEventListener("pointerup", this.onPointerUp);
        window.removeEventListener("pointercancel", this.onPointerUp);
    }
}
