// ============================================================
// Arena
// ============================================================
export const ARENA_WIDTH = 800;
export const ARENA_HEIGHT = 600;

// ============================================================
// Player
// ============================================================
export const PLAYER_RADIUS = 12;
export const PLAYER_MAX_SPEED = 220;
export const PLAYER_ACCEL = 500;
export const PLAYER_DECEL = 350;
export const PLAYER_INITIAL_LIVES = 3;
export const PLAYER_INITIAL_BOMBS = 2;
export const INVULNERABLE_DURATION = 2.5; // seconds after taking a hit

// ============================================================
// Shooting
// ============================================================
export const FIRE_RATE = 0.14; // seconds between shots
export const PROJECTILE_SPEED = 480;
export const PROJECTILE_LIFETIME = 1.8; // seconds
export const PROJECTILE_RADIUS = 4;

// ============================================================
// Multi-shot weapon tiers (score-gated, alternating every 10k)
// ============================================================
export const MULTISHOT_SCORE_THRESHOLD = 10000;
// 30° total fan for the 5-shot tier (slight dispersion)
export const MULTISHOT_5_SPREAD = Math.PI / 6;
// 60° total fan for the 10-shot tier (uniform, no random jitter)
export const MULTISHOT_10_SPREAD = Math.PI / 3;

// ============================================================
// Enemy configuration
// ============================================================
export const ENEMY_MIN_SPAWN_DISTANCE = 120; // minimum distance from player when spawning

export const ENEMY_DRIFTER_RADIUS = 14;
export const ENEMY_DRIFTER_SPEED = 80;
export const ENEMY_DRIFTER_SCORE = 100;
export const ENEMY_DRIFTER_HP = 1;

export const ENEMY_PURSUER_RADIUS = 12;
export const ENEMY_PURSUER_BASE_SPEED = 90;
export const ENEMY_PURSUER_MAX_SPEED = 200;
export const ENEMY_PURSUER_SCORE = 150;
export const ENEMY_PURSUER_HP = 1;

export const ENEMY_SPINNER_RADIUS = 16;
export const ENEMY_SPINNER_ORBIT_SPEED = 2.2; // rad/s for circular motion
export const ENEMY_SPINNER_DRIFT_SPEED = 40;
export const ENEMY_SPINNER_SCORE = 200;
export const ENEMY_SPINNER_HP = 1;

export const ENEMY_SEGMENTED_RADIUS = 10;
export const ENEMY_SEGMENTED_SPEED = 70;
export const ENEMY_SEGMENTED_SCORE = 400;
export const ENEMY_SEGMENTED_HP = 1;
export const ENEMY_SEGMENTED_SEGMENTS = 6;
export const ENEMY_SEGMENTED_SEGMENT_SPACING = 22; // pixels between segments

export const ENEMY_SPLITTER_RADIUS = 22;
export const ENEMY_SPLITTER_SPEED = 60;
export const ENEMY_SPLITTER_SCORE = 250;
export const ENEMY_SPLITTER_HP = 1;
export const ENEMY_SPLITTER_FRAGMENT_COUNT = 3;
export const ENEMY_SPLITTER_FRAGMENT_RADIUS = 10;
export const ENEMY_SPLITTER_FRAGMENT_SPEED = 110;
export const ENEMY_SPLITTER_FRAGMENT_SCORE = 50;

export const ENEMY_GRAVITY_WELL_RADIUS = 18;
export const ENEMY_GRAVITY_WELL_PULL_RADIUS = 160;
export const ENEMY_GRAVITY_WELL_PULL_STRENGTH = 18000;
export const ENEMY_GRAVITY_WELL_SCORE = 500;
export const ENEMY_GRAVITY_WELL_HP = 3;

// ============================================================
// Spawning / Difficulty
// ============================================================
export const SPAWN_INTERVAL_INITIAL = 2.0; // seconds
export const SPAWN_INTERVAL_MIN = 0.5;
export const SPAWN_INTERVAL_DECAY = 0.25; // seconds less per minute elapsed
export const SPAWN_MAX_ENEMIES_INITIAL = 8;
export const SPAWN_MAX_ENEMIES_CAP = 35;
export const SPAWN_MAX_ENEMIES_GROWTH = 3; // extra per minute elapsed

// Elapsed-time (seconds) at which each enemy type becomes available
export const ENEMY_UNLOCK_PURSUER = 12;
export const ENEMY_UNLOCK_SPINNER = 22;
export const ENEMY_UNLOCK_SEGMENTED = 35;
export const ENEMY_UNLOCK_SPLITTER = 50;
export const ENEMY_UNLOCK_GRAVITY_WELL = 70;

// ============================================================
// Scoring / Multiplier
// ============================================================
// killStreak thresholds to reach next multiplier level
export const MULTIPLIER_KILL_THRESHOLDS = [5, 15, 30, 60, 100, 150];
// multiplier values (index 0 = base, index N = after Nth threshold)
export const MULTIPLIER_VALUES = [1, 2, 3, 4, 6, 8, 10];

// ============================================================
// Reward thresholds
// ============================================================
export const EXTRA_LIFE_SCORE_THRESHOLDS = [5000, 15000, 30000, 50000];
export const EXTRA_BOMB_SCORE_THRESHOLDS = [2000, 8000, 20000, 40000];

// ============================================================
// Enums
// ============================================================
export enum GameState {
	READY = 'READY',
	PLAYING = 'PLAYING',
	PAUSED = 'PAUSED',
	GAME_OVER = 'GAME_OVER',
}

export enum EnemyType {
	DRIFTER = 'DRIFTER',
	PURSUER = 'PURSUER',
	SPINNER = 'SPINNER',
	SEGMENTED = 'SEGMENTED',
	SPLITTER = 'SPLITTER',
	GRAVITY_WELL = 'GRAVITY_WELL',
}

export enum SimEventType {
	ENEMY_KILLED = 'ENEMY_KILLED',
	PLAYER_HIT = 'PLAYER_HIT',
	BOMB_USED = 'BOMB_USED',
	EXTRA_LIFE_AWARDED = 'EXTRA_LIFE_AWARDED',
	EXTRA_BOMB_AWARDED = 'EXTRA_BOMB_AWARDED',
	MULTIPLIER_CHANGED = 'MULTIPLIER_CHANGED',
	GAME_OVER = 'GAME_OVER',
	ENEMY_SPAWNED = 'ENEMY_SPAWNED',
	/** One segment (head or body piece) of a SEGMENTED enemy was destroyed */
	SEGMENT_DESTROYED = 'SEGMENT_DESTROYED',
}

export enum Messages {
	GAME_STATE_CHANGED = 'STATE_CHANGE_GAME',
	SCORE_CHANGED = 'STATE_CHANGE_SCORE',
	LIVES_CHANGED = 'STATE_CHANGE_LIVES',
	BOMBS_CHANGED = 'STATE_CHANGE_BOMBS',
	MULTIPLIER_CHANGED = 'STATE_CHANGE_MULTIPLIER',
	PLAYER_HIT = 'PLAYER_HIT',
	BOMB_USED = 'BOMB_USED',
}

export enum Tags {
	PLAYER = 'player',
	ENEMY = 'enemy',
	PROJECTILE = 'projectile',
	HUD = 'hud',
	ARENA = 'arena',
}
