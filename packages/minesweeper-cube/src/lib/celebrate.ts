import confetti from "canvas-confetti";

// Multi-burst pattern lifted from canvas-confetti's "realistic" example. Five overlapping bursts
// with different spread / velocity / decay tuned to look like a real confetti shower rather than
// one uniform blob.
export function celebrate() {
    const defaults: confetti.Options = { origin: { y: 0.7 } };
    const fire = (particleRatio: number, opts: confetti.Options) => {
        confetti({
            ...defaults,
            ...opts,
            particleCount: Math.floor(200 * particleRatio),
        });
    };

    fire(0.25, { spread: 26, startVelocity: 55 });
    fire(0.2,  { spread: 60 });
    fire(0.35, { spread: 100, decay: 0.91, scalar: 0.8 });
    fire(0.1,  { spread: 120, startVelocity: 25, decay: 0.92, scalar: 1.2 });
    fire(0.1,  { spread: 120, startVelocity: 45 });
}
