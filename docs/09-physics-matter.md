# Physics with Matter.js

> **TL;DR**
> - `MatterBind` bridges Matter.js physics into the ECS update loop with one `init()` call
> - `addBody()` adds a physics body and automatically creates a synced `MatterBody` display object
> - `MatterBody` extends `ECS.Graphics` — attach ECS components to it like any other game object
> - Physics drives position/rotation; the display object follows
> - Collision detection is handled via Matter.js `Events.on(engine, 'collisionStart', ...)`

---

## Overview

The `pixi-matter` library (at `libs/pixi-matter/`) provides a thin bridge between Matter.js physics and the ECS scene. The key insight is:

- **Matter.js** owns the physics simulation (bodies, forces, constraints, collision detection)
- **PIXI-ECS** owns the rendering (display objects)
- **`MatterBody`** and **`MatterConstraint`** are ECS display objects that automatically synchronize their PIXI position/rotation from their Matter.js body each frame

---

## Quick Setup

```typescript
import * as Matter from 'matter-js';
import * as ECS from '../../libs/pixi-ecs';
import * as PixiMatter from '../../libs/pixi-matter';

// 1. Create the binder and wire it to the ECS scene
const binder = new PixiMatter.MatterBind();
binder.init(scene, {
    mouseControl: true,         // adds a mouse drag constraint
    renderConstraints: true,    // render constraints as lines
    renderAngles: true,         // render angle indicator on bodies
});

// 2. Add physics bodies — a synced display object is created automatically
const ground = binder.addBody(
    Matter.Bodies.rectangle(400, 580, 800, 40, { isStatic: true })
);

const box = binder.addBody(
    Matter.Bodies.rectangle(400, 100, 80, 80)
);

// 3. Attach ECS components to the display objects as usual
box.addComponent(new MyBoxController());
```

---

## `MatterBind`

The main integration class. Located at `libs/pixi-matter/matter-bind.ts`.

### Properties

| Property | Type | Description |
|----------|------|-------------|
| `mEngine` | `Matter.Engine` | The Matter.js engine instance |
| `mWorld` | `Matter.World` | The Matter.js world |
| `runner` | `Matter.Runner` | The Matter.js runner |
| `scene` | `ECS.Scene` | The ECS scene reference |

### `init(scene, config?)`

Wires Matter.js into the ECS update loop. Internally:

1. Creates `Matter.Engine`, `Matter.World`, and `Matter.Runner`
2. Adds a global `FuncComponent` that calls `Matter.Runner.tick(runner, engine, delta)` each frame — physics advances in sync with the game loop
3. Listens to `Matter.Events.on(world, 'afterAdd', ...)` — whenever a body or constraint is added to the world, a matching ECS display object is created on `scene.stage`
4. Optionally adds a mouse constraint

```typescript
binder.init(scene, {
    mouseControl: false,     // disable drag-with-mouse
    renderConstraints: false, // don't render constraint lines
    renderAngles: false,      // don't show angle indicators
});
```

### `addBody(body): MatterBody`

Adds a Matter.js body to the world and returns the synced `MatterBody` ECS object:

```typescript
const sphere = binder.addBody(
    Matter.Bodies.circle(200, 100, 30, {
        restitution: 0.8, // bouncy
        friction: 0.1,
    })
);
// sphere is an ECS.Graphics (MatterBody) with a FuncComponent syncing position
sphere.addComponent(new BallController());
```

### `addConstraint(constraint): MatterConstraint`

Adds a Matter.js constraint and returns its synced display object:

```typescript
const spring = binder.addConstraint(
    Matter.Constraint.create({
        bodyA: bodyA.body,
        bodyB: bodyB.body,
        stiffness: 0.1,
        length: 100,
    })
);
```

### `findSyncObjectForBody(body)` / `findSyncObjectForConstraint(constraint)`

Look up the ECS display object for a given Matter.js object by name:

```typescript
const displayObj = binder.findSyncObjectForBody(matterBody);
// Equivalent to: scene.findObjectByName('matter_body_' + body.id)
```

---

## `MatterBody`

Extends `ECS.Graphics`. Renders the physics body's polygon(s) and automatically syncs position and rotation from Matter.js each frame via an internal `FuncComponent('MatterSync')`.

```typescript
// Automatic sync (built-in):
new ECS.FuncComponent('MatterSync').doOnUpdate((cmp, delta, absolute) => {
    if (!this.body.isStatic) {
        this.rotation = this.body.angle;
    }
    this.position.x = this.body.position.x;
    this.position.y = this.body.position.y;
});
```

**You do not need to manually sync position** — it happens every frame automatically.

### Accessing the Underlying Body

Cast the owner to `MatterBody` to access `body`:

```typescript
class MyPhysicsController extends ECS.Component {
    onUpdate(delta: number, absolute: number) {
        const matterBody = this.owner as PixiMatter.MatterBody;
        
        // Apply forces via Matter.js API
        Matter.Body.applyForce(matterBody.body, matterBody.body.position, { x: 0.01, y: 0 });
        
        // Set velocity
        Matter.Body.setVelocity(matterBody.body, { x: 5, y: 0 });
        
        // Teleport
        Matter.Body.setPosition(matterBody.body, { x: 100, y: 200 });
    }
}
```

---

## Collision Detection

Matter.js handles collision detection. Subscribe to Matter.js events on the engine:

```typescript
Matter.Events.on(binder.mEngine, 'collisionStart', (event: Matter.IEventCollision<Matter.Engine>) => {
    for (const pair of event.pairs) {
        const bodyA = pair.bodyA;
        const bodyB = pair.bodyB;
        
        // Find the corresponding ECS objects
        const objA = binder.findSyncObjectForBody(bodyA);
        const objB = binder.findSyncObjectForBody(bodyB);

        if (objA && objA.hasTag('player') && objB && objB.hasTag('enemy')) {
            scene.sendMessage(new ECS.Message(Messages.PLAYER_HIT, null, objA));
        }
    }
});
```

Available Matter.js collision events: `collisionStart`, `collisionActive`, `collisionEnd`.

---

## Complete Example: Falling Boxes with Keyboard

```typescript
import * as Matter from 'matter-js';
import * as ECS from '../../libs/pixi-ecs';
import * as PixiMatter from '../../libs/pixi-matter';

export function setupPhysicsScene(scene: ECS.Scene) {
    // Setup
    const binder = new PixiMatter.MatterBind();
    binder.init(scene, { mouseControl: true });

    const width = scene.width;
    const height = scene.height;

    // Static ground and walls
    binder.addBody(Matter.Bodies.rectangle(width / 2, height, width, 40, { isStatic: true }));
    binder.addBody(Matter.Bodies.rectangle(0, height / 2, 40, height, { isStatic: true }));
    binder.addBody(Matter.Bodies.rectangle(width, height / 2, 40, height, { isStatic: true }));

    // Controllable box
    const playerBody = binder.addBody(
        Matter.Bodies.rectangle(width / 2, height / 2, 60, 60)
    );

    // Add input
    const keyInput = new ECS.KeyInputComponent();
    scene.addGlobalComponentAndRun(keyInput);
    scene.assignGlobalAttribute('key_input', keyInput);

    // Add controller
    playerBody.addComponent(
        new ECS.FuncComponent('playerControl').doOnUpdate((cmp) => {
            const keys = scene.getGlobalAttribute<ECS.KeyInputComponent>('key_input');
            const body = (cmp.owner as PixiMatter.MatterBody).body;

            if (keys.isKeyPressed(ECS.Keys.KEY_LEFT)) {
                Matter.Body.applyForce(body, body.position, { x: -0.05, y: 0 });
            }
            if (keys.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
                Matter.Body.applyForce(body, body.position, { x: 0.05, y: 0 });
            }
            if (keys.isKeyPressed(ECS.Keys.KEY_SPACE)) {
                Matter.Body.applyForce(body, body.position, { x: 0, y: -0.15 });
                keys.handleKey(ECS.Keys.KEY_SPACE);
            }
        })
    );
}
```

---

## Gravity Configuration

```typescript
// Modify gravity after init
binder.mWorld.gravity.y = 2;    // default is 1
binder.mWorld.gravity.x = 0;    // default is 0
binder.mWorld.gravity.scale = 0.001; // force scale
```

---

## Physics Without `MatterBind` (Manual)

You can use Matter.js entirely separately and just run physics in a `FuncComponent`:

```typescript
const mEngine = Matter.Engine.create();
const mRunner = Matter.Runner.create(null);

scene.addGlobalComponent(
    new ECS.FuncComponent('physicsLoop').doOnUpdate((cmp, delta) => {
        Matter.Runner.tick(mRunner, mEngine, delta);
        
        // Manually sync your display objects
        for (const [body, sprite] of bodyToSpriteMap) {
            sprite.position.x = body.position.x;
            sprite.position.y = body.position.y;
            sprite.rotation = body.angle;
        }
    })
);
```

This approach gives you full control over what is rendered and how.

---

## Imports

```typescript
import * as PixiMatter from '../../libs/pixi-matter';
// Exports: MatterBind, MatterBody, MatterBodyOptions, MatterConstraint, MatterConstraintOptions, MatterBindConfig
```
