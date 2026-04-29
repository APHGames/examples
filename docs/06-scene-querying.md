# Scene Querying

> **TL;DR**
> - Querying by tag and name is enabled by default; flags and states must be opt-in in `EngineConfig`
> - Use `scene.findObjectsByTag`, `findObjectsByName`, etc. for indexed lookups (O(1) bucket)
> - `findObjectsByQuery` does a linear scan with combined conditions — slower but flexible
> - Global attributes (`assignGlobalAttribute` / `getGlobalAttribute`) serve as a DI container for shared state
> - `scene.callWithDelay` is the safe alternative to `setTimeout` for deferred actions

---

## Scene Properties Reference

| Property | Type | Description |
|----------|------|-------------|
| `app` | `PIXI.Application` | The underlying PIXI application |
| `name` | `string` | Scene name |
| `stage` | `Container` | Root game object; all scene objects are children of this |
| `width` | `number` | Virtual game width (from `EngineConfig`) |
| `height` | `number` | Virtual game height (from `EngineConfig`) |
| `currentDelta` | `number` | Delta time of the current frame in ms |
| `currentAbsolute` | `number` | Total elapsed game time in ms since engine start |

Access these from anywhere you have a `scene` reference — including inside components via `this.scene`.

---

## Enabling Search Features

Scene queries are backed by indexed lookup maps. Each index costs memory and must be explicitly enabled in `EngineConfig`. Missing configuration throws an `Error` at runtime — the error message tells you exactly which config flag to set.

```typescript
engine.init(canvas, {
    width: 800,
    height: 600,
    tagsSearchEnabled: true,      // enabled by default
    namesSearchEnabled: true,     // enabled by default
    flagsSearchEnabled: true,     // disabled by default — enable when needed
    statesSearchEnabled: true,    // disabled by default — enable when needed
    notifyAttributeChanges: true, // optional: emit ATTRIBUTE_* messages
    notifyStateChanges: true,     // optional: emit STATE_CHANGED messages
    notifyFlagChanges: true,      // optional: emit FLAG_CHANGED messages
    notifyTagChanges: true,       // optional: emit TAG_* messages
});
```

---

## Query Methods Reference

### By Tag

```typescript
// Returns all objects with this tag (requires tagsSearchEnabled)
const enemies = scene.findObjectsByTag('enemy');

// Returns the first object with this tag
const player = scene.findObjectByTag('player');
```

### By Name

```typescript
// Returns all objects with this name (requires namesSearchEnabled)
const bullets = scene.findObjectsByName('bullet');

// Returns the first match
const hud = scene.findObjectByName('hud');
```

### By Flag

```typescript
// Returns all objects with this flag set (requires flagsSearchEnabled)
const collidables = scene.findObjectsByFlag(FLAGS.COLLIDABLE);

// Returns the first match
const boss = scene.findObjectByFlag(FLAGS.BOSS);
```

### By State

```typescript
// Returns all objects in this state (requires statesSearchEnabled)
const idleEnemies = scene.findObjectsByState(EnemyState.IDLE);

// Returns the first match
const activePlayer = scene.findObjectByState(PlayerState.ACTIVE);
```

### By ID

```typescript
// Direct lookup by unique numeric id (always available, O(1))
const obj = scene.findObjectById(someId);
```

### By Query Condition (combined)

`findObjectsByQuery` does a **linear scan** over all game objects. Use it when you need multiple conditions simultaneously:

```typescript
import { QueryCondition } from '../../libs/pixi-ecs';

const targets = scene.findObjectsByQuery({
    ownerTag: 'enemy',
    ownerFlag: FLAGS.COLLIDABLE,
    ownerState: EnemyState.PATROL,
});
```

`QueryCondition` fields — all optional, `undefined` means "don't check":

| Field | Type | Description |
|-------|------|-------------|
| `ownerId` | `number` | Match by object id |
| `ownerName` | `string` | Match by object name |
| `ownerTag` | `string` | Match by tag |
| `ownerState` | `number` | Match by `stateId` |
| `ownerFlag` | `number` | Match by flag |

> `findObjectsByQuery` is O(n) over all objects. For performance-sensitive code, prefer indexed `findObjectsByTag` / `findObjectsByFlag` lookups.

---

## Global Attributes — Shared State Container

`scene.stage` has its own attributes map. Use it as a lightweight dependency injection container for game-wide shared state:

```typescript
// In factory.ts — store state on the scene
const gameState = new GameState();
scene.assignGlobalAttribute(Attributes.GAME_STATE, gameState);

const keyInput = new ECS.KeyInputComponent();
scene.addGlobalComponentAndRun(keyInput);
scene.assignGlobalAttribute(Attributes.KEY_INPUT, keyInput);
```

```typescript
// In any component — retrieve it
const gameState = this.scene.getGlobalAttribute<GameState>(Attributes.GAME_STATE);
const keys = this.scene.getGlobalAttribute<ECS.KeyInputComponent>(Attributes.KEY_INPUT);
```

**Always wrap** global attribute access in a `Selectors` class (see [11-game-architecture.md](./11-game-architecture.md)) to avoid scattering raw string keys across the codebase:

```typescript
// selectors.ts
export class Selectors {
    static gameState = (scene: ECS.Scene) =>
        scene.getGlobalAttribute<GameState>(Attributes.GAME_STATE);

    static keyInput = (scene: ECS.Scene) =>
        scene.getGlobalAttribute<ECS.KeyInputComponent>(Attributes.KEY_INPUT);
}

// Usage in any component
const state = Selectors.gameState(this.scene);
```

---

## `callWithDelay` — Deferred Execution

**Never use `setTimeout` or `setInterval`** in game code. They run outside the game loop and can cause race conditions with the update cycle.

Instead, use `scene.callWithDelay`:

```typescript
// Execute after 2 seconds (2000ms)
this.scene.callWithDelay(2000, () => {
    this.scene.clearScene();
    new Factory().loadGame(this.scene);
});

// Execute at end of current frame (delay = 0)
this.scene.callWithDelay(0, () => {
    // Safe to clear scene here — runs after all updates complete
    this.scene.clearScene();
});
```

`callWithDelay` is integrated with the game loop:

- The callback is queued with a timestamp
- At the end of each `scene._update`, elapsed time is checked
- Callbacks whose delay has elapsed are invoked in order

This guarantees the callback runs inside a "safe" window between update loops, making it safe to add/remove objects or clear the scene.

---

## Finding Global Components

Global components (on `scene.stage`) are retrieved by class name:

```typescript
const keys = scene.findGlobalComponentByName<ECS.KeyInputComponent>(
    ECS.KeyInputComponent.name
);

const gamepad = scene.findGlobalComponentByName<ECS.VirtualGamepadComponent>(
    ECS.VirtualGamepadComponent.name
);
```

`Component.name` returns the class name by default. You can override it with `this._name = 'custom'` in the constructor.

---

## Removing Global Attributes

```typescript
scene.removeGlobalAttribute(Attributes.GAME_STATE);
```

This is rarely needed — global attributes are cleared automatically when `clearScene()` is called, since the stage object is rebuilt.

---

## Change Notifications via Messages

When the corresponding `notify*` config flags are enabled, attribute/state/flag/tag changes are broadcast as messages. This lets components react to changes reactively rather than polling:

```typescript
// Enable in config
engine.init(canvas, {
    notifyStateChanges: true,
    notifyAttributeChanges: true,
});

// In a component — subscribe to state changes on any object
onInit() {
    this.subscribe(ECS.Messages.STATE_CHANGED);
}

onMessage(msg: ECS.Message) {
    if (msg.action === ECS.Messages.STATE_CHANGED) {
        const { previous, current } = msg.data as ECS.StateChangeMessage;
        console.log(`${msg.gameObject.name} state: ${previous} → ${current}`);
    }
}
```

> Enable these notifications selectively — they broadcast to all subscribers for every change and can create performance overhead in object-heavy scenes.

---

## Scene Time

```typescript
// Current delta (ms since last frame) — available during update
scene.currentDelta

// Total elapsed game time (ms) — available during update  
scene.currentAbsolute
```

These are useful inside components (`this.scene.currentAbsolute`) and also from within state/model objects that have a reference to the scene.
