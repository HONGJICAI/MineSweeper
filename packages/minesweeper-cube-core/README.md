# @caiji-games/minesweeper-cube-core

[![codecov](https://codecov.io/gh/HONGJICAI/MineSweeper/branch/main/graph/badge.svg?flag=minesweeper-cube-core)](https://codecov.io/gh/HONGJICAI/MineSweeper)

Pure-logic core for the cube-shaped minesweeper variants. No DOM, no Svelte, no Three.js — just
the board model, mine placement, reveal/flood/chord rules, and topology (cube-surface neighbors,
voxel-surface neighbors).

Consumed by the `minesweeper-cube` app package, which layers a Threlte/Three renderer on top.

## Modules

- `cubeLogic` — hollow 6-face cube sweeper: empty-cube construction, seeded mine placement,
  in-place reveal/flood/chord, win check.
- `cubeTopology` — face-edge adjacency for an N×N×6 hollow cube. Neighbors cross face seams.
- `voxelLogic` — solid voxel sweeper: same rules but on the surface cells of an N³ solid cube.
- `voxelTopology` — surface-voxel adjacency (only cells with at least one face exposed).

## Test

```sh
pnpm test:run                 # 58 cases
pnpm exec vitest run --coverage   # local coverage report
```
