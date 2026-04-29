import {
	ARENA_WIDTH, ARENA_HEIGHT,
	EnemyType, GameState,
	PLAYER_INITIAL_LIVES, PLAYER_INITIAL_BOMBS,
	EXTRA_LIFE_SCORE_THRESHOLDS, EXTRA_BOMB_SCORE_THRESHOLDS,
	ENEMY_BLACK_HOLE_SPAWN_INTERVAL,
} from '../constants';
import { SeededRandom } from './seeded-random';

// ============================================================
// Primitive 2-D vector — plain object to stay dependency-free
// ============================================================
export interface Vec2 {
	x: number;
	y: number;
}

export function vec2(x: number, y: number): Vec2 {
	return { x, y };
}

export function vec2Add(a: Vec2, b: Vec2): Vec2 {
	return { x: a.x + b.x, y: a.y + b.y };
}

export function vec2Scale(v: Vec2, s: number): Vec2 {
	return { x: v.x * s, y: v.y * s };
}

export function vec2Length(v: Vec2): number {
	return Math.sqrt(v.x * v.x + v.y * v.y);
}

export function vec2Normalize(v: Vec2): Vec2 {
	const len = vec2Length(v);
	if (len === 0) return { x: 0, y: 0 };
	return { x: v.x / len, y: v.y / len };
}

export function vec2Distance(a: Vec2, b: Vec2): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return Math.sqrt(dx * dx + dy * dy);
}

export function vec2DistanceSq(a: Vec2, b: Vec2): number {
	const dx = a.x - b.x;
	const dy = a.y - b.y;
	return dx * dx + dy * dy;
}

export function vec2Clone(v: Vec2): Vec2 {
	return { x: v.x, y: v.y };
}

// ============================================================
// Entity state types
// ============================================================

export interface PlayerData {
	position: Vec2;
	velocity: Vec2;
	/** Aim direction in radians (0 = right) */
	aimAngle: number;
	/** Seconds remaining until next shot is allowed */
	fireCooldown: number;
	/** Seconds of remaining invulnerability (0 = not invulnerable) */
	invulnerableTimer: number;
}

export interface EnemyData {
	id: number;
	type: EnemyType;
	position: Vec2;
	velocity: Vec2;
	hp: number;
	radius: number;
	/**
	 * Multi-purpose per-type state:
	 * - Spinner: current orbit angle (radians)
	 * - Pursuer: accumulated elapsed time for speed scaling
	 * - Segmented: head trail buffer index
	 * - Splitter: generation (0=large, 1=fragment)
	 * - Gravity Well: unused
	 */
	phase: number;
	/** Body segment positions for SEGMENTED type (trail of past head positions) */
	segments: Vec2[];
	/** How many times this splitter was already fragmented (0=original) */
	splitterGeneration: number;
}

export interface ProjectileData {
	id: number;
	position: Vec2;
	velocity: Vec2;
	/** Remaining lifetime in seconds */
	lifetime: number;
}

// ============================================================
// Top-level game model (all mutable state)
// ============================================================

export interface GameModel {
	state: GameState;
	player: PlayerData;
	enemies: EnemyData[];
	projectiles: ProjectileData[];

	score: number;
	multiplier: number;
	/** Consecutive kills since last death */
	killStreak: number;
	/** Kill streak needed to reach the next multiplier level */
	killStreakForNextMultiplier: number;

	lives: number;
	bombs: number;

	/** Total seconds elapsed since game start */
	elapsed: number;
	/** Seconds until next enemy spawn */
	spawnTimer: number;

	nextEnemyId: number;
	nextProjectileId: number;

	/** Score thresholds already converted to an extra life (avoids double-award) */
	awardedLifeThresholds: Set<number>;
	/** Score thresholds already converted to an extra bomb */
	awardedBombThresholds: Set<number>;

	/** Seconds until the next BLACK_HOLE spawns */
	blackHoleTimer: number;

	rng: SeededRandom;
}

// ============================================================
// Input snapshot — fully describes one frame of player intent
// ============================================================
export interface InputState {
	/** Horizontal movement axis in [-1, 1] */
	moveX: number;
	/** Vertical movement axis in [-1, 1] */
	moveY: number;
	/** Visual facing direction in radians (driven by WASD movement) */
	aimAngle: number;
	/** Independent shoot direction in radians (driven by arrow keys or mouse) */
	shootAngle: number;
	fire: boolean;
	bomb: boolean;
}

// ============================================================
// Factory
// ============================================================

export function createInitialModel(
	seed = 12345,
	lives = PLAYER_INITIAL_LIVES,
	bombs = PLAYER_INITIAL_BOMBS,
): GameModel {
	return {
		state: GameState.PLAYING,
		player: {
			position: vec2(ARENA_WIDTH / 2, ARENA_HEIGHT / 2),
			velocity: vec2(0, 0),
			aimAngle: 0,
			fireCooldown: 0,
			invulnerableTimer: 0,
		},
		enemies: [],
		projectiles: [],

		score: 0,
		multiplier: 1,
		killStreak: 0,
		killStreakForNextMultiplier: 5,

		lives,
		bombs,

		elapsed: 0,
		spawnTimer: 0,
		blackHoleTimer: ENEMY_BLACK_HOLE_SPAWN_INTERVAL,

		nextEnemyId: 1,
		nextProjectileId: 1,

		awardedLifeThresholds: new Set<number>(),
		awardedBombThresholds: new Set<number>(),

		rng: new SeededRandom(seed),
	};
}

/** Returns a shallow clone of the model (entities arrays are fresh copies of the same objects). */
export function cloneModel(m: GameModel): GameModel {
	return {
		...m,
		player: {
			...m.player,
			position: vec2Clone(m.player.position),
			velocity: vec2Clone(m.player.velocity),
		},
		enemies: m.enemies.map(e => ({
			...e,
			position: vec2Clone(e.position),
			velocity: vec2Clone(e.velocity),
			segments: e.segments.map(vec2Clone),
		})),
		projectiles: m.projectiles.map(p => ({
			...p,
			position: vec2Clone(p.position),
			velocity: vec2Clone(p.velocity),
		})),
		awardedLifeThresholds: new Set(m.awardedLifeThresholds),
		awardedBombThresholds: new Set(m.awardedBombThresholds),
		rng: m.rng.clone(),
	};
}

/** Unused thresholds from a sorted list that haven't been awarded yet. */
export function pendingThresholds(score: number, thresholds: number[], awarded: Set<number>): number[] {
	return thresholds.filter(t => score >= t && !awarded.has(t));
}

export { EXTRA_LIFE_SCORE_THRESHOLDS, EXTRA_BOMB_SCORE_THRESHOLDS };
