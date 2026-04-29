# Engine Setup

> **TL;DR**
> - `new ECS.Engine()` then `engine.init(canvas, config)` to start
> - Most `EngineConfig` options default to sensible values — only set what you need
> - Use `PIXI.Loader` (via `engine.app.loader`) for asset loading before building the scene
> - Use `scene.clearScene()` to reset between game states; use `clearSceneAsync()` from inside components
> - Add `?debug` or `?responsive` to the URL as convenient dev shortcuts

---

## Minimal Setup

```typescript
import * as ECS from '../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';

const engine = new ECS.Engine();
const canvas = document.getElementById('gameCanvas') as HTMLCanvasElement;

engine.init(canvas, {
    width: 800,
    height: 600,
    backgroundColor: 0x000000,
    tagsSearchEnabled: true,
});

// Scene is ready immediately after init
engine.scene.stage.addChild(new ECS.Container('root'));
```

---

## `EngineConfig` Reference

`EngineConfig` extends `SceneConfig` — all scene-level options are also accepted here.

### Canvas / Rendering

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `width` | `number` | canvas width | Virtual game width in pixels |
| `height` | `number` | canvas height | Virtual game height in pixels |
| `resolution` | `number` | `1` | Device pixel ratio / upscaling factor |
| `backgroundColor` | `number` | `0x000000` | Canvas background color (hex) |
| `transparent` | `boolean` | `false` | Whether the canvas background is transparent |
| `antialias` | `boolean` | `true` | Enable PIXI antialiasing |
| `resizeToScreen` | `boolean` | `false` | Auto-resize canvas to fit browser window |
| `canvasId` | `string` | — | Disambiguate when multiple canvases exist |

### Game Loop

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `gameLoopType` | `GameLoopType` | `VARIABLE` | `FIXED` or `VARIABLE` update timing |
| `gameLoopThreshold` | `number` | `300` | Max delta cap in ms (prevents spiral-of-death on tab focus) |
| `gameLoopFixedTick` | `number` | `16` | Frame duration in ms for `FIXED` loop (~60fps) |
| `speed` | `number` | `1` | Global game speed multiplier |

### Scene Features (opt-in)

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `tagsSearchEnabled` | `boolean` | `true` | Index objects by tag for `findObjectsByTag` |
| `namesSearchEnabled` | `boolean` | `true` | Index objects by name for `findObjectsByName` |
| `flagsSearchEnabled` | `boolean` | `false` | Index objects by flag for `findObjectsByFlag` |
| `statesSearchEnabled` | `boolean` | `false` | Index objects by state for `findObjectsByState` |
| `notifyAttributeChanges` | `boolean` | `false` | Emit `ATTRIBUTE_*` messages on attribute changes |
| `notifyStateChanges` | `boolean` | `false` | Emit `STATE_CHANGED` when `stateId` changes |
| `notifyFlagChanges` | `boolean` | `false` | Emit `FLAG_CHANGED` when a flag changes |
| `notifyTagChanges` | `boolean` | `false` | Emit `TAG_*` messages when tags change |
| `debugEnabled` | `boolean` | `false` | Inject the debug overlay panel |

---

## Game Loop Types

### `VARIABLE` (default)

Delta time is the actual elapsed real time since the last frame, capped at `gameLoopThreshold`. Physics and movement must be scaled by delta to remain frame-rate independent.

```typescript
onUpdate(delta: number, absolute: number) {
    this.owner.position.x += this.speed * delta; // delta in ms
}
```

### `FIXED`

Delta is always `gameLoopFixedTick` ms regardless of real time. Useful when determinism matters (e.g. replays, physics).

```typescript
engine.init(canvas, {
    gameLoopType: ECS.GameLoopType.FIXED,
    gameLoopFixedTick: 16, // 16ms = ~60fps fixed step
});
```

---

## Asset Loading

COLFIO does not have its own asset loader — use PIXI's built-in `loader` via `engine.app.loader`:

```typescript
engine.init(canvas, { width: 800, height: 600 });

engine.app.loader
    .reset()
    .add('spritesheet', './assets/game/spritesheet.png')
    .add('level_data', './assets/game/levels.json')
    .add('music', './assets/game/music.mp3')
    .load(() => {
        // Assets are available in PIXI.Loader.shared.resources after this callback
        onAssetsLoaded(engine.scene);
    });

function onAssetsLoaded(scene: ECS.Scene) {
    scene.clearScene();
    new Factory().loadGame(scene);
}
```

For **sound**, use `pixi-sound` alongside the loader:

```typescript
import PIXISound from 'pixi-sound';

PIXISound.add('explosion', './assets/snd_explosion.mp3');
// later:
PIXISound.play('explosion');
```

Fonts (bitmap fonts) require both the `.fnt` descriptor and the `.png` texture:

```typescript
engine.app.loader
    .add('my_font', './assets/font.fnt')
    .add('my_font_tex', './assets/font.png')
    .load(() => {
        const fontData = scene.app.loader.resources['my_font'].data;
        const fontTexture = PIXI.Texture.from('my_font_tex');
        // parse and use...
    });
```

---

## Scene Clearing / Reloading

`clearScene()` destroys all game objects and resets the scene to a clean stage. Use it when transitioning between game states (intro → game → game-over).

```typescript
// Safe to call outside of an update loop (e.g. in loader callback)
scene.clearScene();
new Factory().loadGame(scene);
```

**Inside a component**, the update loop is active. You must defer:

```typescript
// Inside onUpdate or onMessage:
this.scene.callWithDelay(0, () => {
    this.scene.clearScene();
    new Factory().loadGame(this.scene);
});
```

Or use `clearSceneAsync()` which wraps this pattern:

```typescript
// Also defers via callWithDelay(0)
this.scene.clearSceneAsync();
```

The `clearScene` method sends a `Messages.SCENE_CLEAR` message before destroying objects, allowing components to react if needed.

---

## Scene Dimensions

After `init`, use `scene.width` and `scene.height` for layout calculations — these reflect the virtual game dimensions (independent of canvas pixel size and resolution):

```typescript
// Center an object
sprite.position.set(engine.scene.width / 2, engine.scene.height / 2);
```

---

## Debug Overlay

The debug overlay renders a small diagnostic panel next to the canvas showing FPS, object counts, and component stats. There are three ways to enable it:

1. **Config flag** — `debugEnabled: true` in `EngineConfig`
2. **URL parameter** — append `?debug` to the page URL
3. **Component** — add `DebugComponent` directly to the stage:

```typescript
import { DebugComponent } from '../../libs/pixi-ecs';

scene.addGlobalComponent(new DebugComponent());
```

The component approach is useful when you want programmatic control over when the overlay is shown/hidden (e.g. toggle on a key press).

---

## Developer URL Parameters

Add these to the URL to enable dev features without code changes:

| Query param | Effect |
|-------------|--------|
| `?debug` | Enables the debug panel (same as `debugEnabled: true`) |
| `?responsive` | Enables resize-to-screen mode (same as `resizeToScreen: true`) |

---

## Responsive / Pixel-Art Scaling

For pixel-art games that must scale by integer multiples (no blurring), handle resize manually:

```typescript
// In your game's index.ts entry class
const resizeHandler = () => {
    const scale = Math.min(
        Math.floor(window.innerWidth / BASE_WIDTH),
        Math.floor(window.innerHeight / BASE_HEIGHT)
    );
    if (scale > 0) {
        engine.app.renderer.resolution = scale;
        engine.app.view.width = BASE_WIDTH * scale;
        engine.app.view.height = BASE_HEIGHT * scale;
    }
};

window.addEventListener('resize', resizeHandler);
resizeHandler(); // apply on load

// Pixel-art rendering settings
PIXI.settings.ROUND_PIXELS = true;
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
```

---

## Destroying the Engine

```typescript
engine.destroy(); // stops the loop and destroys the PIXI app
```

Useful when navigating away from a game or unmounting it from a larger application. Clean up resize listeners manually if you added them.

---

## Accessing Engine from Components

Components receive `this.scene` and `this.owner` automatically. To access the engine object itself, you typically don't need to — the scene has `scene.width`, `scene.height`, `scene.app`, and `scene.currentDelta` / `scene.currentAbsolute`. If you need the engine, pass it as a prop or store it as a global attribute on the scene.
