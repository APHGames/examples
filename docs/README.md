# COLFIO / pixi-ecs — Documentation

> **Single source of truth** for building games with the COLFIO ECS library (embedded in this repo as `libs/pixi-ecs`).

---

## Quick-start

```typescript
import * as ECS from '../../libs/pixi-ecs';

// 1. Create engine and attach to canvas
const engine = new ECS.Engine();
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;
engine.init(canvas, {
    width: 800,
    height: 600,
    backgroundColor: 0x1a1a2e,
    tagsSearchEnabled: true,
});

// 2. Load assets, then build the scene
engine.app.loader
    .add('spritesheet', './assets/spritesheet.png')
    .load(() => {
        engine.scene.clearScene();

        // 3. Add a global input handler
        engine.scene.addGlobalComponent(new ECS.KeyInputComponent());

        // 4. Build a game object with a component
        new ECS.Builder(engine.scene)
            .asSprite(PIXI.Texture.from('spritesheet'))
            .localPos(400, 300)
            .anchor(0.5)
            .withTag('player')
            .withComponent(new PlayerController())
            .withParent(engine.scene.stage)
            .build();
    });

// 5. Write a component
class PlayerController extends ECS.Component {
    onInit() {
        this.subscribe('PLAYER_DIED');
    }

    onUpdate(delta: number, absolute: number) {
        const keys = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(ECS.KeyInputComponent.name);
        if (keys.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
            this.owner.position.x += 3;
        }
    }

    onMessage(msg: ECS.Message) {
        if (msg.action === 'PLAYER_DIED') {
            this.finish();
        }
    }
}
```

---

## Document Index

| File | What it covers |
|------|----------------|
| [01-architecture.md](./01-architecture.md) | Library layers (PIXI → ECS → Component), update loop, proxy pattern |
| [02-engine-setup.md](./02-engine-setup.md) | `Engine.init`, `EngineConfig`, asset loading, game loop types, responsive mode |
| [03-components.md](./03-components.md) | `Component<T>` lifecycle, `FuncComponent`, `fixedFrequency`, props pattern |
| [04-game-objects.md](./04-game-objects.md) | All game object types (`Sprite`, `Container`, `Graphics`…) + `Builder` fluent API |
| [05-messaging.md](./05-messaging.md) | Message bus, `subscribe`/`sendMessage`, built-in messages, response collection |
| [06-scene-querying.md](./06-scene-querying.md) | Tags, flags, states, attributes, `findObjects*`, global attributes as DI, `callWithDelay` |
| [07-chain-component.md](./07-chain-component.md) | `ChainComponent` — all commands, sequenced animations, async flows |
| [08-input.md](./08-input.md) | `KeyInputComponent`, `PointerInputComponent`, `VirtualGamepadComponent` |
| [09-physics-matter.md](./09-physics-matter.md) | `MatterBind`, `MatterBody`, physics ↔ ECS integration |
| [10-math-utilities.md](./10-math-utilities.md) | `Vector`, `Steering`, `Interpolation`, `PathFinder`, `QuadTree`, `Random`, `PerlinNoise` |
| [11-game-architecture.md](./11-game-architecture.md) | Canonical folder structure, Factory/Builder/Selector/Action/Model patterns |
| [12-tetris-case-study.md](./12-tetris-case-study.md) | Tetris deep-dive: model separation, controller inheritance, CLI renderer |
| [13-vlak-case-study.md](./13-vlak-case-study.md) | Vlak deep-dive: ObservableState, ChainComponent actions, level loading pipeline |

---

## Key Concepts at a Glance

### Entity-Component-System

- **Game objects** (`ECS.Sprite`, `ECS.Container`, …) are visual containers that hold **components** and **attributes**
- **Components** encapsulate all behavior — movement, input, rendering, AI, sound
- The **Scene** is the message bus and object registry
- **Builder** is the fluent factory for constructing game objects declaratively

### Core Rules

1. One responsibility per component
2. Model/state classes are plain TypeScript — no ECS dependency
3. Components communicate via messages, not direct references
4. All entity creation goes through `Factory` / `Builders` — never inline
5. Use `scene.callWithDelay` instead of `setTimeout` / `setInterval`
6. All message keys, tags, and attributes are `enum` values — no raw strings

### Library Structure

```
libs/
  pixi-ecs/          ← core ECS library (Engine, Scene, Component, Builder, …)
  aph-math/          ← math utilities (Vector lives here indirectly, Steering, Pathfinding, …)
  pixi-matter/       ← Matter.js ↔ ECS bridge (MatterBind, MatterBody)

src/
  game_tetris/       ← fully playable Tetris implementation
  game_vlak/         ← fully playable Vlak (snake-train) implementation
  game_blockbreaker/ ← block breaker game
  01-helloworld/     ← minimal examples
  03-components/     ← component pattern demos
  05-dynamics/       ← steering behaviour demos
  06-physics/        ← Matter.js physics demos
  08-ai/             ← AI / pathfinding demos
```
