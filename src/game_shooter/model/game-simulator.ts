/**
 * Pure game simulation — zero PIXI / ECS dependencies.
 * All logic operates on plain GameModel values and returns SimResult objects.
 * This makes every mechanic verifiable without a rendering context.
 */
import {
	ARENA_WIDTH, ARENA_HEIGHT,
	PLAYER_RADIUS, PLAYER_MAX_SPEED, PLAYER_ACCEL, PLAYER_DECEL,
	INVULNERABLE_DURATION, FIRE_RATE, PROJECTILE_SPEED, PROJECTILE_LIFETIME, PROJECTILE_RADIUS,
	EnemyType, GameState, SimEventType,
	MULTIPLIER_KILL_THRESHOLDS, MULTIPLIER_VALUES,
	EXTRA_LIFE_SCORE_THRESHOLDS, EXTRA_BOMB_SCORE_THRESHOLDS,
	ENEMY_MIN_SPAWN_DISTANCE,
	SPAWN_INTERVAL_INITIAL, SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_DECAY,
	SPAWN_MAX_ENEMIES_INITIAL, SPAWN_MAX_ENEMIES_CAP, SPAWN_MAX_ENEMIES_GROWTH,
	ENEMY_UNLOCK_PURSUER, ENEMY_UNLOCK_SPINNER, ENEMY_UNLOCK_SEGMENTED,
	ENEMY_UNLOCK_SPLITTER, ENEMY_UNLOCK_GRAVITY_WELL,
	ENEMY_DRIFTER_RADIUS, ENEMY_DRIFTER_SPEED, ENEMY_DRIFTER_SCORE, ENEMY_DRIFTER_HP,
	ENEMY_PURSUER_RADIUS, ENEMY_PURSUER_BASE_SPEED, ENEMY_PURSUER_MAX_SPEED, ENEMY_PURSUER_SCORE, ENEMY_PURSUER_HP,
	ENEMY_SPINNER_RADIUS, ENEMY_SPINNER_ORBIT_SPEED, ENEMY_SPINNER_DRIFT_SPEED, ENEMY_SPINNER_SCORE, ENEMY_SPINNER_HP,
	ENEMY_SEGMENTED_RADIUS, ENEMY_SEGMENTED_SPEED, ENEMY_SEGMENTED_SCORE, ENEMY_SEGMENTED_HP,
	ENEMY_SEGMENTED_SEGMENTS, ENEMY_SEGMENTED_SEGMENT_SPACING,
	ENEMY_SPLITTER_RADIUS, ENEMY_SPLITTER_SPEED, ENEMY_SPLITTER_SCORE, ENEMY_SPLITTER_HP,
	ENEMY_SPLITTER_FRAGMENT_COUNT, ENEMY_SPLITTER_FRAGMENT_RADIUS, ENEMY_SPLITTER_FRAGMENT_SPEED, ENEMY_SPLITTER_FRAGMENT_SCORE,
	ENEMY_GRAVITY_WELL_RADIUS, ENEMY_GRAVITY_WELL_PULL_RADIUS, ENEMY_GRAVITY_WELL_PULL_STRENGTH,
	ENEMY_GRAVITY_WELL_SCORE, ENEMY_GRAVITY_WELL_HP,
	MULTISHOT_SCORE_THRESHOLD, MULTISHOT_5_SPREAD, MULTISHOT_10_SPREAD,
} from '../constants';

import {
	GameModel, InputState, EnemyData, ProjectileData, Vec2,
	vec2, vec2Add, vec2Scale, vec2Normalize, vec2Length, vec2Distance, vec2Clone,
	pendingThresholds,
} from './game-model';

// ============================================================
// Simulation events — emitted by update(), consumed by ECS layer
// ============================================================
export interface SimEvent {
	type: SimEventType;
	enemyId?: number;
	enemyType?: EnemyType;
	scoreGained?: number;
	newMultiplier?: number;
	/** World-space position of the event (kill/segment destroy site). Used for particle effects. */
	position?: Vec2;
}

export interface SimResult {
	model: GameModel;
	events: SimEvent[];
}

// ============================================================
// Weapon mode helpers
// ============================================================

interface WeaponMode {
	count: number;
	spread: number;
	/** When true each shot gets a small random jitter on its angle. */
	randomize: boolean;
}

function getWeaponMode(score: number): WeaponMode {
	const tier = Math.floor(score / MULTISHOT_SCORE_THRESHOLD);
	if (tier === 0) return { count: 1, spread: 0, randomize: false };
	if (tier % 2 === 1) return { count: 5,  spread: MULTISHOT_5_SPREAD,  randomize: true };
	return                    { count: 10, spread: MULTISHOT_10_SPREAD, randomize: false };
}

// ============================================================
// Enemy scoring table
// ============================================================
const ENEMY_SCORE: Record<EnemyType, number> = {
	[EnemyType.DRIFTER]: ENEMY_DRIFTER_SCORE,
	[EnemyType.PURSUER]: ENEMY_PURSUER_SCORE,
	[EnemyType.SPINNER]: ENEMY_SPINNER_SCORE,
	[EnemyType.SEGMENTED]: ENEMY_SEGMENTED_SCORE,
	[EnemyType.SPLITTER]: ENEMY_SPLITTER_SCORE,
	[EnemyType.GRAVITY_WELL]: ENEMY_GRAVITY_WELL_SCORE,
};

// ============================================================
// Internal helpers
// ============================================================

function circlesOverlap(aPos: Vec2, aRadius: number, bPos: Vec2, bRadius: number): boolean {
	return vec2Distance(aPos, bPos) < aRadius + bRadius;
}

function clamp(value: number, min: number, max: number): number {
	return Math.max(min, Math.min(max, value));
}

function clampToArena(pos: Vec2, radius: number): Vec2 {
	return {
		x: clamp(pos.x, radius, ARENA_WIDTH - radius),
		y: clamp(pos.y, radius, ARENA_HEIGHT - radius),
	};
}

/** Reflect velocity component when the entity hits an arena wall. */
function reflectOnWalls(pos: Vec2, vel: Vec2, radius: number): Vec2 {
	let vx = vel.x;
	let vy = vel.y;
	if (pos.x <= radius || pos.x >= ARENA_WIDTH - radius) vx = -vx;
	if (pos.y <= radius || pos.y >= ARENA_HEIGHT - radius) vy = -vy;
	return { x: vx, y: vy };
}

/** Nudge an enemy to the closest valid arena position without overlap with the player. */
function pickSpawnPosition(model: GameModel, radius: number): Vec2 {
	const rng = model.rng;
	const playerPos = model.player.position;

	for (let attempt = 0; attempt < 30; attempt++) {
		// Spawn along one of the four edges
		const edge = rng.nextInt(0, 3);
		let x: number;
		let y: number;
		switch (edge) {
		case 0: x = rng.nextRange(radius, ARENA_WIDTH - radius); y = radius + rng.nextRange(0, 30); break;         // top
		case 1: x = rng.nextRange(radius, ARENA_WIDTH - radius); y = ARENA_HEIGHT - radius - rng.nextRange(0, 30); break; // bottom
		case 2: x = radius + rng.nextRange(0, 30); y = rng.nextRange(radius, ARENA_HEIGHT - radius); break;         // left
		default: x = ARENA_WIDTH - radius - rng.nextRange(0, 30); y = rng.nextRange(radius, ARENA_HEIGHT - radius); break; // right
		}
		if (vec2Distance({ x, y }, playerPos) >= ENEMY_MIN_SPAWN_DISTANCE) {
			return { x, y };
		}
	}
	// Fallback: opposite corner from the player
	return {
		x: playerPos.x < ARENA_WIDTH / 2 ? ARENA_WIDTH - radius - 20 : radius + 20,
		y: playerPos.y < ARENA_HEIGHT / 2 ? ARENA_HEIGHT - radius - 20 : radius + 20,
	};
}

function buildEnemy(model: GameModel, type: EnemyType): EnemyData {
	const rng = model.rng;
	const id = model.nextEnemyId++;

	switch (type) {
	case EnemyType.DRIFTER: {
		const pos = pickSpawnPosition(model, ENEMY_DRIFTER_RADIUS);
		const dir = rng.randomDirection();
		return {
			id, type,
			position: pos,
			velocity: vec2Scale(dir, ENEMY_DRIFTER_SPEED),
			hp: ENEMY_DRIFTER_HP,
			radius: ENEMY_DRIFTER_RADIUS,
			phase: 0, segments: [], splitterGeneration: 0,
		};
	}
	case EnemyType.PURSUER: {
		const pos = pickSpawnPosition(model, ENEMY_PURSUER_RADIUS);
		return {
			id, type,
			position: pos,
			velocity: vec2(0, 0),
			hp: ENEMY_PURSUER_HP,
			radius: ENEMY_PURSUER_RADIUS,
			phase: 0, segments: [], splitterGeneration: 0,
		};
	}
	case EnemyType.SPINNER: {
		const pos = pickSpawnPosition(model, ENEMY_SPINNER_RADIUS);
		const angle = rng.next() * Math.PI * 2;
		const drift = rng.randomDirection();
		return {
			id, type,
			position: pos,
			velocity: vec2Scale(drift, ENEMY_SPINNER_DRIFT_SPEED),
			hp: ENEMY_SPINNER_HP,
			radius: ENEMY_SPINNER_RADIUS,
			phase: angle, segments: [], splitterGeneration: 0,
		};
	}
	case EnemyType.SEGMENTED: {
		const pos = pickSpawnPosition(model, ENEMY_SEGMENTED_RADIUS);
		// Pre-fill segment trail at the same spawn position
		const segs: Vec2[] = [];
		for (let i = 0; i < ENEMY_SEGMENTED_SEGMENTS; i++) {
			segs.push(vec2Clone(pos));
		}
		return {
			id, type,
			position: pos,
			velocity: vec2(0, 0),
			hp: ENEMY_SEGMENTED_HP,
			radius: ENEMY_SEGMENTED_RADIUS,
			phase: 0, segments: segs, splitterGeneration: 0,
		};
	}
	case EnemyType.SPLITTER: {
		const pos = pickSpawnPosition(model, ENEMY_SPLITTER_RADIUS);
		const dir = rng.randomDirection();
		return {
			id, type,
			position: pos,
			velocity: vec2Scale(dir, ENEMY_SPLITTER_SPEED),
			hp: ENEMY_SPLITTER_HP,
			radius: ENEMY_SPLITTER_RADIUS,
			phase: 0, segments: [], splitterGeneration: 0,
		};
	}
	case EnemyType.GRAVITY_WELL: {
		const pos = pickSpawnPosition(model, ENEMY_GRAVITY_WELL_RADIUS);
		return {
			id, type,
			position: pos,
			velocity: vec2(0, 0),
			hp: ENEMY_GRAVITY_WELL_HP,
			radius: ENEMY_GRAVITY_WELL_RADIUS,
			phase: 0, segments: [], splitterGeneration: 0,
		};
	}
	}
}

/** Build a fragment spawned when a splitter dies. */
function buildSplitterFragment(model: GameModel, origin: Vec2, angle: number): EnemyData {
	const id = model.nextEnemyId++;
	const vel = { x: Math.cos(angle) * ENEMY_SPLITTER_FRAGMENT_SPEED, y: Math.sin(angle) * ENEMY_SPLITTER_FRAGMENT_SPEED };
	return {
		id,
		type: EnemyType.DRIFTER,
		position: vec2Clone(origin),
		velocity: vel,
		hp: 1,
		radius: ENEMY_SPLITTER_FRAGMENT_RADIUS,
		phase: 0, segments: [], splitterGeneration: 1,
	};
}

function getAvailableEnemyTypes(elapsed: number): EnemyType[] {
	const types: EnemyType[] = [EnemyType.DRIFTER];
	if (elapsed >= ENEMY_UNLOCK_PURSUER) types.push(EnemyType.PURSUER);
	if (elapsed >= ENEMY_UNLOCK_SPINNER) types.push(EnemyType.SPINNER);
	if (elapsed >= ENEMY_UNLOCK_SEGMENTED) types.push(EnemyType.SEGMENTED);
	if (elapsed >= ENEMY_UNLOCK_SPLITTER) types.push(EnemyType.SPLITTER);
	if (elapsed >= ENEMY_UNLOCK_GRAVITY_WELL) types.push(EnemyType.GRAVITY_WELL);
	return types;
}

function getSpawnInterval(elapsed: number): number {
	const minutes = elapsed / 60;
	return Math.max(SPAWN_INTERVAL_MIN, SPAWN_INTERVAL_INITIAL - minutes * SPAWN_INTERVAL_DECAY);
}

function getMaxEnemies(elapsed: number): number {
	const minutes = elapsed / 60;
	return Math.min(SPAWN_MAX_ENEMIES_CAP, SPAWN_MAX_ENEMIES_INITIAL + Math.floor(minutes * SPAWN_MAX_ENEMIES_GROWTH));
}

function getMultiplierLevel(killStreak: number): number {
	let level = 0;
	let cumulative = 0;
	for (let i = 0; i < MULTIPLIER_KILL_THRESHOLDS.length; i++) {
		cumulative += MULTIPLIER_KILL_THRESHOLDS[i];
		if (killStreak >= cumulative) {
			level = i + 1;
		} else {
			break;
		}
	}
	return Math.min(level, MULTIPLIER_VALUES.length - 1);
}

// ============================================================
// Main simulator class
// ============================================================

export class GameSimulator {
	/**
	 * Advance the game by `dt` seconds given the player's `input`.
	 * The model is mutated in-place and returned along with any events fired.
	 * Callers that need immutable updates should clone the model before calling.
	 */
	update(model: GameModel, input: InputState, dt: number): SimResult {
		const events: SimEvent[] = [];

		if (model.state !== GameState.PLAYING) {
			return { model, events };
		}

		model.elapsed += dt;

		// ── 1. Player movement ─────────────────────────────────────────
		this.updatePlayerMovement(model, input, dt);

		// ── 2. Player aim & fire rate cooldown ─────────────────────────
		model.player.aimAngle = input.aimAngle;
		model.player.fireCooldown = Math.max(0, model.player.fireCooldown - dt);
		if (input.fire && model.player.fireCooldown <= 0) {
			this.spawnProjectiles(model);
		}

		// ── 3. Invulnerability timer ───────────────────────────────────
		if (model.player.invulnerableTimer > 0) {
			model.player.invulnerableTimer = Math.max(0, model.player.invulnerableTimer - dt);
		}

		// ── 4. Bomb ────────────────────────────────────────────────────
		if (input.bomb && model.bombs > 0) {
			model.bombs--;
			model.enemies = [];
			model.projectiles = [];
			events.push({ type: SimEventType.BOMB_USED });
		}

		// ── 5. Projectile movement & expiry ────────────────────────────
		this.updateProjectiles(model, dt);

		// ── 6. Enemy movement ──────────────────────────────────────────
		this.updateEnemies(model, dt);

		// ── 7. Projectile-enemy collisions ─────────────────────────────
		this.resolveProjectileEnemyCollisions(model, events);

		// ── 8. Player-enemy collisions ─────────────────────────────────
		this.resolvePlayerEnemyCollisions(model, events);

		// ── 9. Scoring ─────────────────────────────────────────────────
		this.applyKillScores(model, events);

		// ── 10. Rewards & spawning ─────────────────────────────────────
		this.checkRewards(model, events);
		this.updateSpawning(model, events, dt);

		return { model, events };
	}

	// ── Step 1: Player movement ────────────────────────────────────────

	private updatePlayerMovement(model: GameModel, input: InputState, dt: number): void {
		const player = model.player;
		const inputLen = Math.sqrt(input.moveX * input.moveX + input.moveY * input.moveY);

		if (inputLen > 0) {
			// Normalise the direction so diagonal doesn't exceed max speed
			const nx = input.moveX / inputLen;
			const ny = input.moveY / inputLen;
			player.velocity.x += nx * PLAYER_ACCEL * dt;
			player.velocity.y += ny * PLAYER_ACCEL * dt;
		} else {
			// Decelerate toward zero
			const speed = vec2Length(player.velocity);
			if (speed > 0) {
				const decel = Math.min(speed, PLAYER_DECEL * dt);
				const nx = player.velocity.x / speed;
				const ny = player.velocity.y / speed;
				player.velocity.x -= nx * decel;
				player.velocity.y -= ny * decel;
			}
		}

		// Clamp to max speed
		const speed = vec2Length(player.velocity);
		if (speed > PLAYER_MAX_SPEED) {
			player.velocity.x = (player.velocity.x / speed) * PLAYER_MAX_SPEED;
			player.velocity.y = (player.velocity.y / speed) * PLAYER_MAX_SPEED;
		}

		// Integrate position
		player.position.x += player.velocity.x * dt;
		player.position.y += player.velocity.y * dt;

		// Clamp to arena
		player.position.x = clamp(player.position.x, PLAYER_RADIUS, ARENA_WIDTH - PLAYER_RADIUS);
		player.position.y = clamp(player.position.y, PLAYER_RADIUS, ARENA_HEIGHT - PLAYER_RADIUS);

		// Stop at walls (zero out velocity component that would push through wall)
		if (player.position.x <= PLAYER_RADIUS || player.position.x >= ARENA_WIDTH - PLAYER_RADIUS) {
			player.velocity.x = 0;
		}
		if (player.position.y <= PLAYER_RADIUS || player.position.y >= ARENA_HEIGHT - PLAYER_RADIUS) {
			player.velocity.y = 0;
		}
	}

	// ── Step 2 helper: spawn projectiles (weapon-mode aware) ──────────

	private spawnProjectiles(model: GameModel): void {
		const { position, aimAngle } = model.player;
		const mode = getWeaponMode(model.score);
		const spawnOffset = PLAYER_RADIUS + PROJECTILE_RADIUS + 2;

		for (let i = 0; i < mode.count; i++) {
			let angle: number;
			if (mode.count === 1) {
				angle = aimAngle;
			} else {
				// Distribute evenly across the spread arc
				const t = i / (mode.count - 1) - 0.5; // -0.5 .. +0.5
				angle = aimAngle + t * mode.spread;
				if (mode.randomize) {
					// Slight per-shot random jitter for the 5-shot tier
					angle += model.rng.nextRange(-0.05, 0.05);
				}
			}

			const proj: ProjectileData = {
				id: model.nextProjectileId++,
				position: {
					x: position.x + Math.cos(angle) * spawnOffset,
					y: position.y + Math.sin(angle) * spawnOffset,
				},
				velocity: {
					x: Math.cos(angle) * PROJECTILE_SPEED,
					y: Math.sin(angle) * PROJECTILE_SPEED,
				},
				lifetime: PROJECTILE_LIFETIME,
			};
			model.projectiles.push(proj);
		}

		model.player.fireCooldown = FIRE_RATE;
	}

	// ── Step 5: Projectile update ──────────────────────────────────────

	private updateProjectiles(model: GameModel, dt: number): void {
		const surviving: ProjectileData[] = [];
		for (const proj of model.projectiles) {
			// Apply gravity well influence before moving
			this.applyGravityWellToProjctile(model, proj, dt);

			proj.position.x += proj.velocity.x * dt;
			proj.position.y += proj.velocity.y * dt;
			proj.lifetime -= dt;

			const inArena = proj.position.x >= 0 && proj.position.x <= ARENA_WIDTH &&
				proj.position.y >= 0 && proj.position.y <= ARENA_HEIGHT;

			if (proj.lifetime > 0 && inArena) {
				surviving.push(proj);
			}
		}
		model.projectiles = surviving;
	}

	private applyGravityWellToProjctile(model: GameModel, proj: ProjectileData, dt: number): void {
		for (const enemy of model.enemies) {
			if (enemy.type !== EnemyType.GRAVITY_WELL) continue;
			const dist = vec2Distance(enemy.position, proj.position);
			if (dist < ENEMY_GRAVITY_WELL_PULL_RADIUS && dist > 1) {
				const strength = ENEMY_GRAVITY_WELL_PULL_STRENGTH / (dist * dist);
				const dx = enemy.position.x - proj.position.x;
				const dy = enemy.position.y - proj.position.y;
				proj.velocity.x += (dx / dist) * strength * dt;
				proj.velocity.y += (dy / dist) * strength * dt;
			}
		}
	}

	// ── Step 6: Enemy movement ─────────────────────────────────────────

	private updateEnemies(model: GameModel, dt: number): void {
		for (const enemy of model.enemies) {
			switch (enemy.type) {
			case EnemyType.DRIFTER: this.updateDrifter(enemy, dt); break;
			case EnemyType.PURSUER: this.updatePursuer(enemy, model.player.position, model.elapsed, dt); break;
			case EnemyType.SPINNER: this.updateSpinner(enemy, dt); break;
			case EnemyType.SEGMENTED: this.updateSegmented(enemy, model.player.position, dt); break;
			case EnemyType.SPLITTER: this.updateDrifter(enemy, dt); break; // same wall-bouncing movement
			case EnemyType.GRAVITY_WELL: break; // stationary
			}
		}
	}

	private updateDrifter(enemy: EnemyData, dt: number): void {
		enemy.position.x += enemy.velocity.x * dt;
		enemy.position.y += enemy.velocity.y * dt;
		// Reflect on walls and clamp
		enemy.velocity = reflectOnWalls(enemy.position, enemy.velocity, enemy.radius);
		enemy.position.x = clamp(enemy.position.x, enemy.radius, ARENA_WIDTH - enemy.radius);
		enemy.position.y = clamp(enemy.position.y, enemy.radius, ARENA_HEIGHT - enemy.radius);
	}

	private updatePursuer(enemy: EnemyData, playerPos: Vec2, elapsed: number, dt: number): void {
		enemy.phase += dt; // accumulate time for speed scaling
		const t = Math.min(enemy.phase / 60, 1); // saturate at 60s per enemy
		const speed = ENEMY_PURSUER_BASE_SPEED + t * (ENEMY_PURSUER_MAX_SPEED - ENEMY_PURSUER_BASE_SPEED);
		const dx = playerPos.x - enemy.position.x;
		const dy = playerPos.y - enemy.position.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > 0) {
			enemy.velocity.x = (dx / dist) * speed;
			enemy.velocity.y = (dy / dist) * speed;
		}
		enemy.position.x += enemy.velocity.x * dt;
		enemy.position.y += enemy.velocity.y * dt;
		enemy.position.x = clamp(enemy.position.x, enemy.radius, ARENA_WIDTH - enemy.radius);
		enemy.position.y = clamp(enemy.position.y, enemy.radius, ARENA_HEIGHT - enemy.radius);
	}

	private updateSpinner(enemy: EnemyData, dt: number): void {
		// Drift movement (bouncing)
		enemy.position.x += enemy.velocity.x * dt;
		enemy.position.y += enemy.velocity.y * dt;
		enemy.velocity = reflectOnWalls(enemy.position, enemy.velocity, enemy.radius);
		enemy.position.x = clamp(enemy.position.x, enemy.radius, ARENA_WIDTH - enemy.radius);
		enemy.position.y = clamp(enemy.position.y, enemy.radius, ARENA_HEIGHT - enemy.radius);
		// Spin angle advances for visual effect only (stored in phase for test-state consistency)
		enemy.phase += ENEMY_SPINNER_ORBIT_SPEED * dt;
	}

	private updateSegmented(enemy: EnemyData, playerPos: Vec2, dt: number): void {
		// Head chases the player
		const dx = playerPos.x - enemy.position.x;
		const dy = playerPos.y - enemy.position.y;
		const dist = Math.sqrt(dx * dx + dy * dy);
		if (dist > 0) {
			enemy.velocity.x = (dx / dist) * ENEMY_SEGMENTED_SPEED;
			enemy.velocity.y = (dy / dist) * ENEMY_SEGMENTED_SPEED;
		}
		const prevHead = vec2Clone(enemy.position);
		enemy.position.x += enemy.velocity.x * dt;
		enemy.position.y += enemy.velocity.y * dt;
		enemy.position.x = clamp(enemy.position.x, enemy.radius, ARENA_WIDTH - enemy.radius);
		enemy.position.y = clamp(enemy.position.y, enemy.radius, ARENA_HEIGHT - enemy.radius);

		// Body: each segment follows the one ahead maintaining spacing
		let prevPos = enemy.position;
		for (let i = 0; i < enemy.segments.length; i++) {
			const seg = enemy.segments[i];
			const segDist = vec2Distance(prevPos, seg);
			if (segDist > ENEMY_SEGMENTED_SEGMENT_SPACING) {
				const nx = (seg.x - prevPos.x) / segDist;
				const ny = (seg.y - prevPos.y) / segDist;
				seg.x = prevPos.x + nx * ENEMY_SEGMENTED_SEGMENT_SPACING;
				seg.y = prevPos.y + ny * ENEMY_SEGMENTED_SEGMENT_SPACING;
			}
			prevPos = seg;
		}
		void prevHead; // suppress unused warning
	}

	// ── Step 7: Projectile-enemy collisions ───────────────────────────

	private resolveProjectileEnemyCollisions(model: GameModel, events: SimEvent[]): void {
		const enemiesKilled = new Set<number>();
		const projUsed = new Set<number>();

		// Score awarded per SEGMENTED segment/head piece
		const segmentScore = Math.floor(ENEMY_SEGMENTED_SCORE / (ENEMY_SEGMENTED_SEGMENTS + 1));

		for (const proj of model.projectiles) {
			for (const enemy of model.enemies) {
				if (enemiesKilled.has(enemy.id)) continue;
				if (projUsed.has(proj.id)) continue;

				if (enemy.type === EnemyType.SEGMENTED) {
					// ── Per-part collision for segmented enemies ──────────
					const headHit = circlesOverlap(proj.position, PROJECTILE_RADIUS, enemy.position, enemy.radius);
					if (headHit) {
						projUsed.add(proj.id);
						const headPos = vec2Clone(enemy.position);
						if (enemy.segments.length > 0) {
							// Promote first body segment to head
							enemy.position = enemy.segments.shift();
						} else {
							// No segments left — the whole creature is dead
							enemiesKilled.add(enemy.id);
							events.push({
								type: SimEventType.ENEMY_KILLED,
								enemyId: enemy.id,
								enemyType: EnemyType.SEGMENTED,
								scoreGained: segmentScore,
								position: headPos,
							});
						}
						// Always emit a segment-destroyed event for the explosion
						if (!enemiesKilled.has(enemy.id)) {
							events.push({
								type: SimEventType.SEGMENT_DESTROYED,
								enemyId: enemy.id,
								enemyType: EnemyType.SEGMENTED,
								scoreGained: segmentScore,
								position: headPos,
							});
						}
						continue;
					}

					// Check body segments
					let bodyHitIdx = -1;
					for (let s = 0; s < enemy.segments.length; s++) {
						if (circlesOverlap(proj.position, PROJECTILE_RADIUS, enemy.segments[s], enemy.radius)) {
							bodyHitIdx = s;
							break;
						}
					}
					if (bodyHitIdx !== -1) {
						projUsed.add(proj.id);
						const segPos = vec2Clone(enemy.segments[bodyHitIdx]);
						enemy.segments.splice(bodyHitIdx, 1);
						events.push({
							type: SimEventType.SEGMENT_DESTROYED,
							enemyId: enemy.id,
							enemyType: EnemyType.SEGMENTED,
							scoreGained: segmentScore,
							position: segPos,
						});
					}
				} else {
					// ── Standard single-unit collision ────────────────────
					const hit = circlesOverlap(proj.position, PROJECTILE_RADIUS, enemy.position, enemy.radius);
					if (hit) {
						projUsed.add(proj.id);
						enemy.hp--;
						if (enemy.hp <= 0) {
							enemiesKilled.add(enemy.id);
							events.push({
								type: SimEventType.ENEMY_KILLED,
								enemyId: enemy.id,
								enemyType: enemy.type,
								scoreGained: enemy.splitterGeneration === 1 ? ENEMY_SPLITTER_FRAGMENT_SCORE : ENEMY_SCORE[enemy.type],
								position: vec2Clone(enemy.position),
							});
							// Splitter fragments
							if (enemy.type === EnemyType.SPLITTER && enemy.splitterGeneration === 0) {
								for (let f = 0; f < ENEMY_SPLITTER_FRAGMENT_COUNT; f++) {
									const angle = (f / ENEMY_SPLITTER_FRAGMENT_COUNT) * Math.PI * 2;
									const frag = buildSplitterFragment(model, enemy.position, angle);
									model.enemies.push(frag);
									events.push({ type: SimEventType.ENEMY_SPAWNED, enemyId: frag.id, enemyType: EnemyType.DRIFTER });
								}
							}
						}
					}
				}
			}
		}

		model.projectiles = model.projectiles.filter(p => !projUsed.has(p.id));
		model.enemies = model.enemies.filter(e => !enemiesKilled.has(e.id));
	}

	// ── Step 8: Player-enemy collisions ───────────────────────────────

	private resolvePlayerEnemyCollisions(model: GameModel, events: SimEvent[]): void {
		if (model.player.invulnerableTimer > 0) return;

		const playerPos = model.player.position;
		for (const enemy of model.enemies) {
			let hit = circlesOverlap(playerPos, PLAYER_RADIUS, enemy.position, enemy.radius);
			// Segmented body segments are also lethal
			if (!hit && enemy.type === EnemyType.SEGMENTED) {
				for (const seg of enemy.segments) {
					if (circlesOverlap(playerPos, PLAYER_RADIUS, seg, enemy.radius)) {
						hit = true;
						break;
					}
				}
			}

			if (hit) {
				model.lives--;
				model.killStreak = 0;
				model.multiplier = 1;
				model.player.invulnerableTimer = INVULNERABLE_DURATION;
				// Reset player to center
				model.player.position = { x: ARENA_WIDTH / 2, y: ARENA_HEIGHT / 2 };
				model.player.velocity = { x: 0, y: 0 };
				events.push({ type: SimEventType.PLAYER_HIT });
				events.push({ type: SimEventType.MULTIPLIER_CHANGED, newMultiplier: 1 });

				if (model.lives <= 0) {
					model.state = GameState.GAME_OVER;
					events.push({ type: SimEventType.GAME_OVER });
				}
				// Only one hit per frame
				return;
			}
		}
	}

	// ── Step 9: Score application ──────────────────────────────────────

	private applyKillScores(model: GameModel, events: SimEvent[]): void {
		for (const evt of events) {
			if (evt.type !== SimEventType.ENEMY_KILLED) continue;
			const baseScore = evt.scoreGained ?? 0;
			const gained = baseScore * model.multiplier;
			model.score += gained;
			evt.scoreGained = gained; // update event with multiplied value

			model.killStreak++;
			const newLevel = getMultiplierLevel(model.killStreak);
			const newMult = MULTIPLIER_VALUES[newLevel];
			if (newMult !== model.multiplier) {
				model.multiplier = newMult;
				events.push({ type: SimEventType.MULTIPLIER_CHANGED, newMultiplier: newMult });
			}
		}
	}

	// ── Step 10a: Reward checks ────────────────────────────────────────

	private checkRewards(model: GameModel, events: SimEvent[]): void {
		const newLifeThresholds = pendingThresholds(model.score, EXTRA_LIFE_SCORE_THRESHOLDS, model.awardedLifeThresholds);
		for (const t of newLifeThresholds) {
			model.lives++;
			model.awardedLifeThresholds.add(t);
			events.push({ type: SimEventType.EXTRA_LIFE_AWARDED });
		}

		const newBombThresholds = pendingThresholds(model.score, EXTRA_BOMB_SCORE_THRESHOLDS, model.awardedBombThresholds);
		for (const t of newBombThresholds) {
			model.bombs++;
			model.awardedBombThresholds.add(t);
			events.push({ type: SimEventType.EXTRA_BOMB_AWARDED });
		}
	}

	// ── Step 10b: Enemy spawning ───────────────────────────────────────

	private updateSpawning(model: GameModel, events: SimEvent[], dt: number): void {
		const maxEnemies = getMaxEnemies(model.elapsed);
		if (model.enemies.length >= maxEnemies) {
			model.spawnTimer = 0;
			return;
		}

		model.spawnTimer -= dt;
		if (model.spawnTimer > 0) return;

		// Reset timer
		model.spawnTimer = getSpawnInterval(model.elapsed);

		const types = getAvailableEnemyTypes(model.elapsed);
		const type = model.rng.pick(types);
		const enemy = buildEnemy(model, type);
		model.enemies.push(enemy);
		events.push({ type: SimEventType.ENEMY_SPAWNED, enemyId: enemy.id, enemyType: enemy.type });
	}

	// ── Public query helpers (used by tests & ECS layer) ──────────────

	/** Returns the current spawn interval for a given elapsed time. */
	static getSpawnInterval(elapsed: number): number {
		return getSpawnInterval(elapsed);
	}

	/** Returns available enemy types for a given elapsed time. */
	static getAvailableEnemyTypes(elapsed: number): EnemyType[] {
		return getAvailableEnemyTypes(elapsed);
	}

	/** Returns the current max enemy count for a given elapsed time. */
	static getMaxEnemies(elapsed: number): number {
		return getMaxEnemies(elapsed);
	}
}
