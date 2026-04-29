# Math Utilities

> **TL;DR**
> - `Vector` is defined in `libs/pixi-ecs/utils/vector.ts` (not `aph-math`) and is **immutable** — every operation returns a new instance
> - `aph-math` exports: `Steering`, `Interpolation`, `Random`, `PerlinNoise`, `QuadTree`, `PathFinder` family
> - All `Steering` functions take `Vector` parameters and return a `Vector` force
> - `Interpolation` functions return a normalized `[0,1]` progress value
> - `PathFinder` operates on a `GridMap` of tile/octile type

---

## Imports

```typescript
// Vector comes from pixi-ecs
import { Vector } from '../../libs/pixi-ecs';

// Everything else from aph-math
import {
    Random, PerlinNoise, QuadTree,
    Steering, Interpolation,
    PathFinder, BreadthFirstSearch, Dijkstra, AStarSearch,
    PathFinderContext, GridMap, Path, PathContext, PathSegment,
    MAP_TYPE_TILE, MAP_TYPE_OCTILE,
} from '../../libs/aph-math';
```

---

## `Vector`

An immutable 2D vector. All operations return a **new** `Vector` instance — the original is never modified.

```typescript
const v1 = new Vector(3, 4);
const v2 = new Vector(1, 2);
const v3 = new Vector([5, 6]); // array constructor
const v4 = new Vector(7);      // x = y = 7
```

### Properties

| Property | Description |
|----------|-------------|
| `v.x` | X component |
| `v.y` | Y component |

### Arithmetic

| Method | Returns | Description |
|--------|---------|-------------|
| `v.add(other)` | `Vector` | Component-wise addition |
| `v.subtract(other)` | `Vector` | Component-wise subtraction |
| `v.multiply(scalar)` | `Vector` | Scalar multiplication |
| `v.divide(scalar)` | `Vector` | Scalar division |

### Geometry

| Method | Returns | Description |
|--------|---------|-------------|
| `v.magnitude()` | `number` | Euclidean length (`sqrt(x²+y²)`) |
| `v.magnitudeSquared()` | `number` | Squared length — faster, no `sqrt` |
| `v.normalize()` | `Vector` | Unit vector in same direction |
| `v.limit(max)` | `Vector` | Clamps magnitude to `max` |
| `v.angle()` | `number` | Angle in radians (`atan2(y, x)`, range `[0, 2π]`) |
| `v.dot(other)` | `number` | Dot product |
| `v.distance(other)` | `number` | Euclidean distance to `other` |
| `v.squareDistance(other)` | `number` | Squared Euclidean distance |
| `v.manhattanDistance(other)` | `number` | Manhattan (`|dx| + |dy|`) distance |

### Utility

| Method | Returns | Description |
|--------|---------|-------------|
| `v.clone()` | `Vector` | Exact copy |
| `v.equals(other)` | `boolean` | Strict equality check |

---

## `Steering`

Steering behaviors return a **force vector** to add to velocity. All functions are pure — they don't modify any state.

```typescript
import * as Steering from '../../libs/aph-math/steering';
// Or via the index:
import { Steering } from '../../libs/aph-math';
```

### `seek(target, position, velocity, maxVelocity, slowingRadius?)`

Move toward a target. With `slowingRadius`, decelerates as it approaches (arrive behavior):

```typescript
const force = Steering.seek(targetPos, myPos, myVelocity, maxSpeed, 80);
myVelocity = myVelocity.add(force.limit(maxForce));
myPos = myPos.add(myVelocity);
```

### `flee(target, position, velocity, maxVelocity)`

Move away from a target:

```typescript
const force = Steering.flee(threatPos, myPos, myVelocity, maxSpeed);
```

### `pursuit(target, position, maxVelocity, velocity, targetVelocity)`

Chase a moving target by predicting its future position:

```typescript
const force = Steering.pursuit(enemyPos, myPos, maxSpeed, myVelocity, enemyVelocity);
```

### `evade(target, position, maxVelocity, velocity, targetVelocity)`

Flee a moving threat, predicting where it will be:

```typescript
const force = Steering.evade(threatPos, myPos, maxSpeed, myVelocity, threatVelocity);
```

### `wander(velocity, wanderTarget, wanderRadius, wanderDistance, wanderJitter, deltaTime)`

Random wandering. Returns `[steeringForce, updatedWanderTarget]`:

```typescript
let [force, newWanderTarget] = Steering.wander(
    velocity, wanderTarget, 30, 80, 5, delta
);
this.wanderTarget = newWanderTarget; // persist for next frame
```

### `follow(position, velocity, path, context, pointTolerance, finalTolerance, maxVelocity, slowingRadius)`

Follow a `Path` segment by segment. Returns `null` when the destination is reached:

```typescript
const force = Steering.follow(myPos, myVelocity, path, pathCtx, 20, 5, maxSpeed, 50);
if (force === null) {
    // Reached the end of the path
}
```

---

## `Interpolation`

Easing functions. All have the signature `(current, start, length) => number` and return a normalized value `[0, 1]`.

```typescript
import * as Interpolation from '../../libs/aph-math/interpolation';
```

| Function | Curve |
|----------|-------|
| `linear(t, start, length)` | Straight linear |
| `easeinout(t, start, length)` | Smooth S-curve (cubic) |
| `quadraticEaseIn(t, start, length)` | Accelerate from zero |
| `quadraticEaseOut(t, start, length)` | Decelerate to zero |
| `quadraticEaseInOut(t, start, length)` | Accelerate then decelerate |
| `sineIn(t, start, length)` | Sine curve ease in |
| `sineOut(t, start, length)` | Sine curve ease out |
| `expoIn(t, start, length)` | Exponential ease in |

```typescript
// Example: fade in an object over 500ms starting at absolute time 1000
onUpdate(delta: number, absolute: number) {
    const fadeStart = 1000;
    const fadeDuration = 500;
    const progress = Interpolation.easeinout(absolute, fadeStart, fadeDuration);
    this.owner.alpha = progress; // 0 → 1 with smooth curve
}
```

---

## `Random`

Seeded random number generator:

```typescript
const rng = new Random(42); // seed = 42

rng.float()                   // [0, 1)
rng.double()                  // [0, 1)
rng.uniform(min?, max?)       // uniform float in range, default [0, 1)
rng.uniformInt(min, max)      // uniform integer in [min, max]
rng.normal(min, max, scale?)  // normal distribution in range
rng.normalRadial(...)         // radial variant
```

---

## `PerlinNoise`

Perlin noise generator for procedural terrain, animations, and textures:

```typescript
const noise = new PerlinNoise(12345); // optional seed

const value = noise.interpolatedNoise(x, y, frequency, amplitude, octaves, persistence);
```

---

## `QuadTree`

Spatial indexing for efficient range queries (e.g. finding nearby objects):

```typescript
const tree = new QuadTree(new PIXI.Rectangle(0, 0, 800, 600), 4, 5);

// Insert items
for (const enemy of enemies) {
    const item = new QuadTreeItem();
    item.x = enemy.position.x;
    item.y = enemy.position.y;
    tree.insert(item);
}

// Range query
const nearby = tree.retrieve(new PIXI.Rectangle(playerX - 100, playerY - 100, 200, 200));

// Clear and rebuild each frame (for moving objects)
tree.clear();
```

---

## `GridMap` and `PathFinder`

Grid-based pathfinding. Supports tile (4-directional) and octile (8-directional) movement.

### Setting up a GridMap

```typescript
const grid = new GridMap(MAP_TYPE_OCTILE, 10, mapWidth, mapHeight);

// Mark walls as obstructions
for (const wall of levelData.walls) {
    grid.obstructions.add(grid.indexMapper(new Vector(wall.col, wall.row)));
}

// Optionally set elevation costs (higher = more expensive to traverse)
grid.elevations.set(grid.indexMapper(mudTile), 3);
```

### Running a Search

```typescript
const ctx = new PathFinderContext();
const finder = new AStarSearch();
// or: new BreadthFirstSearch() / new Dijkstra()

const start = new Vector(playerCol, playerRow);
const goal = new Vector(targetCol, targetRow);

const found = finder.search(grid, start, goal, ctx);
if (found) {
    const path: Vector[] = ctx.pathFound; // array of Vector grid positions
}
```

### Following the Path

Use `Steering.follow` with `Path` and `PathContext`:

```typescript
// Build a Path from grid positions
const path = new Path();
for (let i = 0; i < ctx.pathFound.length - 1; i++) {
    const start = new Vector(ctx.pathFound[i].x * TILE_SIZE, ctx.pathFound[i].y * TILE_SIZE);
    const end = new Vector(ctx.pathFound[i+1].x * TILE_SIZE, ctx.pathFound[i+1].y * TILE_SIZE);
    path.addSegment(new PathSegment(start, end));
}

const pathCtx = new PathContext();

// In onUpdate:
const force = Steering.follow(myPos, myVelocity, path, pathCtx, 10, 5, maxSpeed, 40);
if (force !== null) {
    myVelocity = myVelocity.add(force.limit(maxForce));
}
```

### Map Types

| Constant | Value | Movement |
|----------|-------|----------|
| `MAP_TYPE_TILE` | `1` | 4-directional (up/down/left/right) |
| `MAP_TYPE_OCTILE` | `2` | 8-directional (including diagonals) |
