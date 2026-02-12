# Product Requirements Document (PRD)
# APH Games Examples - ECS Framework & Games

**Version:** 6.4.0  
**Author:** Adam Vesecký  
**Last Updated:** February 12, 2026

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Technology Stack](#technology-stack)
3. [Project Structure](#project-structure)
4. [ECS Library Architecture](#ecs-library-architecture)
5. [Game Architecture Patterns](#game-architecture-patterns)
6. [Game Implementations](#game-implementations)
7. [Build System](#build-system)
8. [Development Guidelines](#development-guidelines)
9. [Extension Points](#extension-points)

---

## 1. Project Overview

### Purpose
This project is a collection of examples and complete mini-games built using PixiJS and a custom Entity-Component-System (ECS) library called `pixi-ecs`. The project serves as:
- Educational examples for game development concepts
- Demonstration of the ECS architecture pattern
- Three complete playable games showcasing the framework

### Main Games
1. **Tetris** - Classic falling block puzzle game
2. **Vlak** (Train) - Snake-like puzzle/action game with maze navigation
3. **Block Breaker** - Arkanoid/brick breaker style arcade game

### Additional Examples
The project includes 100+ examples organized into categories:
- Hello World (PIXI & ThreeJS)
- PixiJS/ThreeJS Introduction
- Components
- Space (pathfinding, distribution, Perlin noise, quadtree)
- Dynamics (steering behaviors, Ackermann, missiles)
- Physics (Matter.js integration, collisions, platformer)
- Graphics (raycaster, shaders, tweens, lighting)
- AI (bots, pursuit)
- Network (animations, steering)
- Others (dialog, progress, hit testing)

---

## 2. Technology Stack

### Core Technologies
- **TypeScript** - Main development language (targeting ES2017)
- **PixiJS v6.1.2** - 2D WebGL rendering engine
- **Three.js v0.131.3** - 3D graphics (used in some examples)
- **Matter.js v0.17.1** - 2D physics engine (used in physics examples)
- **EventEmitter3 v4.0.7** - Event management
- **pixi-sound v3.0.5** - Audio system

### Build & Development Tools
- **Parcel v2.9.3** - Zero-config bundler
- **TypeScript v4.9.5** - Type checking and compilation
- **ESLint v7.32.0** - Code linting
- **parcel-namer-rewrite** - Custom Parcel namer plugin

### Configuration Files
- `package.json` - Dependencies and npm scripts
- `tsconfig.json` - TypeScript compiler configuration
- `examples-info.json` - Example metadata for generation
- `.eslintrc` - Linting rules (not included but referenced)

---

## 3. Project Structure

### Directory Layout

```
aph_examples/
├── libs/
│   └── pixi-ecs/              # Custom ECS framework (46 TypeScript files)
│       ├── engine/            # Core ECS engine
│       ├── components/        # Built-in components
│       ├── utils/             # Utilities (Vector, Flags, QueryCondition, etc.)
│       └── index.ts           # Public API exports
├── src/
│   ├── game_tetris/           # Tetris game (15 files)
│   ├── game_vlak/             # Train game (25 files)
│   ├── game_blockbreaker/     # Block breaker (10 files)
│   ├── 01-helloworld/         # Basic examples
│   ├── 02-pixi-intro/         # PixiJS introduction
│   ├── 02-three-intro/        # ThreeJS introduction
│   ├── 03-components/         # Component examples
│   ├── 04-space/              # Spatial algorithms
│   ├── 05-dynamics/           # Movement and steering
│   ├── 06-physics/            # Physics simulations
│   ├── 07-graphics/           # Graphics effects
│   ├── 08-ai/                 # AI behaviors
│   ├── 09-network/            # Network examples
│   ├── others/                # Miscellaneous
│   ├── utils/                 # Shared utilities
│   │   ├── APHExample.ts      # Base example classes
│   │   ├── dynamics.ts        # Dynamics utilities
│   │   ├── dynamics-component.ts
│   │   ├── colors.ts          # Color utilities
│   │   └── animation.ts       # Animation helpers
│   └── examples.ts            # Global exports to window.APH
├── scripts/
│   ├── generate-views.js      # Generates HTML files from examples-info.json
│   ├── prebuild-project.js    # Pre-build setup
│   ├── rename.js              # Post-build file renaming
│   ├── fix-links.js           # Post-build link fixing
│   ├── utils.js               # Build utilities
│   ├── example-template.html  # Template for example pages
│   └── index-template.html    # Template for index page
├── view/                      # Generated HTML files (build artifacts)
├── build/                     # Build output directory
├── examples-info.json         # Example metadata
├── package.json               # Project configuration
├── tsconfig.json              # TypeScript configuration
└── README.md                  # Project documentation
```

### Entry Points

#### Main Entry Point
- **`src/examples.ts`** - Imports all examples/games and exports them to `window.APH` for HTML access

#### Base Classes
All examples inherit from base classes in `src/utils/APHExample.ts`:

1. **`APHExample`** (Interface)
   - `init(canvas: HTMLCanvasElement | string)` - Initialize
   - `destroy()` - Cleanup

2. **`PIXIExample`** (Abstract class)
   - For raw PixiJS examples without ECS
   - Wraps `PIXI.Application`
   - Abstract: `load()`, `update(delta)`

3. **`ECSExample`** (Abstract class)
   - For ECS-based examples and games
   - Wraps `ECS.Engine`
   - Abstract: `load()`
   - Optional: `onDestroy()`

4. **`ThreeJSExample`** (Abstract class)
   - For Three.js examples
   - Wraps `THREE.WebGLRenderer`
   - Abstract: `load()`, `update(delta, absolute)`

### Build Workflow

1. **Development:**
   ```bash
   npm run generate-views  # Generate HTML files
   npm run dev            # Start dev server (Parcel)
   ```

2. **Production:**
   ```bash
   npm run generate-views  # Generate HTML files
   npm run build          # Build with Parcel
   # Post-build scripts: rename.js, fix-links.js
   ```

3. **Scripts:**
   - `generate-views.js` - Reads `examples-info.json` and creates HTML pages
   - `prebuild-project.js` - Pre-build setup (copies assets, etc.)
   - `rename.js` - Renames output files for deployment
   - `fix-links.js` - Fixes relative URLs in HTML

---

## 4. ECS Library Architecture

### Core Concepts

The `pixi-ecs` library implements the Entity-Component-System pattern integrated with PixiJS.

#### What is ECS?

**Entity-Component-System (ECS)** is an architectural pattern for game development:
- **Entity** - A container with a unique ID (game objects: player, enemy, bullet)
- **Component** - Pure data or behavior attached to entities (position, velocity, health)
- **System** - Logic that operates on entities with specific components (movement, rendering, collision)

### Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Engine                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │                      Scene                            │  │
│  │  ┌────────────────────────────────────────────────┐  │  │
│  │  │            Game Objects (Entities)             │  │  │
│  │  │  ┌──────────┐  ┌──────────┐  ┌──────────┐     │  │  │
│  │  │  │ Sprite   │  │Container │  │  Text    │     │  │  │
│  │  │  │          │  │          │  │          │     │  │  │
│  │  │  │ +Proxy   │  │ +Proxy   │  │ +Proxy   │     │  │  │
│  │  │  └────┬─────┘  └────┬─────┘  └────┬─────┘     │  │  │
│  │  │       │             │             │            │  │  │
│  │  │  ┌────▼─────────────▼─────────────▼─────┐     │  │  │
│  │  │  │       GameObjectProxy               │     │  │  │
│  │  │  │  - Components Map                   │     │  │  │
│  │  │  │  - Attributes Map                   │     │  │  │
│  │  │  │  - Tags Set                         │     │  │  │
│  │  │  │  - Flags BitArray                   │     │  │  │
│  │  │  │  - State ID                         │     │  │  │
│  │  │  └─────────────────────────────────────┘     │  │  │
│  │  └────────────────────────────────────────────────┘  │  │
│  │                                                       │  │
│  │  Message System (Pub/Sub)                            │  │
│  │  Lookup Indexes (Tags, Flags, States, Names)         │  │
│  │  Delayed Invocation Queue                            │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  Game Loop (requestAnimationFrame)                         │
└─────────────────────────────────────────────────────────────┘
```

### Core Classes

#### 1. Engine (`libs/pixi-ecs/engine/engine.ts`)

**Purpose:** Main entry point, wraps PixiJS Application, manages game loop.

**Key Properties:**
- `app: PIXI.Application` - PixiJS application instance
- `scene: Scene` - Current scene
- `config: EngineConfig` - Configuration

**Key Methods:**
- `init(canvas, config)` - Initialize engine with canvas and config
- `destroy()` - Cleanup all resources
- `loop()` - Main game loop (private, uses `requestAnimationFrame`)

**Engine Configuration:**
```typescript
interface EngineConfig {
  width?: number;              // Canvas width
  height?: number;             // Canvas height
  resolution?: number;         // Device pixel ratio
  backgroundColor?: number;    // Background color
  transparent?: boolean;       // Transparent canvas
  antialias?: boolean;         // Anti-aliasing
  resizeToScreen?: boolean;    // Auto-resize to screen
  speedMultiplier?: number;    // Game speed multiplier
  virtualWidth?: number;       // Virtual width (for scaling)
  virtualHeight?: number;      // Virtual height
  gameLoopType?: GameLoopType; // FIXED or VARIABLE timestep
  // ... and more PixiJS options
}
```

#### 2. Scene (`libs/pixi-ecs/engine/scene.ts`)

**Purpose:** Container for all game objects, manages components, messaging, and indexing.

**Key Properties:**
- `stage: Container` - Root container (extends PIXI.Container)
- `app: PIXI.Application` - Reference to PixiJS app
- `gameObjects: Map<id, Container>` - All game objects by ID
- `flags: LookupMap` - Index by flag
- `tags: LookupMap` - Index by tag
- `states: LookupMap` - Index by state
- `names: LookupMap` - Index by name
- `subscribers: LookupMap<action, Component[]>` - Message subscribers
- `globalAttributes: Map<string, any>` - Scene-level attributes
- `globalComponents: Component[]` - Scene-level components (systems)

**Key Methods - Object Registry:**
- `addGlobalObject(object)` - Add object to scene
- `removeGlobalObject(object)` - Remove object from scene
- `clearScene()` - Clear all objects

**Key Methods - Search:**
- `findObjectById(id): Container`
- `findObjectByName(name): Container`
- `findObjectsByName(name): Container[]`
- `findObjectByTag(tag): Container`
- `findObjectsByTag(tag): Container[]`
- `findObjectByFlag(flag): Container`
- `findObjectsByFlag(flag): Container[]`
- `findObjectByState(state): Container`
- `findObjectsByState(state): Container[]`
- `findObjectsByQuery(query: QueryCondition): Container[]`

**Key Methods - Messaging:**
- `sendMessage(action, component, data?, gameObject?, tagFilter?)`
- `subscribe(component, ...actions)`
- `unsubscribe(component, ...actions)`

**Key Methods - Delayed Execution:**
- `callWithDelay(delay, callback)` - Execute after delay (for safe scene modifications)

**Key Methods - Attributes:**
- `addGlobalAttribute(key, value)` - Add scene-level attribute
- `getGlobalAttribute<T>(key): T` - Get scene-level attribute

**Key Methods - Components:**
- `addGlobalComponent(component)` - Add scene-level component (system)
- `removeGlobalComponent(component)` - Remove scene-level component

#### 3. Component (`libs/pixi-ecs/engine/component.ts`)

**Purpose:** Base class for all behaviors. Components are attached to game objects.

**Component Lifecycle:**
```
NEW → INITIALIZED → RUNNING → (DETACHED) → FINISHED → REMOVED
```

**Component States:**
```typescript
enum ComponentState {
  NEW = 0,          // Just created
  INITIALIZED = 1,  // onInit() called
  RUNNING = 2,      // onAttach() called, updating
  DETACHED = 3,     // Temporarily detached
  FINISHED = 4,     // finish() called
  REMOVED = 5       // Removed from owner
}
```

**Lifecycle Methods:**
- `onInit()` - Called once after creation
- `onAttach()` - Called when added to scene
- `onUpdate(delta, absolute)` - Called every frame
- `onFixedUpdate(delta, absolute)` - Called at fixed frequency (if `fixedFrequency` set)
- `onMessage(msg: Message)` - Handle messages (if subscribed)
- `onDetach()` - Called before object detached
- `onRemove()` - Called before component removed
- `onFinish()` - Called after `finish()` is called

**Key Properties:**
- `id: number` - Unique component ID
- `owner: Container` - Parent game object
- `scene: Scene` - Scene reference
- `props: T` - Generic properties
- `fixedFrequency: number` - Fixed update frequency (Hz)
- `state: ComponentState` - Current lifecycle state

**Key Methods:**
- `finish()` - Mark component as finished (triggers onFinish, then removed)
- `subscribe(...actions)` - Subscribe to message actions
- `unsubscribe(...actions)` - Unsubscribe from actions
- `sendMessage(action, data?, tagFilter?)` - Send message to other components

**Example Component:**
```typescript
class HealthComponent extends ECS.Component {
  health = 100;

  onInit() {
    this.subscribe('TAKE_DAMAGE');
  }

  onUpdate(delta: number) {
    // Update logic every frame
  }

  onMessage(msg: ECS.Message) {
    if (msg.action === 'TAKE_DAMAGE') {
      this.health -= msg.data.amount;
      if (this.health <= 0) {
        this.sendMessage('DIED');
      }
    }
  }
}
```

#### 4. GameObject & GameObjectProxy

**GameObject Interface** (`libs/pixi-ecs/engine/game-object.ts`)

Defines the entity interface. All game objects implement this.

**Key Methods:**
- `addComponent(component)` / `removeComponent(component)`
- `getComponent<T>(clazz): T` / `getComponentByName<T>(name): T`
- `addAttribute(key, value)` / `getAttribute<T>(key): T` / `removeAttribute(key)`
- `assignAttribute(key, value)` - Update existing attribute
- `addTag(tag)` / `removeTag(tag)` / `hasTag(tag)`
- `setFlag(flag)` / `resetFlag(flag)` / `hasFlag(flag)` / `invertFlag(flag)`
- `stateId` - Get/set state ID

**GameObjectProxy** (`libs/pixi-ecs/engine/game-object-proxy.ts`)

**Purpose:** Proxy pattern - adds ECS features to PixiJS objects without modifying PixiJS classes.

**Key Properties:**
- `_id: number` - Unique object ID
- `_scene: Scene` - Scene reference
- `_pixiObj: PIXI.Container` - PixiJS object being wrapped
- `_components: Map<id, Component>` - Components
- `_attributes: Map<string, any>` - Attributes
- `_tags: Set<string>` - Tags
- `_flags: Flags` - Bit flags
- `_stateId: number` - State ID
- `_state: GameObjectState` - Object state (NEW, ATTACHED, DETACHED, DESTROYED)

**All PixiJS object wrappers** (Sprite, Container, Text, etc.) contain a `_proxy: GameObjectProxy` and delegate ECS methods to it.

#### 5. Game Object Types

All game objects extend PixiJS classes and implement the `GameObject` interface:

**In `libs/pixi-ecs/engine/game-objects/`:**
- **`Container`** - Base container (extends `PIXI.Container`)
- **`Sprite`** - Image sprite (extends `PIXI.Sprite`)
- **`AnimatedSprite`** - Animated sprite (extends `PIXI.AnimatedSprite`)
- **`Text`** - Text rendering (extends `PIXI.Text`)
- **`BitmapText`** - Bitmap font text (extends `PIXI.BitmapText`)
- **`Graphics`** - Drawing API (extends `PIXI.Graphics`)
- **`Mesh`** - Custom mesh (extends `PIXI.Mesh`)
- **`TilingSprite`** - Tiled sprite (extends `PIXI.TilingSprite`)
- **`ParticleContainer`** - Particle container (extends `PIXI.ParticleContainer`)
- **`SimpleMesh`** - Simple mesh (extends `PIXI.SimpleMesh`)
- **`SimplePlane`** - Simple plane (extends `PIXI.SimplePlane`)
- **`SimpleRope`** - Simple rope (extends `PIXI.SimpleRope`)
- **`NineSlicePlane`** - 9-slice plane (extends `PIXI.NineSlicePlane`)

**Pattern:** Each wrapper:
1. Extends PixiJS class
2. Implements `GameObject` interface
3. Contains `_proxy: GameObjectProxy`
4. Delegates ECS methods to proxy
5. Overrides `addChild`/`removeChild` to track hierarchy and auto-add to scene

#### 6. Builder Pattern (`libs/pixi-ecs/engine/builder.ts`)

**Purpose:** Fluent API for creating game objects.

**Example Usage:**
```typescript
const player = new ECS.Builder(scene)
  .withName('player')
  .asSprite(texture)
  .localPos(100, 200)
  .scale(2, 2)
  .anchor(0.5, 0.5)
  .withTag('player')
  .withFlag(PlayerFlags.ALIVE)
  .withState(PlayerStates.IDLE)
  .withAttribute('health', 100)
  .withComponent(new PlayerController())
  .build();
```

**Builder Methods:**

**Object Type:**
- `asContainer()` - Create Container
- `asSprite(texture)` - Create Sprite
- `asAnimatedSprite(textures)` - Create AnimatedSprite
- `asText(text, style)` - Create Text
- `asBitmapText(text, style)` - Create BitmapText
- `asGraphics()` - Create Graphics
- `asMesh(geometry, shader, state, drawMode)` - Create Mesh
- `asTilingSprite(texture, width, height)` - Create TilingSprite
- `asParticleContainer(maxSize, properties, batchSize)` - Create ParticleContainer
- `asNineSlicePlane(texture, leftWidth, topHeight, rightWidth, bottomHeight)` - Create NineSlicePlane

**Position & Transform:**
- `localPos(x, y)` - Set position relative to parent
- `globalPos(x, y)` - Set position in world space
- `relativePos(x, y)` - Set position relative to parent (0-1)
- `scale(x, y?)` - Set scale
- `anchor(x, y)` - Set anchor (Sprite/Text)
- `virtualAnchor(x, y)` - Set anchor for virtual coordinates
- `rotation(angle)` - Set rotation

**Metadata:**
- `withName(name)` - Set name
- `withTag(tag)` - Add tag
- `withFlag(flag)` - Set flag
- `withState(state)` - Set state

**Components & Attributes:**
- `withComponent(component)` - Add component
- `withComponents(...components)` - Add multiple components
- `withAttribute(key, value)` - Add attribute

**Hierarchy:**
- `withParent(parent)` - Set parent
- `withChild(builder)` - Add child (another builder)

**Build:**
- `build(): T` - Build and return the game object

#### 7. Message System (`libs/pixi-ecs/engine/message.ts`)

**Purpose:** Pub/sub messaging for component communication.

**Message Class:**
```typescript
class Message {
  action: string;              // Message identifier
  component: Component;        // Sender
  gameObject: Container;       // Associated object
  data: any;                   // Payload
  expired: boolean;            // Stop propagation flag
  responses: MessageResponses; // Collected responses
}
```

**Message Flow:**
1. Component calls `sendMessage(action, data, tagFilter?)`
2. Scene finds all subscribers for that action
3. Each subscriber's `onMessage(msg)` is called
4. Responses collected in `msg.responses`
5. Special: Subscribers to `Messages.ANY` receive all messages

**Built-in Message Types** (`libs/pixi-ecs/engine/constants.ts`):
- `OBJECT_ADDED` - Object added to scene
- `OBJECT_REMOVED` - Object removed from scene
- `COMPONENT_ADDED` - Component added
- `COMPONENT_DETACHED` - Component detached
- `COMPONENT_REMOVED` - Component removed
- `ATTRIBUTE_ADDED` - Attribute added
- `ATTRIBUTE_CHANGED` - Attribute changed
- `ATTRIBUTE_REMOVED` - Attribute removed
- `STATE_CHANGED` - State changed
- `FLAG_CHANGED` - Flag changed
- `TAG_ADDED` - Tag added
- `TAG_REMOVED` - Tag removed
- `SCENE_CLEAR` - Scene cleared

**Example:**
```typescript
// Component A subscribes
class DamageReceiver extends ECS.Component {
  onInit() {
    this.subscribe('TAKE_DAMAGE');
  }

  onMessage(msg: ECS.Message) {
    if (msg.action === 'TAKE_DAMAGE') {
      const damage = msg.data.amount;
      // Apply damage
    }
  }
}

// Component B sends message
class Weapon extends ECS.Component {
  attack(target: ECS.Container) {
    this.sendMessage('TAKE_DAMAGE', { amount: 10 });
  }
}
```

### Built-in Components

#### 1. FuncComponent (`libs/pixi-ecs/components/func-component.ts`)

**Purpose:** Declarative component builder using functional approach.

**Example:**
```typescript
const mover = new ECS.FuncComponent('Mover')
  .doOnInit((cmp) => {
    cmp.owner.addAttribute('velocity', new ECS.Vector(1, 0));
  })
  .doOnUpdate((cmp, delta, absolute) => {
    const vel = cmp.owner.getAttribute<ECS.Vector>('velocity');
    cmp.owner.position.x += vel.x * delta;
  })
  .doOnMessage('STOP', (cmp, msg) => {
    cmp.owner.getAttribute<ECS.Vector>('velocity').x = 0;
  })
  .doOnMessageOnce('JUMP', (cmp, msg) => {
    // Handle once, then unsubscribe
  })
  .setFixedFrequency(60) // Update at 60 Hz
  .setDuration(5000);    // Auto-finish after 5 seconds
```

**Methods:**
- `doOnInit(func)` - Set onInit handler
- `doOnUpdate(func)` - Set onUpdate handler
- `doOnFixedUpdate(func)` - Set onFixedUpdate handler
- `doOnAttach(func)` - Set onAttach handler
- `doOnDetach(func)` - Set onDetach handler
- `doOnRemove(func)` - Set onRemove handler
- `doOnFinish(func)` - Set onFinish handler
- `doOnMessage(action, func)` - Add message handler
- `doOnMessageOnce(action, func)` - Add one-time message handler
- `setFixedFrequency(hz)` - Set fixed update frequency
- `setDuration(ms)` - Auto-finish after duration

#### 2. ChainComponent (`libs/pixi-ecs/components/chain-component.ts`)

**Purpose:** Chain-of-commands for sequential behaviors.

**Example:**
```typescript
const chain = new ECS.ChainComponent()
  .call(() => console.log('Start'))
  .waitTime(1000)              // Wait 1 second
  .call(() => console.log('After 1s'))
  .waitFrames(60)              // Wait 60 frames
  .waitUntil(() => condition)  // Wait until condition
  .waitForMessage('READY')     // Wait for message
  .beginRepeat(5)              // Repeat 5 times
    .call(() => console.log('Repeated'))
    .waitTime(500)
  .endRepeat()
  .beginIf(() => health > 0)   // Conditional
    .call(() => console.log('Alive'))
  .else()
    .call(() => console.log('Dead'))
  .endIf()
  .executeUpon(gameObject);    // Execute on object
```

**Control Flow Commands:**
- `call(func)` - Execute function
- `waitTime(ms)` - Wait milliseconds
- `waitFrames(frames)` - Wait frames
- `waitUntil(condition)` - Wait until condition true
- `waitForMessage(action)` - Wait for message
- `waitFor(cmp => boolean)` - Wait for custom condition
- `beginRepeat(count)` / `endRepeat()` - Repeat block
- `beginWhile(condition)` / `endWhile()` - While loop
- `beginIf(condition)` / `else()` / `endIf()` - Conditional
- `beginInterval(delay)` / `endInterval()` - Interval loop
- `addComponent(component)` - Add component to owner
- `removeComponent(component)` - Remove component from owner
- `detachGameObject(object?)` - Detach object
- `destroyGameObject(object?)` - Destroy object
- `detachGameObjectsByQuery(query)` - Detach objects by query

**Execution:**
- `execute()` - Start chain
- `executeUpon(gameObject)` - Execute on object
- `setFrequency(hz)` - Set update frequency

#### 3. KeyInputComponent (`libs/pixi-ecs/components/key-input-component.ts`)

**Purpose:** Keyboard input handling.

**Usage:**
```typescript
const keyInput = new ECS.KeyInputComponent();
scene.addGlobalComponent(keyInput);

// In another component:
const keyInput = this.scene.getGlobalAttribute<KeyInputComponent>('key_input');
if (keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) {
  // Move left
}
keyInput.handleKey(ECS.Keys.KEY_LEFT); // Mark as handled
```

**Methods:**
- `isKeyPressed(keyCode, includeHandled?)` - Check if key pressed
- `handleKey(keyCode)` - Mark key as handled (prevents repeat processing)

**Key Codes:** `ECS.Keys` enum (KEY_LEFT, KEY_RIGHT, KEY_UP, KEY_DOWN, KEY_SPACE, etc.)

#### 4. PointerInputComponent (`libs/pixi-ecs/components/pointer-input-component.ts`)

**Purpose:** Touch/mouse input handling. Converts events to messages.

**Messages:**
- `POINTER_TAP` - Tap/click
- `POINTER_DOWN` - Pointer down
- `POINTER_OVER` - Pointer over
- `POINTER_RELEASE` - Pointer release

**Usage:**
```typescript
const pointerInput = new ECS.PointerInputComponent();
scene.addGlobalComponent(pointerInput);

class MyComponent extends ECS.Component {
  onInit() {
    this.subscribe(ECS.PointerMessages.POINTER_TAP);
  }

  onMessage(msg: ECS.Message) {
    if (msg.action === ECS.PointerMessages.POINTER_TAP) {
      const pos = msg.data.position;
      // Handle tap
    }
  }
}
```

#### 5. VirtualGamepadComponent (`libs/pixi-ecs/components/virtual-gamepad-component.ts`)

**Purpose:** Virtual gamepad for mobile devices. Maps buttons to key codes.

**Usage:**
```typescript
const gamepad = new ECS.VirtualGamepadComponent({
  [ECS.GamepadButtons.UP]: ECS.Keys.KEY_UP,
  [ECS.GamepadButtons.DOWN]: ECS.Keys.KEY_DOWN,
  [ECS.GamepadButtons.LEFT]: ECS.Keys.KEY_LEFT,
  [ECS.GamepadButtons.RIGHT]: ECS.Keys.KEY_RIGHT,
  [ECS.GamepadButtons.A]: ECS.Keys.KEY_SPACE,
});
scene.addGlobalComponent(gamepad);
```

#### 6. DebugComponent (`libs/pixi-ecs/components/debug-component.ts`)

**Purpose:** Debug visualization - scene graph, message log, component inspection.

**Enable:** 
- Via config: `debugEnabled: true`
- Or URL param: `?debug`

### Utilities

#### 1. Flags (`libs/pixi-ecs/utils/flags.ts`)

**Purpose:** Efficient bit-flag system (flags 1-128).

**Usage:**
```typescript
const flags = new ECS.Flags();
flags.setFlag(1);
flags.hasFlag(1); // true
flags.resetFlag(1);
flags.invertFlag(1);
```

**On Game Objects:**
```typescript
object.setFlag(PlayerFlags.ALIVE);
if (object.hasFlag(PlayerFlags.ALIVE)) {
  // ...
}
```

#### 2. Vector (`libs/pixi-ecs/utils/vector.ts`)

**Purpose:** Immutable 2D vector math.

**Operations:**
```typescript
const v1 = new ECS.Vector(1, 2);
const v2 = new ECS.Vector(3, 4);

v1.add(v2);           // Vector(4, 6)
v1.subtract(v2);      // Vector(-2, -2)
v1.multiply(2);       // Vector(2, 4)
v1.distance(v2);      // Euclidean distance
v1.magnitude();       // Length
v1.normalize();       // Unit vector
v1.angle();           // Angle in radians
v1.dot(v2);           // Dot product
v1.limit(5);          // Limit magnitude
```

#### 3. LookupMap (`libs/pixi-ecs/utils/lookup-map.ts`)

**Purpose:** Multi-key lookup structure (one key → many values). Used internally for indexing.

#### 4. QueryCondition (`libs/pixi-ecs/utils/query-condition.ts`)

**Purpose:** Query builder for object search.

**Usage:**
```typescript
const enemies = scene.findObjectsByQuery({
  ownerTag: 'enemy',
  ownerState: EnemyStates.ACTIVE,
  ownerFlag: EnemyFlags.AGGRESSIVE
});
```

### Design Patterns Used in ECS Library

1. **Proxy Pattern** - `GameObjectProxy` adds ECS features to PixiJS objects
2. **Builder Pattern** - `Builder` for fluent object creation
3. **Component Pattern** - ECS implementation
4. **Observer Pattern** - Messaging system
5. **Chain of Responsibility** - `ChainComponent` for sequential behaviors
6. **Factory Pattern** - Builder can use component factories
7. **Strategy Pattern** - Configurable search/indexing systems

---

## 5. Game Architecture Patterns

All three games follow similar architectural patterns while using the ECS library:

### Common Patterns

#### 1. Component-Based Architecture

Games separate concerns into components:
- **Controllers** - Handle input and control flow
- **Renderers** - Handle visual rendering
- **Sound** - Handle audio
- **Game Logic** - Handle game rules and state

#### 2. State Management

Games use observable state objects that send ECS messages on changes:
- **Observable Pattern** - State objects extend a base that sends messages
- **Message-Driven Updates** - Components subscribe to state changes
- **Centralized State** - Single source of truth for game state

#### 3. Factory Pattern

Games use factory classes to create levels/scenes:
- **Scene Factory** - Creates all entities for a scene
- **Entity Builders** - Reusable functions to create specific entities
- **Level Loading** - Loads data and creates corresponding entities

#### 4. Asset Loading Pattern

All games follow this flow:
```typescript
class Game extends ECSExample {
  load() {
    // Load assets (textures, sounds, fonts)
    PIXI.Loader.shared
      .add('spritesheet', 'path/to/sheet.png')
      .add('levels', 'path/to/levels.txt')
      .load(() => this.onAssetsLoaded());
  }

  onAssetsLoaded() {
    // Parse data
    // Create initial scene
    // Start game
  }
}
```

#### 5. Scene Transition Pattern

Games transition between scenes (intro, level select, gameplay, game over):
```typescript
class Factory {
  loadIntro() {
    scene.clearScene();
    // Create intro entities
  }

  loadGame() {
    scene.clearScene();
    // Create game entities
  }
}
```

#### 6. Collision Detection Pattern

Games implement collision detection differently:
- **Tetris** - Grid-based collision (array lookups)
- **Vlak** - Grid-based movement validation
- **Block Breaker** - AABB (Axis-Aligned Bounding Box) collision

#### 7. Fixed Timestep Pattern

Games use `fixedFrequency` on components for consistent behavior:
```typescript
class GameController extends ECS.Component {
  constructor() {
    super();
    this.fixedFrequency = 3; // Update at 3 Hz
  }

  onFixedUpdate(delta: number) {
    // Consistent game logic regardless of frame rate
  }
}
```

---

## 6. Game Implementations

### 6.1 Tetris

**Directory:** `src/game_tetris/` (15 files)

#### Architecture Overview

```
Tetris (extends ECSExample)
  ├── Factory (scene management)
  │     ├── loadIntro() → IntroComponent
  │     ├── loadLevelSelector() → LevelSelector
  │     ├── loadGame() → GameController + GameRenderer + SoundComponent
  │     └── loadHighScoreSaver() → HighScoreSaver
  ├── Model (game logic)
  │     ├── GameModel (board state, tetromino logic)
  │     ├── Tetrominos (shape definitions)
  │     ├── ShapeGenerator (random generation)
  │     └── ScoreCounter (scoring)
  ├── Components (ECS components)
  │     ├── GameKeyboardController (input + game control)
  │     ├── GameRenderer (rendering)
  │     ├── SoundComponent (audio)
  │     ├── IntroComponent (intro screen)
  │     ├── LevelSelector (level selection)
  │     └── HighScoreSaver (high scores)
  └── CLI Renderer (retro rendering)
        ├── CLIRendererBase (abstract)
        └── CLISpriteRenderer (sprite-based CLI)
```

#### Key Files

**`index.ts`** - Main entry point
- Extends `ECSExample`
- Loads assets (fonts, sounds)
- Configures PIXI (NEAREST scaling, rounded pixels)
- Creates `Factory` and loads intro

**`factory.ts`** - Scene factory
- `loadIntro()` - Intro screen with animation
- `loadLevelSelector()` - Level selection (0-9)
- `loadGame(level)` - Main game
- `loadHighScoreSaver(score)` - High score screen
- `buildGlobalDefaults()` - Sets up CLI renderer and key input

**`model/game-model.ts`** - Core game logic
- Board: 10×22 grid (20 visible + 2 extra for rotation)
- 1D array representation: `gameBoard[row * columns + col]`
- Cell types: EMPTY (0), PLACED (1), PLAYER (2)
- Current tetromino: `MovingShape` object
- Methods: `moveTetromino()`, `rotate()`, `applyTetromino()`, `findFullRows()`, `removeRows()`

**`model/tetrominos.ts`** - Tetromino shapes
- 7 shapes: TRI, LTETR, RTETR, SKEWL, SKEWR, SQUARE, STRAIGHT
- Each has 2D array data and rotation offsets
- 4 rotations: TOP, RIGHT, BOTTOM, LEFT

**`components/game-controller.ts`** - Input and game control
- Extends base `GameController`
- Handles keyboard input (LEFT, RIGHT, DOWN, A/S for rotate, SPACE)
- Manages timing: auto-fall, movement delays, soft drop
- Fixed frequency: 60 Hz
- Timing system: `TimeWatcher` for delays
- Movement validation before applying
- Spawns new tetrominoes

**`components/game-renderer.ts`** - Visual rendering
- Renders board, stats, UI panels
- Animations: game init, row clear, game over
- Uses `CLISpriteRenderer` for retro look
- Updates display each frame
- Box drawing with Unicode characters

**`components/sound-component.ts`** - Audio
- Subscribes to game messages
- Plays sounds for: rotate, place, row clear, level up, game over, soft drop
- Background music loop

**`cli-renderer/cli-sprite-renderer.ts`** - CLI-style renderer
- Grid: 80 columns × 25 rows
- Sprite-based: each cell is a sprite from bitmap font
- Two layers: text + highlights
- CGA color palette
- Box drawing characters

#### Game State Flow

```
Intro (IntroComponent)
  → Level Selection (LevelSelector)
    → Game (GameController + GameRenderer + SoundComponent)
      → Game Over
        → High Scores (HighScoreSaver)
          → Intro
```

#### Core Mechanics

**Tetromino System:**
- 7 shapes with 4 rotations each
- Rotation uses matrix transposition + offsets
- Offsets keep visual position consistent

**Movement:**
- Auto-fall: Speed increases with level
- Manual movement: LEFT/RIGHT with delays (200ms first, 50ms subsequent)
- Soft drop: DOWN key (30ms delay, extra score)

**Collision:**
- Grid-based: Check board array for collisions
- Extra rows system: 2 rows above visible area for rotation space

**Scoring:**
- Tetromino placement: base score + soft drop bonus
- Line clears:
  - 1 line: 40 × (level + 1)
  - 2 lines: 100 × (level + 1)
  - 3 lines: 300 × (level + 1)
  - 4 lines: 1200 × (level + 1)

**Level Progression:**
- +1 level every 20 tetrominoes
- Max level: 10
- Speed multiplier: level × 0.6 + 1

**Animations:**
- Game init: Fill board with `#`, clear row by row
- Row clear: Clear from center outward (blocks input)
- Game over: Fill board with `#` row by row

#### Messages

```typescript
enum Messages {
  CONTROLLER_BLOCK,    // Block user input
  CONTROLLER_RUN,      // Unblock user input
  ROW_CLEARED,         // Row cleared (data: row indices)
  GAME_OVER,           // Game ended
  LEVEL_UP,            // Level increased
  MOVE_DOWN_BEGIN,     // Player holding DOWN
  MOVE_DOWN_END,       // Player released DOWN
  TETROMINO_PLACED,    // Tetromino placed
  TETROMINO_ROTATED    // Tetromino rotated
}
```

### 6.2 Vlak (Train)

**Directory:** `src/game_vlak/` (25 files)

#### Architecture Overview

```
Vlak (extends ECSExample)
  ├── Loaders (asset/level loading)
  │     ├── GameLoader (initial loading)
  │     ├── LevelFactory (scene creation)
  │     └── LevelParser (level parsing)
  ├── Model (data structures)
  │     ├── GameData (all levels + intro)
  │     ├── LevelData (single level)
  │     ├── GameState (overall state)
  │     ├── LevelState (current level)
  │     ├── TrainState (train state)
  │     └── CarState (railcar state)
  ├── Components (ECS components)
  │     ├── TrainController (base controller)
  │     ├── TrainKeyboardController (keyboard input)
  │     ├── TrainIntroController (intro animation)
  │     ├── TrainSyncComponent (train sprite sync)
  │     ├── RailcarSyncComponent (car sprite sync)
  │     ├── CompletionChecker (level completion)
  │     ├── ScoreCounter (score tracking)
  │     ├── SoundComponent (audio)
  │     ├── PasswordComponent (password input)
  │     └── WaitInputComponent (wait for input)
  ├── Animators (animation components)
  │     ├── ItemAnimator (item animation)
  │     ├── DoorAnimator (door animation)
  │     ├── TrainCrashAnimator (crash animation)
  │     └── WallfadeAnimator (screen transition)
  ├── Actions (ChainComponent sequences)
  │     ├── loadIntro()
  │     ├── loadNextLevel()
  │     ├── completeLevel()
  │     ├── openDoor()
  │     ├── moveTrain()
  │     └── crashTrain()
  ├── Builders (entity builders)
  │     ├── trainBuilder()
  │     ├── tilesBuilder()
  │     ├── levelTextsBuilder()
  │     └── ...
  └── Helpers & Selectors
        ├── helpers.ts (utility functions)
        └── selectors.ts (state selectors)
```

#### Key Files

**`index.ts`** - Main entry point
- Extends `ECSExample`
- Pixel art settings (NEAREST, rounded pixels)
- Initializes `GameLoader`

**`loaders/game-loader.ts`** - Initial loading
- Loads spritesheet, font, levels.txt, sounds
- Parses levels with `LevelParser`
- Creates `GameState` and `GameData`
- Starts intro

**`loaders/level-parser.ts`** - Level parsing
- Text format: `:levelname` followed by character grid
- Character mapping:
  - `0` = empty
  - `1` = wall
  - `2` = door
  - `A`-`S` = items (19 types)
  - `V` = train start position
- Creates `LevelData` objects

**`loaders/level-factory.ts`** - Scene creation
- `loadLevel(index)` - Load level by index
- `reloadLevel()` - Restart current level
- `loadIntro()` - Load intro animation
- `loadLevelContent()` - Create all entities
- Uses `builders` to create entities

**`model/state-structs.ts`** - State classes
- `ObservableState` - Base class, sends messages on changes
- `TrainState` - Train position, direction, cars, crashed flag
- `CarState` - Railcar position and item type
- `LevelState` - Current level, items, door status
- `GameState` - Current level, score, pause

**`model/game-structs.ts`** - Data structures
- `ObjectTypes` enum - 22 types (EMPTY, WALL, DOOR, 19 items)
- `MapObject` - Represents a map cell
- `MapPosition` - Position with direction
- `LevelData` - Static level definition
- `GameData` - All game data

**`components/train-controller.ts`** - Base train controller
- Fixed frequency: 3 Hz
- Direction queue
- Movement logic
- Prevents opposite direction when cars exist

**`components/train-keyboard-controller.ts`** - Keyboard controller
- Extends `TrainController`
- Reads arrow keys
- Queues directions
- Activates on first input

**`components/train-sync-component.ts`** - Train sprite sync
- Syncs train sprite with `TrainState`
- Animates wheels (3 frames)
- Updates sprite direction
- Fixed frequency: 10 Hz

**`components/railcar-sync-component.ts`** - Railcar sprite sync
- Syncs railcar sprites with `CarState`
- Listens to `STATE_CHANGE_TRAIN_POSITION`
- Updates position and direction

**`components/completion-checker.ts`** - Level completion
- Monitors item collection
- Opens door when all items collected
- Triggers level completion when train reaches open door

**`actions.ts`** - ChainComponent sequences
- `moveTrain()` - Core movement logic:
  - Check collision (walls, closed door, self)
  - Pick up items
  - Add cars to train
  - Update positions
  - Trigger crash on collision
- `crashTrain()` - Crash animation and reload
- `openDoor()` - Door opening animation
- `completeLevel()` - Level complete and transition
- `loadNextLevel()` - Fade and load next
- `wallFade()` - Screen transition

**`builders.ts`** - Entity builders
- `trainBuilder()` - Create train entity
- `trainCarBuilder()` - Create railcar entity
- `tilesBuilder()` - Create all level tiles
- `levelTextsBuilder()` - Create UI text
- `keyboardBuilder()` - Create keyboard/gamepad input

#### Game State Flow

```
Asset Loading (GameLoader)
  → Intro (TrainIntroController)
    → Wait for Input
      → Level Loading (LevelFactory)
        → Show Level Name
          → Wait for Input
            → Fade Transition
              → Gameplay (TrainKeyboardController)
                → [Collision] → Crash → Reload Level
                → [All Items] → Door Opens
                  → [Reach Door] → Level Complete
                    → Next Level or End Game
```

#### Core Mechanics

**Movement:**
- Grid-based (16×16 cells)
- Fixed frequency: 3 Hz
- Direction queue for smooth turns
- Cannot reverse if cars exist

**Item Collection:**
- 19 item types (DIAMOND, CROWN, TREE, etc.)
- Each item adds a car to train
- Score +10 per item
- Items animate (3 frames)

**Collision:**
- Grid-based validation
- Walls: Crash
- Closed doors: Crash
- Self-collision: Crash if not tail
- Open doors: Pass through

**Level Completion:**
- Collect all items → Door opens
- Reach open door → Level complete
- Transition to next level
- Final level → End screen

**Password System:**
- Press `H` to enter password mode
- Type level name to skip to that level
- Pauses game during input
- ESC to cancel

**Crash Handling:**
- Crash animation (10 frames)
- 2 second delay
- Reload level
- Score resets to `initScore`

#### Messages

```typescript
enum Messages {
  LEVEL_COMPLETED,
  STATE_CHANGE_LEVEL,
  STATE_CHANGE_INIT_SCORE,
  STATE_CHANGE_CURRENT_SCORE,
  STATE_CHANGE_PAUSED,
  STATE_CHANGE_TRAIN_CRASHED,
  STATE_CHANGE_TRAIN_POSITION,
  STATE_CHANGE_TRAIN_DIRECTION,
  STATE_CHANGE_ITEM_PICKED,
  STATE_CHANGE_DOOR_OPEN
}
```

### 6.3 Block Breaker

**Directory:** `src/game_blockbreaker/` (10 files)

#### Architecture Overview

```
BlockBreaker (extends ECSExample)
  ├── Factory (entity creation)
  │     └── loadLevel(levelData)
  ├── Model (level data)
  │     ├── Level (level model)
  │     └── LevelParser (text parsing)
  ├── Components (ECS components)
  │     ├── BallController (ball state + movement)
  │     ├── PaddleKeyboardController (paddle input)
  │     ├── BallCollisionTrigger (collision detection)
  │     ├── BallCollisionResolver (collision response)
  │     └── GameManager (game rules)
  └── Constants
        ├── Tags (BRICK, BALL, PADDLE)
        ├── Messages (BALL_ATTACH, BALL_RELEASE, BALL_COLLIDED)
        ├── BallStates (ATTACHED, RELEASED)
        └── CollisionTypes (SOLID_OBJECT, BORDER, BOTTOM)
```

#### Key Files

**`block-breaker.ts`** - Main entry point
- Extends `ECSExample`
- Loads spritesheet and levels.txt
- Parses levels with `LevelParser`
- Creates first level with `Factory`

**`level-parser.ts`** - Level parsing
- Text format: `:levelname` followed by rows of digits
- Digits `0`-`9` = brick types
- `-` = empty space
- Creates `Level` objects

**`level.ts`** - Level model
- Grid-based layout (columns × rows)
- Brick indices in 1D array
- Index mapping: `index = columns * row + column`

**`factory.ts`** - Entity factory
- `loadLevel(levelData)` - Creates all entities:
  - Bricks container
  - KeyInputComponent (global)
  - Brick sprites from level data
  - Paddle sprite with `PaddleKeyboardController`
  - Ball sprite with `BallController`
  - Global components: `BallCollisionTrigger`, `BallCollisionResolver`, `GameManager`
  - Sends `BALL_ATTACH` to start

**`ball-controller.ts`** - Ball state and movement
- Two states: `ATTACHED` (follows paddle), `RELEASED` (moves independently)
- Subscribes: `BALL_ATTACH`, `BALL_RELEASE`
- Attached: Keeps ball aligned with paddle
- Released: Updates position based on velocity
- Velocity stored as attribute (`Attrs.VELOCITY`)

**`paddle-controller.ts`** - Paddle movement
- Reads keyboard input (LEFT, RIGHT, SPACE)
- Moves paddle with boundary checking
- Releases ball with SPACE (sends `BALL_RELEASE`)

**`ball-collision-trigger.ts`** - Collision detection
- Global component (system)
- Checks every frame:
  - Ball vs bricks (all with tag `Tags.BRICK`)
  - Ball vs paddle (tag `Tags.PADDLE`)
  - Ball vs screen borders (left, right, top)
  - Ball vs bottom (game over)
- AABB collision detection
- Calculates intersection depths
- Sends `BALL_COLLIDED` messages with collision data

**`ball-collision-resolver.ts`** - Collision response
- Subscribes: `BALL_COLLIDED`
- Reflects velocity based on collision:
  - Bricks: Reflect on axis with larger intersection
  - Paddle: Adjust angle based on hit position
  - Borders: Reflect on appropriate axis
- Updates ball's velocity attribute

**`game-manager.ts`** - Game rules
- Subscribes: `BALL_COLLIDED`
- Brick collision: Destroy brick sprite
- Bottom collision: Reset ball to attached state
- TODO: Lives, score, animations

#### Game State Flow

```
Asset Loading
  → Level Parsing
    → Create Level (Factory)
      → Ball Attached to Paddle
        → [SPACE] → Ball Released
          → [Collision with Brick] → Destroy Brick
          → [Collision with Paddle] → Reflect
          → [Collision with Border] → Reflect
          → [Collision with Bottom] → Reset Ball
```

#### Core Mechanics

**Ball Physics:**
- Constant speed: 0.1
- Velocity: Normalized vector × speed
- Movement: `position += delta * velocity * 0.04`

**Paddle:**
- Horizontal movement only
- Speed: `delta * 0.01`
- Boundary checking

**Ball Release:**
- Initial velocity from paddle position
- `diffX = ball.x - paddle.x` (horizontal offset)
- `diffY = -releaseSpeed` (always upward)
- Normalize and scale to `releaseSpeed`

**Collision Detection:**
- AABB (Axis-Aligned Bounding Box)
- Intersection depth: How much shapes overlap
- Horizontal depth: `min(right1, right2) - max(left1, left2)`
- Vertical depth: `min(bottom1, bottom2) - max(top1, top2)`

**Collision Response:**
- Compare horizontal vs vertical intersection
- Larger intersection → reflect on that axis
- Paddle special: Adjust angle based on hit position
  - Left of center: Increase leftward angle
  - Right of center: Increase rightward angle

**Brick Destruction:**
- Immediate destruction on collision
- Sprite removed from scene
- TODO: Score, animations, power-ups

**Ball Loss:**
- Ball falls below screen
- Reset to `ATTACHED` state
- TODO: Life lost, game over

#### Messages

```typescript
enum Messages {
  BALL_ATTACH,    // Attach ball to paddle
  BALL_RELEASE,   // Release ball
  BALL_COLLIDED   // Collision detected (with payload)
}
```

**Collision Payload:**
```typescript
{
  type: CollisionTypes,  // SOLID_OBJECT, BORDER, BOTTOM
  object?: Container,    // Collided object (brick/paddle)
  horizontalIntersection: number,
  verticalIntersection: number
}
```

---

## 7. Build System

### Build Tools

**Parcel v2.9.3** - Zero-config bundler
- Handles TypeScript compilation
- Bundles for production
- Dev server with hot reload
- Asset processing (images, sounds)

### NPM Scripts

**Development:**
```bash
npm run dev
```
- Runs `prebuild-project.js` (setup)
- Starts Parcel dev server
- Hot reload on changes
- Access at `localhost:1234/index.html`

**Production Build:**
```bash
npm run build
```
- Runs `generate-views` (create HTML files)
- Runs `prebuild-project` (setup)
- Builds with Parcel to `build/` directory
- No source maps, no content hash
- Runs post-build scripts:
  - `rename.js` - Rename output files
  - `fix-links.js` - Fix relative URLs

**Other Scripts:**
```bash
npm run lint            # Run ESLint
npm run compile-test    # TypeScript type checking (no emit)
npm run generate-views  # Generate HTML from examples-info.json
```

### Build Configuration

**`tsconfig.json`:**
```json
{
  "compilerOptions": {
    "target": "es2017",
    "module": "esnext",
    "moduleResolution": "node",
    "outDir": "./build",
    "lib": ["es6", "dom"],
    "skipLibCheck": true,
    "allowSyntheticDefaultImports": true,
    "downlevelIteration": true
  },
  "include": ["./src/**/*.ts", "./libs/**/*.ts"],
  "exclude": ["./node_modules", "./scripts"]
}
```

**`package.json` (Parcel config):**
```json
{
  "parcel-namer-rewrite": {
    "chain": "@parcel/namer-default",
    "hashing": "never",
    "rules": {
      "src/examples.ts": "examples.js"
    }
  }
}
```

### Build Scripts

**`scripts/generate-views.js`:**
- Reads `examples-info.json`
- Generates HTML files from templates
- Creates index.html (list of examples)
- Creates example pages (individual examples)

**`scripts/prebuild-project.js`:**
- Pre-build setup (TODO: likely copies assets)

**`scripts/rename.js`:**
- Post-build file renaming for deployment

**`scripts/fix-links.js`:**
- Fixes relative URLs in HTML for deployment

### Asset Management

**Asset Locations:**
- Game assets typically in game directories
- Shared assets in `src/` or `assets/` (if exists)
- PixiJS Loader used for runtime loading

**Asset Loading Pattern:**
```typescript
PIXI.Loader.shared
  .add('spritesheet', 'path/to/sheet.png')
  .add('font', 'path/to/font.xml')
  .add('sound', 'path/to/sound.mp3')
  .load(() => {
    // Assets loaded, start game
  });
```

---

## 8. Development Guidelines

### Code Organization

#### 1. File Naming
- **PascalCase** for classes: `GameController.ts`, `TrainState.ts`
- **kebab-case** for files: `game-controller.ts`, `train-state.ts`
- **Index files** for entry points: `index.ts`

#### 2. Directory Structure
- **`components/`** - ECS components (behaviors)
- **`model/`** - Data structures and game logic
- **`loaders/`** - Asset and level loading
- **`builders.ts`** or **`builders/`** - Entity creation functions
- **`factory.ts`** - Scene factory (creates scenes/levels)
- **`actions.ts`** - ChainComponent action sequences
- **`constants.ts`** - Enums, constants, messages
- **`helpers.ts`** - Utility functions
- **`selectors.ts`** - State selectors (if applicable)

#### 3. Component Design

**Base Component Template:**
```typescript
import * as ECS from '../../../libs/pixi-ecs';

export class MyComponent extends ECS.Component {
  // Properties
  private myProperty: number = 0;

  constructor() {
    super();
    // Set fixed frequency if needed
    // this.fixedFrequency = 60;
  }

  onInit() {
    // Initialize once
    this.subscribe('MY_MESSAGE');
  }

  onAttach() {
    // Called when added to scene
  }

  onUpdate(delta: number, absolute: number) {
    // Update every frame
  }

  onFixedUpdate(delta: number, absolute: number) {
    // Update at fixed frequency (if fixedFrequency set)
  }

  onMessage(msg: ECS.Message) {
    // Handle messages
    if (msg.action === 'MY_MESSAGE') {
      // Handle
    }
  }

  onDetach() {
    // Called before detached
  }

  onRemove() {
    // Called before removed
  }
}
```

#### 4. State Management Pattern

**Observable State:**
```typescript
import * as ECS from '../../../libs/pixi-ecs';

class ObservableState {
  protected scene: ECS.Scene;

  constructor(scene: ECS.Scene) {
    this.scene = scene;
  }

  protected sendStateChange(action: string, data?: any) {
    this.scene.sendMessage(action, null, data);
  }
}

class GameState extends ObservableState {
  private _score: number = 0;

  get score() { return this._score; }

  set score(value: number) {
    const oldValue = this._score;
    this._score = value;
    if (oldValue !== value) {
      this.sendStateChange('STATE_CHANGE_SCORE', { score: value });
    }
  }
}
```

#### 5. Factory Pattern

**Scene Factory:**
```typescript
export class Factory {
  private scene: ECS.Scene;
  private gameState: GameState;

  constructor(scene: ECS.Scene, gameState: GameState) {
    this.scene = scene;
    this.gameState = gameState;
  }

  loadLevel(levelData: LevelData) {
    // Clear previous scene
    this.scene.clearScene();

    // Create entities
    this.createBackground();
    this.createPlayer();
    this.createEnemies(levelData);
    this.createUI();

    // Add global components (systems)
    this.scene.addGlobalComponent(new CollisionSystem());
  }

  private createPlayer() {
    const player = new ECS.Builder(this.scene)
      .withName('player')
      .asSprite(texture)
      .localPos(100, 100)
      .withTag('player')
      .withComponent(new PlayerController())
      .build();

    return player;
  }
}
```

#### 6. Action Sequences

**ChainComponent Actions:**
```typescript
export function movePlayer(player: ECS.Container, target: Vector) {
  const chain = new ECS.ChainComponent();
  chain
    .call(() => {
      // Start movement
    })
    .waitTime(1000)
    .call(() => {
      // Finish movement
    })
    .executeUpon(player);
}

export function levelCompleteSequence(scene: ECS.Scene, factory: Factory) {
  const chain = new ECS.ChainComponent();
  chain
    .call(() => scene.sendMessage('LEVEL_COMPLETED'))
    .waitTime(2000)
    .call(() => factory.loadNextLevel())
    .execute();
}
```

### Coding Standards

#### 1. TypeScript

- **Strict mode** encouraged (but not enforced in this project)
- **Type annotations** for function parameters and return types
- **Interfaces** for data structures
- **Enums** for constants

#### 2. ECS Best Practices

**DO:**
- Keep components focused (single responsibility)
- Use messages for cross-component communication
- Use attributes for data attached to objects
- Use tags for grouping objects
- Use flags for efficient boolean checks
- Use states for mutually exclusive conditions
- Prefer composition over inheritance

**DON'T:**
- Don't store references to other components (use messages instead)
- Don't update other objects directly (use messages)
- Don't make components too large (split into multiple)
- Don't use components as data containers (use attributes)

#### 3. Naming Conventions

**Components:**
- Suffix with `Component`: `PlayerController`, `SoundComponent`
- Controllers: `[Name]Controller`
- Renderers: `[Name]Renderer`
- Systems: `[Name]System`

**Messages:**
- ALL_CAPS with underscores: `PLAYER_DIED`, `LEVEL_COMPLETED`
- Prefix with action: `STATE_CHANGE_SCORE`, `INPUT_KEY_PRESSED`

**Tags:**
- lowercase: `'player'`, `'enemy'`, `'bullet'`
- Use descriptive names: `'pickable'`, `'solid'`

**Attributes:**
- camelCase: `'velocity'`, `'maxHealth'`

**Flags:**
- Use enum or constants: `PlayerFlags.ALIVE`, `EnemyFlags.AGGRESSIVE`

**States:**
- Use enum: `PlayerStates.IDLE`, `PlayerStates.RUNNING`

#### 4. Performance Considerations

- **Fixed timestep** for game logic (use `fixedFrequency`)
- **Object pooling** for frequently created/destroyed objects (not implemented in current games)
- **Efficient searches**: Use tags/flags/states instead of `scene.stage.children`
- **Batch messages**: Send one message instead of many
- **Limit subscribers**: Don't subscribe to `Messages.ANY` unless necessary

#### 5. Pixel Art Rendering

For pixel art games (like all three current games):
```typescript
PIXI.settings.SCALE_MODE = PIXI.SCALE_MODES.NEAREST;
PIXI.settings.ROUND_PIXELS = true;
```

---

## 9. Extension Points

### Adding a New Game

1. **Create game directory:**
   ```
   src/game_[name]/
   ├── index.ts              # Main entry (extends ECSExample)
   ├── factory.ts            # Scene factory
   ├── constants.ts          # Constants, enums, messages
   ├── model/                # Data structures
   ├── components/           # ECS components
   └── [assets]              # Game assets
   ```

2. **Create main class:**
   ```typescript
   import { ECSExample } from '../utils/APHExample';
   import * as ECS from '../../libs/pixi-ecs';

   export class MyGame extends ECSExample {
     constructor() {
       super({
         width: 800,
         height: 600,
         backgroundColor: 0x000000
       });
     }

     load() {
       // Load assets
       PIXI.Loader.shared
         .add('assets', 'path/to/assets')
         .load(() => this.onLoaded());
     }

     onLoaded() {
       // Create factory and load first scene
       const factory = new Factory(this.engine.scene);
       factory.loadGame();
     }
   }
   ```

3. **Add to exports:**
   - Add import to `src/examples.ts`
   - Add to `window.APH` object
   - Add entry to `examples-info.json`

4. **Generate HTML:**
   ```bash
   npm run generate-views
   ```

### Adding a New Component to ECS Library

1. **Create component file:**
   ```
   libs/pixi-ecs/components/my-component.ts
   ```

2. **Implement component:**
   ```typescript
   import Component from '../engine/component';

   export class MyComponent extends Component {
     // Implementation
   }
   ```

3. **Export from index:**
   ```typescript
   // libs/pixi-ecs/index.ts
   import { MyComponent } from './components/my-component';
   export { MyComponent };
   ```

### Adding a New Utility

1. **Create utility file:**
   ```
   libs/pixi-ecs/utils/my-utility.ts
   ```

2. **Export from index:**
   ```typescript
   // libs/pixi-ecs/index.ts
   import MyUtility from './utils/my-utility';
   export { MyUtility };
   ```

### Adding a New Example

1. **Create example directory:**
   ```
   src/[category]/my-example/
   └── index.ts
   ```

2. **Create example class:**
   ```typescript
   import { ECSExample } from '../../utils/APHExample';

   export class MyExample extends ECSExample {
     load() {
       // Create scene
     }
   }
   ```

3. **Add to exports:**
   - Import in `src/examples.ts`
   - Add to `window.APH`
   - Add entry to `examples-info.json`

4. **Generate HTML:**
   ```bash
   npm run generate-views
   ```

### Extending Game Features

#### Adding New Component Type

Example: Adding a particle system component

1. **Create component:**
   ```typescript
   // src/game_[name]/components/particle-system.ts
   export class ParticleSystem extends ECS.Component {
     // Particle logic
   }
   ```

2. **Use in factory:**
   ```typescript
   const particles = new ECS.Builder(scene)
     .asParticleContainer(1000)
     .withComponent(new ParticleSystem())
     .build();
   ```

#### Adding New Message Type

1. **Define in constants:**
   ```typescript
   // constants.ts
   export enum Messages {
     PLAYER_JUMPED = 'PLAYER_JUMPED',
     POWER_UP_COLLECTED = 'POWER_UP_COLLECTED'
   }
   ```

2. **Send message:**
   ```typescript
   this.sendMessage(Messages.PLAYER_JUMPED, { height: 100 });
   ```

3. **Subscribe to message:**
   ```typescript
   onInit() {
     this.subscribe(Messages.PLAYER_JUMPED);
   }

   onMessage(msg: ECS.Message) {
     if (msg.action === Messages.PLAYER_JUMPED) {
       // Handle
     }
   }
   ```

#### Adding New Level

For games with level files (Tetris, Vlak, Block Breaker):

1. **Edit level file:**
   ```
   :newlevel
   111111111
   1       1
   1  A    1
   1       1
   111111111
   ```

2. **Reload game** - Level parser will automatically load it

#### Adding Asset Type

1. **Add to loader:**
   ```typescript
   PIXI.Loader.shared
     .add('newAsset', 'path/to/asset.png')
     .load(() => this.onLoaded());
   ```

2. **Use in game:**
   ```typescript
   const texture = PIXI.Texture.from('newAsset');
   const sprite = new ECS.Sprite(texture);
   ```

### Testing

Currently no automated tests in this project. Manual testing workflow:

1. **Run dev server:** `npm run dev`
2. **Navigate to example:** `localhost:1234/index.html`
3. **Test manually**
4. **Check console for errors**
5. **Verify in multiple browsers**

For production:
1. **Build:** `npm run build`
2. **Test build:** Serve `build/` directory
3. **Verify all examples work**

---

## 10. Appendix

### Glossary

- **ECS** - Entity-Component-System architectural pattern
- **Entity** - A game object (Sprite, Container, etc.)
- **Component** - Behavior attached to an entity
- **System** - Global component that operates on entities
- **Scene** - Container for all game objects
- **Message** - Event sent between components
- **Tag** - String identifier for grouping entities
- **Flag** - Boolean flag (bit-based) for entities
- **State** - Mutually exclusive state ID for entities
- **Attribute** - Key-value data attached to entities
- **Builder** - Fluent API for creating entities
- **Factory** - Class that creates scenes/levels
- **ChainComponent** - Component for sequential actions
- **FuncComponent** - Component created with functions

### Key Concepts

#### ECS vs Traditional OOP

**Traditional OOP:**
```typescript
class Player extends Character {
  health: number;
  velocity: Vector;
  
  update() {
    this.move();
    this.checkCollisions();
    this.render();
  }
}
```

**ECS:**
```typescript
// Entity (just a container)
const player = new ECS.Container();

// Components (behaviors)
player.addComponent(new HealthComponent());
player.addComponent(new MovementComponent());
player.addComponent(new CollisionComponent());
player.addComponent(new RenderComponent());

// Each component handles its own logic
```

**Benefits of ECS:**
- **Composition over inheritance** - Mix and match behaviors
- **Reusability** - Components work on any entity
- **Flexibility** - Add/remove components at runtime
- **Performance** - Systems can process entities efficiently
- **Decoupling** - Components don't know about each other

#### Message-Driven Architecture

**Why Messages?**
- Decouples components (no direct references)
- Enables event-driven logic
- Makes debugging easier (trace messages)
- Supports loosely coupled systems

**Example:**
```typescript
// Component A
class DamageDealer extends ECS.Component {
  attack() {
    this.sendMessage('TAKE_DAMAGE', { amount: 10 });
  }
}

// Component B (on different object)
class HealthComponent extends ECS.Component {
  onInit() {
    this.subscribe('TAKE_DAMAGE');
  }

  onMessage(msg: ECS.Message) {
    if (msg.action === 'TAKE_DAMAGE') {
      this.health -= msg.data.amount;
    }
  }
}
```

#### Component Lifecycle

```
Component Created
  ↓
onInit() [called once]
  ↓
Added to Scene
  ↓
onAttach() [called when attached]
  ↓
onUpdate() [called every frame] ←─┐
  ↓                                │
onFixedUpdate() [if fixedFrequency set] ─┘
  ↓
finish() called
  ↓
onFinish()
  ↓
Removed from Owner
  ↓
onRemove()
```

#### Scene Lifecycle

```
Game Start
  ↓
Load Assets
  ↓
Create Scene (Factory)
  ↓
Game Loop
  ↓ (state change)
Clear Scene
  ↓
Create New Scene
  ↓
Game Loop
```

### Common Patterns

#### Singleton Pattern

Global components (systems):
```typescript
const collisionSystem = new CollisionSystem();
scene.addGlobalComponent(collisionSystem);

// Access anywhere:
const collision = scene.getGlobalAttribute<CollisionSystem>('collision');
```

#### Observer Pattern

Messages:
```typescript
// Publisher
this.sendMessage('EVENT', data);

// Subscriber
this.subscribe('EVENT');
onMessage(msg) { /* handle */ }
```

#### Factory Pattern

Scene creation:
```typescript
class Factory {
  loadLevel(data) {
    scene.clearScene();
    // Create entities
  }
}
```

#### Builder Pattern

Entity creation:
```typescript
new ECS.Builder(scene)
  .asSprite(texture)
  .localPos(100, 100)
  .withComponent(new Controller())
  .build();
```

#### Strategy Pattern

Pluggable behaviors:
```typescript
// Different controllers for different input methods
class KeyboardController extends Controller { }
class TouchController extends Controller { }
class AIController extends Controller { }
```

#### Chain of Responsibility

ChainComponent:
```typescript
new ECS.ChainComponent()
  .call(() => step1())
  .call(() => step2())
  .call(() => step3())
  .execute();
```

### Resources

**Libraries:**
- [PixiJS Documentation](https://pixijs.com/)
- [Three.js Documentation](https://threejs.org/)
- [Matter.js Documentation](https://brm.io/matter-js/)
- [TypeScript Documentation](https://www.typescriptlang.org/)

**ECS Resources:**
- [Entity Component System (Wikipedia)](https://en.wikipedia.org/wiki/Entity_component_system)
- [ECS Architecture Pattern](https://www.gamedev.net/tutorials/programming/general-and-gameplay-programming/understanding-component-entity-systems-r3013/)

**Game Development:**
- [Game Programming Patterns](https://gameprogrammingpatterns.com/)
- [Red Blob Games](https://www.redblobgames.com/)

---

## Conclusion

This PRD documents the complete infrastructure of the APH Games Examples project, including:
- The custom ECS library (`pixi-ecs`) architecture and API
- Three complete game implementations (Tetris, Vlak, Block Breaker)
- Build system and development workflow
- Development guidelines and best practices
- Extension points for adding new features

The project demonstrates a well-structured, component-based architecture suitable for 2D game development with PixiJS. The ECS pattern provides flexibility, reusability, and maintainability for complex game logic.

For questions or contributions, refer to the individual source files and the official documentation at [aphgames.io](https://aphgames.io).
