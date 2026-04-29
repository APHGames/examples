# Input

> **TL;DR**
> - `KeyInputComponent` is polled each frame (no messages) — add globally and retrieve by name
> - `PointerInputComponent` uses messages — subscribe to `PointerMessages.*` to receive events
> - `VirtualGamepadComponent` extends `KeyInputComponent` — transparent drop-in for mobile
> - All input components should be added to `scene.stage` (globally), not to individual objects
> - Use `handleKey(code)` to consume a key press so it doesn't repeat within the same logical tick

---

## `KeyInputComponent`

A simple keyboard handler that tracks currently held keys. It does not send messages — it must be **polled** each frame from a controller component.

### Setup

```typescript
// In factory.ts — add globally before building the scene
const keyInput = new ECS.KeyInputComponent();
scene.addGlobalComponentAndRun(keyInput);
scene.assignGlobalAttribute(Attributes.KEY_INPUT, keyInput);
```

### Polling in a Component

```typescript
class PlayerController extends ECS.Component<GameModel> {
    private keyInput: ECS.KeyInputComponent;

    onInit() {
        // Retrieve the global key input
        this.keyInput = this.scene.getGlobalAttribute<ECS.KeyInputComponent>(Attributes.KEY_INPUT);
    }

    onUpdate(delta: number, absolute: number) {
        if (this.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
            this.props.moveLeft();
        }
        if (this.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT)) {
            this.props.moveRight();
        }
        // Consume a key for one-shot actions (e.g. rotate)
        if (this.keyInput.isKeyPressed(ECS.Keys.KEY_A)) {
            this.props.rotateLeft();
            this.keyInput.handleKey(ECS.Keys.KEY_A); // prevents repeat until key is released and re-pressed
        }
    }
}
```

Alternatively retrieve by class name:

```typescript
this.keyInput = this.scene.findGlobalComponentByName<ECS.KeyInputComponent>(
    ECS.KeyInputComponent.name
);
```

### `KeyInputComponent` API

| Method | Description |
|--------|-------------|
| `isKeyPressed(keyCode, includeHandled?)` | Returns `true` if the key is currently held down |
| `handleKey(keyCode)` | Marks the key as "consumed" — removes it from pressed set until released |

`handleKey` is important for actions that should trigger once per press, not continuously (rotation, jump, menu selection).

### `Keys` Enum

```typescript
ECS.Keys.KEY_LEFT    // 37
ECS.Keys.KEY_UP      // 38
ECS.Keys.KEY_RIGHT   // 39
ECS.Keys.KEY_DOWN    // 40
ECS.Keys.KEY_SPACE   // 32
ECS.Keys.KEY_ENTER   // 13
ECS.Keys.KEY_SHIFT   // 16
ECS.Keys.KEY_CTRL    // 17
ECS.Keys.KEY_ALT     // 18
ECS.Keys.KEY_A       // 65
ECS.Keys.KEY_B       // 66
// ... KEY_C through KEY_Z (67–90)
```

---

## `PointerInputComponent`

Handles mouse and touch events on the canvas and broadcasts them as COLFIO messages. Components subscribe to receive pointer events.

### Setup

```typescript
// Can be added to a specific game object (e.g. a button)
button.addComponent(new ECS.PointerInputComponent({
    handleClick: true,       // fires POINTER_TAP on tap/click
    handlePointerDown: true, // fires POINTER_DOWN on press
    handlePointerOver: true, // fires POINTER_OVER on move/drag
    handlePointerRelease: true, // fires POINTER_RELEASE on release
}));

// Or globally on the stage for canvas-wide tracking
scene.addGlobalComponent(new ECS.PointerInputComponent({
    handleClick: true,
    handlePointerDown: true,
    handlePointerOver: true,
}));
```

All options default to `false` except `handleClick: true`.

### Subscribing to Pointer Events

```typescript
class ButtonController extends ECS.Component {
    onInit() {
        this.subscribe(ECS.PointerMessages.POINTER_TAP);
        this.subscribe(ECS.PointerMessages.POINTER_DOWN);
        this.subscribe(ECS.PointerMessages.POINTER_OVER);
        this.subscribe(ECS.PointerMessages.POINTER_RELEASE);
    }

    onMessage(msg: ECS.Message) {
        if (msg.action === ECS.PointerMessages.POINTER_TAP) {
            const { posX, posY, isTouch } = msg.data;
            console.log(`Tapped at ${posX}, ${posY}`);
            this.handleTap();
        }
    }
}
```

### `PointerMessages` Enum

| Constant | Value | Fired when |
|----------|-------|-----------|
| `POINTER_TAP` | `'pointer-tap'` | Mouse click or touch with < 10px movement |
| `POINTER_DOWN` | `'pointer-down'` | Mouse/touch press starts |
| `POINTER_OVER` | `'pointer-over'` | Mouse moves or touch drags |
| `POINTER_RELEASE` | `'pointer-release'` | Mouse/touch ends with > 10px movement (drag) |

### Message Data Shape

All pointer messages carry a `data` object:

```typescript
{
    posX: number,   // canvas x position (adjusted for resolution/scaling)
    posY: number,   // canvas y position
    isTouch: boolean // true if touch event, false if mouse
}
```

---

## `VirtualGamepadComponent`

A mobile-friendly overlay gamepad that renders on-screen buttons and internally translates taps into key presses. It **extends `KeyInputComponent`**, so any code using `KeyInputComponent` works unchanged with `VirtualGamepadComponent` as a drop-in.

### Setup

```typescript
import { isMobileDevice } from '../../libs/pixi-ecs/utils/helpers';

const keyboard = isMobileDevice()
    ? new ECS.VirtualGamepadComponent({
        KEY_UP:    ECS.Keys.KEY_UP,
        KEY_DOWN:  ECS.Keys.KEY_DOWN,
        KEY_LEFT:  ECS.Keys.KEY_LEFT,
        KEY_RIGHT: ECS.Keys.KEY_RIGHT,
        KEY_A:     ECS.Keys.KEY_SPACE,   // action button A
        KEY_B:     ECS.Keys.KEY_ENTER,   // action button B
        KEY_X:     ECS.Keys.KEY_ALT,     // optional
        KEY_Y:     ECS.Keys.KEY_SHIFT,   // optional
    })
    : new ECS.KeyInputComponent();

scene.addGlobalComponentAndRun(keyboard);
scene.assignGlobalAttribute(Attributes.KEY_INPUT, keyboard);
```

Buttons that are not mapped (left `undefined`) are not rendered. Map only the keys your game uses.

### `GamepadButtons`

| Button | Description |
|--------|-------------|
| `KEY_UP` | D-pad up |
| `KEY_DOWN` | D-pad down |
| `KEY_LEFT` | D-pad left |
| `KEY_RIGHT` | D-pad right |
| `KEY_A` | Action button A (bottom-right) |
| `KEY_B` | Action button B |
| `KEY_X` | Action button X |
| `KEY_Y` | Action button Y |

### Controller Code Unchanged

Since `VirtualGamepadComponent` extends `KeyInputComponent`, controller components need no changes:

```typescript
// Works with both KeyInputComponent and VirtualGamepadComponent
const keys = this.scene.getGlobalAttribute<ECS.KeyInputComponent>(Attributes.KEY_INPUT);
if (keys.isKeyPressed(ECS.Keys.KEY_SPACE)) { /* ... */ }
```

---

## Mobile Detection

The library includes a utility function:

```typescript
import { isMobileDevice } from '../../libs/pixi-ecs/utils/helpers';

if (isMobileDevice()) {
    // Use virtual gamepad
}
```

You can also force mobile mode with a URL parameter:

```
?mobile
```

```typescript
const isMobile = isMobileDevice() || new URLSearchParams(window.location.search).has('mobile');
```

---

## Input in Fixed-Update Controllers

For games using `fixedFrequency` on the controller (grid-based movement, etc.), poll input in `onFixedUpdate`:

```typescript
class TrainKeyboardController extends ECS.Component<TrainState> {

    onInit() {
        this.fixedFrequency = 3; // 3 checks per second
    }

    onFixedUpdate() {
        const keys = this.scene.getGlobalAttribute<ECS.KeyInputComponent>(Attributes.KEY_INPUT);

        if (keys.isKeyPressed(ECS.Keys.KEY_UP)) {
            this.props.changeDirection(Direction.UP);
            keys.handleKey(ECS.Keys.KEY_UP);
        } else if (keys.isKeyPressed(ECS.Keys.KEY_DOWN)) {
            this.props.changeDirection(Direction.DOWN);
            keys.handleKey(ECS.Keys.KEY_DOWN);
        }
    }
}
```
