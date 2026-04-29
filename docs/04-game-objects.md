# Game Objects & Builder

> **TL;DR**
> - All game objects extend PIXI types and delegate ECS state to `GameObjectProxy`
> - Use `ECS.Builder` fluent API to construct objects declaratively — never configure them manually inline
> - Tags, flags, attributes, and `stateId` are the four metadata systems on every object
> - `detach()` removes from scene but preserves object; `destroy()` is permanent and recursive
> - `withParent()` in Builder is the preferred way to place objects into the scene tree

---

## Game Object Types

All types live under `libs/pixi-ecs/engine/game-objects/` and are exported from `libs/pixi-ecs/index.ts`.

| ECS Type | Extends | Use case |
|----------|---------|----------|
| `ECS.Container` | `PIXI.Container` | Logical grouping, layers, invisible parents |
| `ECS.Sprite` | `PIXI.Sprite` | Static or animated single texture |
| `ECS.AnimatedSprite` | `PIXI.AnimatedSprite` | Sprite-sheet frame animation |
| `ECS.Graphics` | `PIXI.Graphics` | Procedural drawing (shapes, lines) |
| `ECS.Text` | `PIXI.Text` | Dynamic text with `PIXI.TextStyle` |
| `ECS.BitmapText` | `PIXI.BitmapText` | Fast bitmap font text |
| `ECS.TilingSprite` | `PIXI.TilingSprite` | Tiled/scrolling background texture |
| `ECS.Mesh` | `PIXI.Mesh` | Custom geometry + shader |
| `ECS.NineSlicePlane` | `PIXI.NineSlicePlane` | Scalable panel/button with border preservation |
| `ECS.ParticleContainer` | `PIXI.ParticleContainer` | High-performance particle rendering |
| `ECS.SimpleMesh` | `PIXI.SimpleMesh` | Mesh with simple vertex array |
| `ECS.SimplePlane` | `PIXI.SimplePlane` | Deformable plane |
| `ECS.SimpleRope` | `PIXI.SimpleRope` | Rope effect along point path |

---

## Constructing Objects Directly

Objects can be constructed directly (without Builder) when you need fine control:

```typescript
const sprite = new ECS.Sprite('playerSprite', PIXI.Texture.from('spritesheet'));
sprite.anchor.set(0.5);
sprite.position.set(400, 300);
sprite.addTag('player');
sprite.addComponent(new PlayerController(model));
scene.stage.addChild(sprite);
```

However, **prefer Builder** for any entity that has more than one component or attribute (see below).

---

## `ECS.Builder` — Fluent Entity Construction

`Builder` is the primary way to construct game objects. It accumulates configuration and creates the object in one atomic `build()` call.

```typescript
const player = new ECS.Builder(scene)
    .withName('player')
    .asSprite(PIXI.Texture.from('player_tex'))
    .anchor(0.5)                          // center anchor
    .localPos(400, 300)                   // position relative to parent
    .scale(2)                             // uniform scale
    .withTag('player')
    .withFlag(FLAGS.COLLIDABLE)
    .withState(PlayerState.IDLE)
    .withAttribute(Attrs.SPEED, 150)
    .withComponent(new PlayerController(model))
    .withComponent(new AnimationController())
    .withParent(scene.stage)
    .build<ECS.Sprite>();
```

### Object Type Methods

| Method | PIXI object created |
|--------|---------------------|
| `.asContainer()` | `ECS.Container` |
| `.asSprite(texture)` | `ECS.Sprite` |
| `.asAnimatedSprite(textures[])` | `ECS.AnimatedSprite` |
| `.asGraphics()` | `ECS.Graphics` |
| `.asText(text, style?)` | `ECS.Text` |
| `.asBitmapText(text, fontName, fontSize, fontColor)` | `ECS.BitmapText` |
| `.asTilingSprite(texture, width, height)` | `ECS.TilingSprite` |
| `.asMesh(geometry, shader)` | `ECS.Mesh` |
| `.asNineSlicePlane(tex, l, t, r, b)` | `ECS.NineSlicePlane` |
| `.asParticleContainer()` | `ECS.ParticleContainer` |
| `.asSimpleMesh(tex?, vertices?)` | `ECS.SimpleMesh` |
| `.asSimplePlane(tex, vertsX, vertsY)` | `ECS.SimplePlane` |
| `.asSimpleRope(tex, points[])` | `ECS.SimpleRope` |

### Position Methods

| Method | Description |
|--------|-------------|
| `.localPos(x, y)` | Position relative to parent container |
| `.globalPos(x, y)` | Position in world/stage space |
| `.relativePos(x, y)` | Normalized `[0,1]` position on screen (`0.5, 0.5` = center) |
| `.anchor(x, y?)` | Sets sprite/text anchor (or container pivot as fraction of size) |
| `.virtualAnchor(x, y?)` | Offsets position to simulate anchor without changing pivot |
| `.scale(x, y?)` | Local scale (single number = uniform) |

`localPos` and `relativePos` can be combined — local becomes an offset from the relative position.

### Metadata Methods

| Method | Description |
|--------|-------------|
| `.withName(name)` | Sets the game object's name |
| `.withTag(tag)` | Adds a tag string |
| `.withFlag(flagIndex)` | Sets a bit flag (1–128) |
| `.withState(stateId)` | Sets the numeric state |
| `.withAttribute(key, value)` | Stores an arbitrary attribute |

### Component Methods

| Method | Description |
|--------|-------------|
| `.withComponent(cmp)` | Adds a component instance |
| `.withComponent(() => new MyCmp())` | Adds a factory function (safe for reusing builder) |
| `.withComponents(cmp[])` | Adds an array of components |

### Hierarchy Methods

| Method | Description |
|--------|-------------|
| `.withParent(container)` | Sets the parent — object is added to parent on build |
| `.withChild(builder)` | Attaches a child `Builder` (built after parent) |

### Build Methods

| Method | Description |
|--------|-------------|
| `.build<T>()` | Creates the object, clears builder state, returns `T` |
| `.buildAndKeepData<T>()` | Creates the object but retains configuration for reuse |
| `.buildInto(container)` | Applies configuration to an existing container |
| `.buildIntoAndKeepData(container)` | Same but retains configuration |

---

## Object Metadata Systems

Every game object supports four parallel metadata systems:

### Tags — `Set<string>`

String labels for categorizing objects. Use for searching and broad message filtering:

```typescript
obj.addTag('enemy');
obj.addTag('flying');
obj.hasTag('enemy');       // → true
obj.removeTag('enemy');

// Scene query (requires tagsSearchEnabled: true in config)
const enemies = scene.findObjectsByTag('enemy');
```

### Attributes — `Map<string, any>`

Key-value store for arbitrary data attached to an object. Prefer typed attributes using string enum keys:

```typescript
obj.assignAttribute(Attrs.SPEED, 200);
obj.assignAttribute(Attrs.HEALTH, 100);

const speed = obj.getAttribute<number>(Attrs.SPEED);
obj.removeAttribute(Attrs.SPEED);
```

Attributes can optionally trigger `ATTRIBUTE_*` messages (enable with `notifyAttributeChanges: true`).

### Flags — bit-array (1–128)

Integer bit flags for binary state. Fast, but limited to 128 slots. Use an enum to name flags:

```typescript
const enum FLAGS {
    COLLIDABLE = 1,
    INVINCIBLE = 2,
    FLYING = 4,
}

obj.setFlag(FLAGS.COLLIDABLE);
obj.hasFlag(FLAGS.COLLIDABLE);   // → true
obj.resetFlag(FLAGS.COLLIDABLE);
obj.invertFlag(FLAGS.COLLIDABLE);
```

### `stateId` — single numeric state

One numeric state per object. Use an enum to name states. Useful for simple FSM:

```typescript
const enum EnemyState {
    IDLE = 0,
    PATROL = 1,
    CHASE = 2,
    ATTACK = 3,
}

obj.stateId = EnemyState.PATROL;
if (obj.stateId === EnemyState.CHASE) { ... }
```

---

## Hierarchy: `addChild` and Scene Attachment

When a game object is added to a parent that is already in the scene tree, it is immediately **attached**:

```typescript
// parent is on scene → child is automatically attached on addChild
parent.addChild(childSprite);

// Adding a container with children: all children are attached recursively
scene.stage.addChild(parentContainer); // entire sub-tree is attached
```

When an object is added to the scene, all its queued components are initialized (`onInit` + `onAttach`).

---

## Game Object Properties Reference

Every ECS game object exposes the following properties alongside all inherited PIXI properties:

| Property | Type | Description |
|----------|------|-------------|
| `id` | `number` | Auto-generated unique identifier |
| `name` | `string` | Object name (empty string by default) |
| `stateId` | `number` | Single numeric state (for FSM-style logic) |
| `pixiObj` | `PIXI.Container` | Raw reference to the underlying PIXI object |
| `parentGameObject` | `Container \| null` | The ECS parent container (not the PIXI parent) |
| `scene` | `Scene` | Link to the active scene |
| `_proxy_` | `GameObjectProxy` | Internal delegate implementing `GameObject`; rarely needed directly |

`parentGameObject` is useful for traversing the ECS object hierarchy without casting through PIXI's `parent` chain.

---

## `detach()` vs `destroy()`

| Operation | Effect | Can reuse? |
|-----------|--------|-----------|
| `obj.detach()` | Removes from scene, components enter `DETACHED` state, object stays in memory | Yes |
| `obj.destroy()` | Permanently destroys object and all children, finalizes all components | No |
| `parent.destroyChildren()` | Destroys all direct children | — |

Use `detach()` for object pooling or temporary removal. Use `destroy()` for permanent cleanup.

---

## Parent/Child Builder Pattern

Build entire sub-trees declaratively:

```typescript
new ECS.Builder(scene)
    .asContainer()
    .withName('hud')
    .withParent(scene.stage)
    .withChild(
        new ECS.Builder(scene)
            .asText('Score: 0', scoreStyle)
            .withName('scoreText')
            .localPos(10, 10)
            .withComponent(new ScoreDisplay(model))
    )
    .withChild(
        new ECS.Builder(scene)
            .asText('Lives: 3', livesStyle)
            .withName('livesText')
            .localPos(10, 30)
            .withComponent(new LivesDisplay(model))
    )
    .build();
```

Children are built after their parent, with the parent automatically set as their parent container.

---

## Casting Between Object Types

When `scene.findObjectByTag` returns a generic `Container`, cast to the specific type for PIXI-specific API:

```typescript
const label = scene.findObjectByName('scoreText') as ECS.Text;
label.text = `Score: ${score}`;

const bg = scene.findObjectByName('background') as ECS.TilingSprite;
bg.tilePosition.x += scrollSpeed * delta;
```

Note: PIXI properties (`position`, `scale`, `alpha`, `visible`, `rotation`) are available on all types without casting, since all ECS types extend PIXI types.
