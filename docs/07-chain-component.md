# ChainComponent

> **TL;DR**
> - `ChainComponent` is a linked-list of commands that execute one per frame
> - Use it for any multi-step sequence: timed delays, waiting for animations, conditional flows, loops
> - Commands execute via the normal `onUpdate` loop — they are frame-rate aware
> - `waitFor(component)` is the key primitive: starts a component and waits for it to finish
> - Use `mergeWith` to dynamically extend a running chain

---

## What is ChainComponent?

`ChainComponent` is a built-in component that implements a chain-of-command pattern. Each method appends a node to a linked list. During `onUpdate`, the chain advances one step per frame (or stays blocked on a wait condition).

This makes it possible to write readable sequential logic without callbacks, state machines, or coroutines:

```typescript
new ECS.ChainComponent()
    .call(() => this.sendMessage(Messages.GAME_STARTED))
    .waitTime(1000)                          // wait 1 second
    .waitFor(() => new FadeInAnimation())    // run animation, wait for it to finish
    .call(() => scene.clearScene())
    .call(() => new Factory().loadGame(scene))
```

---

## Command Reference

### Execution Commands

| Command | Description |
|---------|-------------|
| `.call(fn)` | Execute a function immediately and advance. `fn` receives the `ChainComponent` as argument |
| `.addComponent(cmp, obj?)` | Add a component to `obj` (defaults to chain's owner). Pass factory function for deferred evaluation |
| `.removeComponent(name, obj?)` | Remove a component by name from `obj` (defaults to chain's owner) |
| `.destroyGameObjectsByQuery(query)` | Destroy all objects matching `QueryCondition` |
| `.detachGameObjectsByQuery(query)` | Detach all objects matching `QueryCondition` |
| `.detachGameObject(obj)` | Detach a specific game object |
| `.destroyGameObject(obj)` | Destroy a specific game object |

### Wait Commands

| Command | Description |
|---------|-------------|
| `.waitTime(ms)` | Block for a given number of milliseconds |
| `.waitFrames(n)` | Block for `n` update frames |
| `.waitUntil(fn)` | Block while `fn()` returns `false`; advance when it returns `true` |
| `.waitFor(cmp \| fn)` | Run a component (if not already running) and wait for it to call `finish()` |
| `.waitForFirst(cmps[])` | Run multiple components; advance when the first one finishes (others are interrupted) |
| `.waitForMessage(action)` | Block until a message with the given action key arrives |
| `.waitForMessageConditional(action, condition)` | Block until matching message arrives AND `QueryCondition` is satisfied |

### Loop Commands

| Command | Description |
|---------|-------------|
| `.beginRepeat(n)` / `.endRepeat()` | Repeat the block `n` times. Pass `0` for infinite |
| `.beginWhile(fn)` / `.endWhile()` | Repeat while `fn()` returns `true` |
| `.beginInterval(seconds)` / `.endInterval()` | Run block repeatedly, waiting `seconds` between each iteration |

### Conditional Commands

| Command | Description |
|---------|-------------|
| `.beginIf(fn)` / `.else()` / `.endIf()` | Execute block only if `fn()` returns `true` |

### Lifecycle Commands

| Command | Description |
|---------|-------------|
| `.addAbortCondition(fn)` | Checks `fn()` every frame; calls `finish()` if it returns `true` |
| `.mergeWith(other)` | Append another `ChainComponent` to the end of this one |
| `.mergeAtBeginning(other)` | Prepend another `ChainComponent` to the start of this one |
| `.executeUpon(obj)` | Shortcut: adds and runs this chain on `obj` (calls `addComponentAndRun`) |

---

## Attaching a Chain

Chains are components — they must be attached to a game object or to the stage:

```typescript
// On the stage (global)
scene.addGlobalComponentAndRun(new ECS.ChainComponent()
    .waitTime(3000)
    .call(() => scene.clearScene())
);

// On a specific game object
sprite.addComponentAndRun(new ECS.ChainComponent()
    .waitFor(() => new MoveAnimation(target))
    .call(() => sprite.destroy())
);

// Using executeUpon shortcut
new ECS.ChainComponent()
    .waitTime(500)
    .call(() => this.sendMessage(Messages.BLINK_DONE))
    .executeUpon(this.owner);
```

---

## `waitFor` — The Key Primitive

`.waitFor(component | factory)` is the most powerful command. It:

1. Accepts either an already-constructed component or a factory function `() => Component`
2. If the component has no owner, attaches it to the chain's owner object via `addComponentAndRun`
3. Waits until the component calls `finish()`
4. Advances to the next command

This enables a composable animation/sequence system:

```typescript
// Animation components just need to call finish() when done
class SlideInAnimation extends ECS.Component {
    onUpdate(delta: number, absolute: number) {
        this.owner.position.x += delta * 0.5;
        if (this.owner.position.x >= this.targetX) {
            this.owner.position.x = this.targetX;
            this.finish(); // signals ChainComponent to advance
        }
    }
}

// The chain waits for the animation to complete
scene.addGlobalComponentAndRun(new ECS.ChainComponent()
    .waitFor(() => new SlideInAnimation(targetX))
    .call(() => this.sendMessage(Messages.INTRO_COMPLETE))
);
```

**Use a factory function** (`() => new MyCmp()`) rather than an instance when the `ChainComponent` might be reused:

```typescript
// Safe for reuse — creates a fresh component each time
.waitFor(() => new FadeAnimation())

// Unsafe for reuse — the component instance is consumed on first run
.waitFor(new FadeAnimation())
```

---

## `mergeWith` — Dynamic Extension

A running chain can be extended at runtime. This is useful when the next steps depend on runtime state:

```typescript
static loadNextLevel = (scene: ECS.Scene) => {
    return new ECS.ChainComponent()
        .waitTime(1000)
        .call((cmp) => {
            const state = Selectors.gameState(scene);
            if (state.isLastLevel) {
                // Dynamically extend the chain based on state
                cmp.mergeWith(new ECS.ChainComponent()
                    .call(() => showEndingScreen(scene))
                    .waitFor(() => new WaitForInputComponent())
                    .call(() => scene.clearScene())
                );
            } else {
                cmp.mergeWith(new ECS.ChainComponent()
                    .call(() => loadLevel(scene, state.nextLevelIndex))
                );
            }
        });
}
```

---

## Loops

### Fixed repetition

```typescript
// Flash 5 times
sprite.addComponentAndRun(new ECS.ChainComponent()
    .beginRepeat(5)
        .call(() => { sprite.visible = false; })
        .waitTime(100)
        .call(() => { sprite.visible = true; })
        .waitTime(100)
    .endRepeat()
    .call(() => this.sendMessage(Messages.FLASH_DONE))
);
```

### Conditional loop

```typescript
// Keep spawning enemies while the game is running
scene.addGlobalComponentAndRun(new ECS.ChainComponent()
    .beginWhile(() => Selectors.gameState(scene).isRunning)
        .call(() => spawnEnemy(scene))
        .waitTime(2000)
    .endWhile()
);
```

### Interval loop

```typescript
// Play background music, change every 20 seconds indefinitely
scene.addGlobalComponentAndRun(new ECS.ChainComponent()
    .beginInterval(20000)
        .call(() => rotateBackgroundMusic())
    .endInterval()
);
```

---

## Conditional Branching

```typescript
scene.addGlobalComponentAndRun(new ECS.ChainComponent()
    .waitForMessage(Messages.DOOR_REACHED)
    .beginIf(() => Selectors.gameState(scene).currentLevel.doorOpen)
        .call(() => scene.addGlobalComponentAndRun(Actions.completeLevel(scene)))
    .else()
        .call(() => this.sendMessage(Messages.DOOR_LOCKED_FEEDBACK))
    .endIf()
);
```

---

## Abort Condition

Add a global guard that auto-finishes the chain if a condition becomes true:

```typescript
new ECS.ChainComponent()
    .addAbortCondition(() => Selectors.gameState(scene).crashed)
    .beginRepeat(0) // infinite
        .call(() => moveForward())
        .waitTime(200)
    .endRepeat()
```

---

## Actions Pattern

In larger games, chains are wrapped in static factory functions that return `ChainComponent` instances. This keeps business logic centralized and testable:

```typescript
// actions.ts
export class Actions {
    static crashTrain = (scene: ECS.Scene, trainState: TrainState) => {
        return new ECS.ChainComponent()
            .call(() => {
                trainState.crashTrain();
                const train = scene.findObjectByTag(Tags.TRAIN);
                train.addComponent(new TrainCrashAnimator());
            })
            .waitTime(2000)
            .call(() => scene.callWithDelay(0, () => LevelFactory.reloadLevel(scene)));
    }
}

// Usage
scene.addGlobalComponentAndRun(Actions.crashTrain(scene, trainState));
```

See [13-vlak-case-study.md](./13-vlak-case-study.md) for extensive real-world examples of this pattern.

---

## Common Pitfalls

| Pitfall | Correct approach |
|---------|-----------------|
| Calling `clearScene()` inside a `.call()` | Wrap in `scene.callWithDelay(0, ...)` — clearing during update corrupts iteration |
| Passing an already-running component to `waitFor` | Use a factory function `() => new MyCmp()` |
| Infinite chain without exit condition | Always add `.addAbortCondition(...)` or use `beginWhile` |
| Forgetting that chains are one-shot | A chain that has finished cannot be restarted — create a new one |
