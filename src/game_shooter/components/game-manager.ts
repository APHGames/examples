import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { GameModel, InputState, createInitialModel, EnemyData, ProjectileData, Vec2 } from '../model/game-model';
import { GameSimulator, SimEvent } from '../model/game-simulator';
import {
	SimEventType, EnemyType, GameState, Tags, Messages, ARENA_WIDTH, ARENA_HEIGHT,
	GRID_SPACING, WAVE_INFLUENCE_RADIUS, WAVE_AMP, BLACK_HOLE_GRID_PULL,
	BLACK_HOLE_GRID_PULL_CAP, GRAVITY_WELL_GRID_PULL_CAP,
	MULTISHOT_SCORE_THRESHOLD, ENEMY_BLACK_HOLE_RADIUS, ENEMY_BLACK_HOLE_CONSUME_TO_EXPLODE,
	ENEMY_GRAVITY_WELL_GRID_PULL, ENEMY_GRAVITY_WELL_PULL_RADIUS,
} from '../constants';
import { HudController } from './hud-controller';

// ============================================================
// Drawing helpers — PIXI.Graphics shapes for each entity type
// ============================================================

const COLORS = {
	player: 0xffffff,
	playerCore: 0x88ccff,
	drifter: 0x00ffff,
	pursuer: 0xff2244,
	spinner: 0xffee00,
	segmented: 0xcc44ff,
	splitter: 0x00ff66,
	gravityWell: 0xff8800,
	blackHole: 0x220044,
	blackHoleBorder: 0xaa00ff,
	blackHoleShard: 0xdd88ff,
	projectile: 0xffff88,
	arenaEdge: 0x223344,
	grid: 0x1a3a55,
};

/**
 * Angular rocket shape — faces rightward at angle=0.
 * Drawn relative to origin; caller sets g.x/g.y.
 */
function drawPlayer(g: PIXI.Graphics, aimAngle: number, isInvulnerable: boolean): void {
	g.clear();
	const alpha = isInvulnerable ? 0.45 : 1.0;

	// Build rotated polygon points from local coords
	function rot(px: number, py: number): [number, number] {
		const c = Math.cos(aimAngle);
		const s = Math.sin(aimAngle);
		return [px * c - py * s, px * s + py * c];
	}

	// --- Main body (elongated diamond-ish fuselage) ---
	const body: [number, number][] = [
		rot(14, 0),    // nose tip
		rot(4, -5),    // upper-front shoulder
		rot(-10, -4),  // upper-rear body
		rot(-14, 0),   // tail center
		rot(-10, 4),   // lower-rear body
		rot(4, 5),     // lower-front shoulder
	];
	g.beginFill(COLORS.playerCore, alpha * 0.9);
	g.lineStyle(1.5, COLORS.player, alpha);
	g.moveTo(...body[0]);
	for (let i = 1; i < body.length; i++) g.lineTo(...body[i]);
	g.closePath();
	g.endFill();

	// --- Left wing ---
	const wingL: [number, number][] = [
		rot(2, -5),
		rot(-6, -13),
		rot(-12, -6),
		rot(-8, -3),
	];
	g.beginFill(COLORS.player, alpha * 0.7);
	g.lineStyle(1, COLORS.player, alpha * 0.8);
	g.moveTo(...wingL[0]);
	for (let i = 1; i < wingL.length; i++) g.lineTo(...wingL[i]);
	g.closePath();
	g.endFill();

	// --- Right wing ---
	const wingR: [number, number][] = [
		rot(2, 5),
		rot(-6, 13),
		rot(-12, 6),
		rot(-8, 3),
	];
	g.beginFill(COLORS.player, alpha * 0.7);
	g.lineStyle(1, COLORS.player, alpha * 0.8);
	g.moveTo(...wingR[0]);
	for (let i = 1; i < wingR.length; i++) g.lineTo(...wingR[i]);
	g.closePath();
	g.endFill();

	// --- Engine glow dot at tail ---
	const [ex, ey] = rot(-14, 0);
	g.beginFill(0x44aaff, alpha * 0.8);
	g.lineStyle(0);
	g.drawCircle(ex, ey, 3);
	g.endFill();
}

function drawDrifter(g: PIXI.Graphics, radius: number, isFrag: boolean): void {
	g.clear();
	const r = isFrag ? radius * 0.9 : radius;
	g.beginFill(COLORS.drifter, 0.25);
	g.lineStyle(2, COLORS.drifter, 1);
	g.drawPolygon([0, -r, r * 0.6, 0, 0, r, -r * 0.6, 0]);
	g.endFill();
}

function drawPursuer(g: PIXI.Graphics, radius: number): void {
	g.clear();
	g.beginFill(COLORS.pursuer, 0.25);
	g.lineStyle(2, COLORS.pursuer, 1);
	g.drawPolygon([0, -radius, radius, radius * 0.8, -radius, radius * 0.8]);
	g.endFill();
}

function drawSpinner(g: PIXI.Graphics, radius: number, phase: number): void {
	g.clear();
	g.beginFill(COLORS.spinner, 0.25);
	g.lineStyle(2, COLORS.spinner, 1);
	// Rotated square
	for (let i = 0; i < 4; i++) {
		const a = phase + (i / 4) * Math.PI * 2;
		const x = Math.cos(a) * radius;
		const y = Math.sin(a) * radius;
		if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
	}
	g.closePath();
	g.endFill();
}

function drawSegmented(g: PIXI.Graphics, radius: number, segments: Vec2[], headPos: Vec2): void {
	g.clear();
	// Body segments
	g.beginFill(0xaa44ff, 0.4);
	g.lineStyle(1, COLORS.segmented, 0.7);
	for (const seg of segments) {
		g.drawCircle(seg.x - headPos.x, seg.y - headPos.y, radius * 0.9);
	}
	g.endFill();
	// Head
	g.beginFill(COLORS.segmented, 0.5);
	g.lineStyle(2, COLORS.segmented, 1);
	g.drawCircle(0, 0, radius);
	g.endFill();
}

function drawSplitter(g: PIXI.Graphics, radius: number): void {
	g.clear();
	g.beginFill(COLORS.splitter, 0.2);
	g.lineStyle(2, COLORS.splitter, 1);
	// Hexagon
	for (let i = 0; i < 6; i++) {
		const a = (i / 6) * Math.PI * 2 - Math.PI / 6;
		const x = Math.cos(a) * radius;
		const y = Math.sin(a) * radius;
		if (i === 0) g.moveTo(x, y); else g.lineTo(x, y);
	}
	g.closePath();
	g.endFill();
}

function drawGravityWell(g: PIXI.Graphics, radius: number, _phase: number): void {
	g.clear();
	const t = Date.now() * 0.001;
	// Primary beat: 2.2 Hz, secondary beat: 0.7 Hz — creates irregular "heartbeat" feel
	const pulse = 0.55 + 0.45 * Math.sin(t * 2.2 * Math.PI * 2) * (0.8 + 0.2 * Math.sin(t * 0.7 * Math.PI * 2));
	const pr = radius + pulse * 10; // radius breathes ±10px

	// Outer energy rings — 3 layers, staggered fade
	for (let ring = 4; ring >= 1; ring--) {
		const rr = pr + ring * 16 + Math.sin(t * 1.9 + ring * 0.8) * (3 + pulse * 5);
		g.lineStyle(1.8 - ring * 0.3, COLORS.gravityWell, pulse * 0.18 * (5 - ring) / 4);
		g.drawCircle(0, 0, rr);
	}

	// Inner halo
	g.lineStyle(2, COLORS.gravityWell, 0.25 + pulse * 0.4);
	g.drawCircle(0, 0, pr + 12);

	// Core fill — brightens with pulse
	g.beginFill(COLORS.gravityWell, 0.12 + pulse * 0.28);
	g.lineStyle(2.5, COLORS.gravityWell, 0.7 + pulse * 0.3);
	g.drawCircle(0, 0, pr);
	g.endFill();

	// Rotating swirl dots (3 arms)
	for (let i = 0; i < 3; i++) {
		const a = t * 2.4 + (i / 3) * Math.PI * 2;
		const sr = pr * (0.55 + pulse * 0.15);
		g.beginFill(COLORS.gravityWell, 0.5 + pulse * 0.4);
		g.lineStyle(0);
		g.drawCircle(Math.cos(a) * sr, Math.sin(a) * sr, 3 + pulse * 2);
		g.endFill();
	}
}

function drawBlackHole(g: PIXI.Graphics, radius: number, phase: number): void {
	g.clear();
	const t = Date.now() * 0.001;

	// Danger ratio: 0 = fresh, 1 = about to explode
	const danger = Math.min(phase / ENEMY_BLACK_HOLE_CONSUME_TO_EXPLODE, 1);

	// Two superimposed beats for organic, non-uniform pulsation
	const pulseHz = 1.5 + danger * 5.5;            // 1.5 → 7 Hz
	const beat1   = Math.sin(t * pulseHz * Math.PI * 2);
	const beat2   = 0.4 * Math.sin(t * pulseHz * Math.PI * 4.0 + 0.9); // 2nd harmonic
	const pulse   = 0.5 + 0.5 * (beat1 + beat2) / 1.4;  // normalised 0→1

	// Outer glow radius expands dramatically on each pulse
	const glowBurst = pulse * (12 + danger * 30);

	// ── Far corona — 5 staggered rings ──────────────────────────────
	for (let ring = 5; ring >= 1; ring--) {
		const ringOsc = Math.sin(t * (pulseHz * 0.6) + ring * 0.9) * (2 + danger * 8);
		const rr = radius + ring * 15 + glowBurst + ringOsc;
		const brightness = (0.08 + danger * 0.35) * pulse * ((6 - ring) / 5);
		const ringColor  = danger > 0.5
			? lerpColor(COLORS.blackHoleBorder, 0xff1155, Math.min((danger - 0.5) / 0.5, 1))
			: COLORS.blackHoleBorder;
		g.lineStyle(1.2 + danger * 1.8 * pulse, ringColor, Math.min(brightness, 1));
		g.drawCircle(0, 0, rr);
	}

	// ── Accretion disc glow ──────────────────────────────────────────
	const glowR = radius + 10 + glowBurst * 0.6;
	const glowAlpha = 0.07 + danger * 0.22 + pulse * 0.12;
	g.beginFill(COLORS.blackHoleBorder, glowAlpha);
	g.lineStyle(0);
	g.drawCircle(0, 0, glowR);
	g.endFill();

	// ── Core ─────────────────────────────────────────────────────────
	// Core breathes inversely — contracts on beat peak, expands on trough
	const coreBreath = radius * (0.9 - pulse * 0.18 * (1 + danger * 0.8));
	const coreR      = Math.max(coreBreath, radius * 0.4);
	const borderColor = danger > 0.5
		? lerpColor(COLORS.blackHoleBorder, 0xff1155, (danger - 0.5) / 0.5)
		: COLORS.blackHoleBorder;
	g.beginFill(COLORS.blackHole, 1);
	g.lineStyle(2.5 + danger * 3 * pulse, borderColor, 1);
	g.drawCircle(0, 0, coreR);
	g.endFill();

	// ── Orbital swirl dots (4 arms, counter + co-rotating) ──────────
	const swirlSpeed = 1.8 + danger * 4.5;
	for (let i = 0; i < 4; i++) {
		// Outer arm
		const aOut = t * swirlSpeed + (i / 4) * Math.PI * 2;
		const srOut = coreR + 6 + pulse * (4 + danger * 10);
		g.beginFill(borderColor, 0.45 + pulse * 0.45);
		g.lineStyle(0);
		g.drawCircle(Math.cos(aOut) * srOut, Math.sin(aOut) * srOut, 2.5 + danger * 2.5 * pulse);
		g.endFill();

		// Inner counter-rotating dot
		const aIn = -t * (swirlSpeed * 0.7) + (i / 4) * Math.PI * 2 + Math.PI / 4;
		const srIn = coreR * 0.55;
		g.beginFill(borderColor, 0.3 + pulse * 0.3);
		g.lineStyle(0);
		g.drawCircle(Math.cos(aIn) * srIn, Math.sin(aIn) * srIn, 2 + danger * 1.5);
		g.endFill();
	}

	// ── Progress arc — turns red and fills as black hole feeds ───────
	if (phase > 0) {
		const arcColor = lerpColor(COLORS.blackHoleBorder, 0xff1155, danger);
		const arcThick = 2.5 + danger * 3 * pulse;
		g.lineStyle(arcThick, arcColor, 0.85 + pulse * 0.15);
		g.arc(0, 0, coreR + arcThick, -Math.PI / 2, -Math.PI / 2 + danger * Math.PI * 2);
	}
}

function drawBlackHoleShard(g: PIXI.Graphics, radius: number): void {
	g.clear();
	g.beginFill(COLORS.blackHoleShard, 0.85);
	g.lineStyle(1, 0xffffff, 0.6);
	// Small jagged diamond
	g.drawPolygon([0, -radius, radius * 0.5, 0, 0, radius * 0.7, -radius * 0.5, 0]);
	g.endFill();
}

function drawProjectile(g: PIXI.Graphics): void {
	g.clear();
	g.beginFill(COLORS.projectile, 0.9);
	g.lineStyle(1, 0xffffff, 0.5);
	g.drawCircle(0, 0, 4);
	g.endFill();
}

// ============================================================
// Particle system — purely visual, no model state
// ============================================================

interface Particle {
	g: PIXI.Graphics;
	vx: number;
	vy: number;
	life: number;
	maxLife: number;
}

class ParticleSystem {
	private particles: Particle[] = [];
	private layer: PIXI.Container;
	private rng: { nextRange: (a: number, b: number) => number };

	constructor(layer: PIXI.Container) {
		this.layer = layer;
		// Lightweight inline RNG so we don't depend on SeededRandom
		let seed = 0xdeadbeef;
		this.rng = {
			nextRange: (a: number, b: number) => {
				seed = ((seed * 1664525 + 1013904223) >>> 0);
				return a + (seed / 0x100000000) * (b - a);
			},
		};
	}

	spawnExplosion(x: number, y: number, color: number, count: number): void {
		for (let i = 0; i < count; i++) {
			const angle = this.rng.nextRange(0, Math.PI * 2);
			const speed = this.rng.nextRange(60, 260);
			const radius = this.rng.nextRange(2, 5);
			const lifetime = this.rng.nextRange(0.3, 0.7);

			const g = new PIXI.Graphics();
			g.beginFill(color, 1);
			g.drawCircle(0, 0, radius);
			g.endFill();
			g.x = x;
			g.y = y;
			this.layer.addChild(g);

			this.particles.push({
				g,
				vx: Math.cos(angle) * speed,
				vy: Math.sin(angle) * speed,
				life: lifetime,
				maxLife: lifetime,
			});
		}
	}

	update(dt: number): void {
		const surviving: Particle[] = [];
		for (const p of this.particles) {
			p.life -= dt;
			if (p.life <= 0) {
				p.g.parent?.removeChild(p.g);
				p.g.destroy();
				continue;
			}
			p.g.x += p.vx * dt;
			p.g.y += p.vy * dt;
			p.g.alpha = p.life / p.maxLife;
			// Shrink slightly as it fades
			const s = p.life / p.maxLife;
			p.g.scale.set(s);
			surviving.push(p);
		}
		this.particles = surviving;
	}

	destroy(): void {
		for (const p of this.particles) {
			p.g.parent?.removeChild(p.g);
			p.g.destroy();
		}
		this.particles = [];
	}
}

// Per-enemy-type explosion color lookup
function explosionColor(type: EnemyType): number {
	switch (type) {
	case EnemyType.DRIFTER: return 0x00ffff;
	case EnemyType.PURSUER: return 0xff2244;
	case EnemyType.SPINNER: return 0xffee00;
	case EnemyType.SEGMENTED: return 0xcc44ff;
	case EnemyType.SPLITTER: return 0x00ff66;
	case EnemyType.GRAVITY_WELL: return 0xff8800;
	case EnemyType.BLACK_HOLE: return 0xaa00ff;
	case EnemyType.BLACKHOLE_SHARD: return 0xdd88ff;
	default: return 0xffffff;
	}
}

// ============================================================
// Gravitational wave mesh grid
// ============================================================

/**
 * Wave spring constants — tune these to change the "feel" of the ripple.
 * SPRING_K:  stiffness — how fast the wave chases the projectile target
 * DAMPING:   how quickly it comes to rest (critically damped ≈ 2*sqrt(SPRING_K))
 */
const WAVE_SPRING_K = 30;   // rad²/s²  (natural freq ≈ 0.87 Hz)
const WAVE_DAMPING  = 11;   // 1/s       (critically damped at ~0.92)

class GridSystem {
	private g: PIXI.Graphics;
	private restX:   Float32Array;
	private restY:   Float32Array;
	// Spring-damper state for projectile wave (smooth, no glitching)
	private waveX:   Float32Array;  // current smoothed displacement
	private waveY:   Float32Array;
	private velWX:   Float32Array;  // wave displacement velocity
	private velWY:   Float32Array;
	// Final positions
	private dispX:   Float32Array;
	private dispY:   Float32Array;
	private cols:    number;
	private rows:    number;
	private n:       number;

	constructor(layer: PIXI.Container) {
		this.g = new PIXI.Graphics();
		layer.addChild(this.g);

		this.cols = Math.ceil(ARENA_WIDTH  / GRID_SPACING) + 1;
		this.rows = Math.ceil(ARENA_HEIGHT / GRID_SPACING) + 1;
		this.n    = this.cols * this.rows;

		this.restX = new Float32Array(this.n);
		this.restY = new Float32Array(this.n);
		this.waveX = new Float32Array(this.n);
		this.waveY = new Float32Array(this.n);
		this.velWX = new Float32Array(this.n);
		this.velWY = new Float32Array(this.n);
		this.dispX = new Float32Array(this.n);
		this.dispY = new Float32Array(this.n);

		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				const i = r * this.cols + c;
				this.restX[i] = c * GRID_SPACING;
				this.restY[i] = r * GRID_SPACING;
			}
		}
	}

	update(model: GameModel, waveStrong: boolean, dt: number): void {
		// waveStrong (10-shot tier) → 20% amplitude so it doesn't overwhelm the mesh
		const amp = waveStrong ? WAVE_AMP * 0.2 : WAVE_AMP;
		const t   = Date.now() * 0.001;

		const clampedDt = Math.min(dt, 0.05); // guard against lag spikes

		for (let i = 0; i < this.n; i++) {
			const rx = this.restX[i];
			const ry = this.restY[i];

			// ── Projectile wave target (spring chases this) ───────────
			let targetX = 0;
			let targetY = 0;
			for (const proj of model.projectiles) {
				const ex = rx - proj.position.x;
				const ey = ry - proj.position.y;
				const dist = Math.sqrt(ex * ex + ey * ey);
				if (dist > 1 && dist < WAVE_INFLUENCE_RADIUS) {
					const str = amp * (1 - dist / WAVE_INFLUENCE_RADIUS);
					targetX += (ex / dist) * str;
					targetY += (ey / dist) * str;
				}
			}

			// Spring-damper integration: smooth, physically plausible ripple
			// acc = spring_force - damping * velocity
			const axW = (targetX - this.waveX[i]) * WAVE_SPRING_K - this.velWX[i] * WAVE_DAMPING;
			const ayW = (targetY - this.waveY[i]) * WAVE_SPRING_K - this.velWY[i] * WAVE_DAMPING;
			this.velWX[i] += axW * clampedDt;
			this.velWY[i] += ayW * clampedDt;
			this.waveX[i] += this.velWX[i] * clampedDt;
			this.waveY[i] += this.velWY[i] * clampedDt;

			// ── Gravitational displacement (instant — attractors are static) ──
			let gx = 0;
			let gy = 0;

			for (const e of model.enemies) {
				if (e.type !== EnemyType.BLACK_HOLE && e.type !== EnemyType.GRAVITY_WELL) continue;

				const bx = e.position.x - rx;
				const by = e.position.y - ry;
				const distSq = bx * bx + by * by;
				const dist   = Math.sqrt(distSq);
				if (dist < 1) continue;

				if (e.type === EnemyType.BLACK_HOLE) {
					// Pulsating field: frequency and amplitude both scale with danger
					const danger    = Math.min(e.phase / ENEMY_BLACK_HOLE_CONSUME_TO_EXPLODE, 1);
					const pulseHz   = 1.8 + danger * 6.0;           // 1.8→7.8 Hz
					const pulseAmp  = 0.55 + danger * 0.45;         // 0.55→1.0 of base pull
					const gravPulse = 1 + pulseAmp * Math.sin(t * pulseHz * Math.PI * 2);
					const pull = Math.min(BLACK_HOLE_GRID_PULL * gravPulse / (distSq + 1), BLACK_HOLE_GRID_PULL_CAP);
					gx += (bx / dist) * pull;
					gy += (by / dist) * pull;
				} else {
					// Gravity well: 2.2 Hz pulsating local warp
					if (dist < ENEMY_GRAVITY_WELL_PULL_RADIUS) {
						const gwPulse = 1 + 0.5 * Math.sin(t * 2.2 * Math.PI * 2);
						const pull = Math.min(ENEMY_GRAVITY_WELL_GRID_PULL * gwPulse / (distSq + 1), GRAVITY_WELL_GRID_PULL_CAP);
						gx += (bx / dist) * pull;
						gy += (by / dist) * pull;
					}
				}
			}

			this.dispX[i] = rx + this.waveX[i] + gx;
			this.dispY[i] = ry + this.waveY[i] + gy;
		}

		// ── Render warping mesh ───────────────────────────────────────
		this.g.clear();

		for (let r = 0; r < this.rows; r++) {
			for (let c = 0; c < this.cols; c++) {
				const i  = r * this.cols + c;
				const px = this.dispX[i];
				const py = this.dispY[i];

				const ddx  = px - this.restX[i];
				const ddy  = py - this.restY[i];
				const disp = Math.sqrt(ddx * ddx + ddy * ddy);
				// Alpha: 0.15 at rest → 0.90 when heavily distorted
				const alpha = Math.min(0.15 + disp / 20, 0.90);
				// Colour: dark steel-blue → bright cyan → near-white at extremes
				const ct = Math.min(disp / 70, 1);
				const lineColor = lerpColor(0x152840, 0x00eeff, ct);
				const lw = 0.9 + ct * 0.5; // lines thicken slightly under distortion

				if (c < this.cols - 1) {
					const ni = i + 1;
					this.g.lineStyle(lw, lineColor, alpha);
					this.g.moveTo(px, py);
					this.g.lineTo(this.dispX[ni], this.dispY[ni]);
				}
				if (r < this.rows - 1) {
					const ni = (r + 1) * this.cols + c;
					this.g.lineStyle(lw, lineColor, alpha);
					this.g.moveTo(px, py);
					this.g.lineTo(this.dispX[ni], this.dispY[ni]);
				}
			}
		}
	}

	destroy(): void {
		this.g.parent?.removeChild(this.g);
		this.g.destroy();
	}
}

/** Linear-interpolate between two 0xRRGGBB colours (t in [0,1]). */
function lerpColor(a: number, b: number, t: number): number {
	const ar = (a >> 16) & 0xff;
	const ag = (a >>  8) & 0xff;
	const ab =  a        & 0xff;
	const br = (b >> 16) & 0xff;
	const bg = (b >>  8) & 0xff;
	const bb =  b        & 0xff;
	return ((Math.round(ar + (br - ar) * t) << 16) |
	        (Math.round(ag + (bg - ag) * t) <<  8) |
	         Math.round(ab + (bb - ab) * t));
}

// ============================================================
// Ring effect — expanding circle animation (bomb / black hole)
// ============================================================

interface RingEffect {
	g: PIXI.Graphics;
	x: number;
	y: number;
	radius: number;
	maxRadius: number;
	life: number;
	maxLife: number;
	color: number;
	lineWidth: number;
}

class RingEffectSystem {
	private rings: RingEffect[] = [];
	private layer: PIXI.Container;

	constructor(layer: PIXI.Container) {
		this.layer = layer;
	}

	spawn(x: number, y: number, maxRadius: number, life: number, color: number, lineWidth = 3): void {
		const g = new PIXI.Graphics();
		(this.layer as unknown as PIXI.Container).addChild(g);
		this.rings.push({ g, x, y, radius: 0, maxRadius, life, maxLife: life, color, lineWidth });
	}

	update(dt: number): void {
		const surviving: RingEffect[] = [];
		for (const r of this.rings) {
			r.life -= dt;
			if (r.life <= 0) {
				r.g.parent?.removeChild(r.g);
				r.g.destroy();
				continue;
			}
			const t = 1 - r.life / r.maxLife;
			r.radius = r.maxRadius * t;
			const alpha = r.life / r.maxLife;
			r.g.clear();
			r.g.lineStyle(r.lineWidth * alpha, r.color, alpha);
			r.g.drawCircle(r.x, r.y, r.radius);
			surviving.push(r);
		}
		this.rings = surviving;
	}

	destroy(): void {
		for (const r of this.rings) {
			r.g.parent?.removeChild(r.g);
			r.g.destroy();
		}
		this.rings = [];
	}
}

// ============================================================
// GameManager ECS component
// ============================================================

interface EntityPool {
	enemyContainers: Map<number, PIXI.Graphics>;
	projContainers: Map<number, PIXI.Graphics>;
	playerGraphics: PIXI.Graphics;
}

export class GameManager extends ECS.Component {
	private model: GameModel;
	private simulator: GameSimulator;
	private keyInput: ECS.KeyInputComponent;
	private pool: EntityPool;
	private hudController: HudController;
	private arenaLayer: PIXI.Container;
	private entityLayer: PIXI.Container;
	private hudLayer: PIXI.Container;
	private particles: ParticleSystem;
	private grid: GridSystem;
	private rings: RingEffectSystem;

	private mouseShootAngle = 0;
	/** Last direction the player aimed with arrow keys; persists so the next shot fires correctly even when keys are released */
	private lastArrowAngle = 0;
	private mouseHandler: (e: MouseEvent) => void;

	onInit() {
		this.model = (this.owner.getAttribute<GameModel>('model'));
		this.simulator = new GameSimulator();
		this.keyInput = this.scene.getGlobalAttribute<ECS.KeyInputComponent>('key_input');

		// Retrieve layer containers set up by Factory
		this.arenaLayer = this.scene.findObjectByName('arenaLayer') as unknown as PIXI.Container;
		this.entityLayer = this.scene.findObjectByName('entityLayer') as unknown as PIXI.Container;
		this.hudLayer = this.scene.findObjectByName('hudLayer') as unknown as PIXI.Container;

		// Player graphics
		const playerG = new PIXI.Graphics();
		this.entityLayer.addChild(playerG);
		this.pool = {
			enemyContainers: new Map(),
			projContainers: new Map(),
			playerGraphics: playerG,
		};

		// HUD
		this.hudController = new HudController(this.hudLayer, this.model);

		// Particle system (draws into entity layer)
		this.particles = new ParticleSystem(this.entityLayer as unknown as PIXI.Container);

		// Ring effect system (draws into entity layer)
		this.rings = new RingEffectSystem(this.entityLayer);

		// Mouse controls shoot angle
		this.mouseHandler = (e: MouseEvent) => {
			const canvas = this.scene.app.view as HTMLCanvasElement;
			const rect = canvas.getBoundingClientRect();
			const canvasX = e.clientX - rect.left;
			const canvasY = e.clientY - rect.top;
			const scaleX = ARENA_WIDTH / rect.width;
			const scaleY = ARENA_HEIGHT / rect.height;
			const worldX = canvasX * scaleX;
			const worldY = canvasY * scaleY;
			const dx = worldX - this.model.player.position.x;
			const dy = worldY - this.model.player.position.y;
			this.mouseShootAngle = Math.atan2(dy, dx);
		};
		(this.scene.app.view as HTMLCanvasElement).addEventListener('mousemove', this.mouseHandler);

		// drawArena MUST come before GridSystem so the background rect is below the grid dots
		this.drawArena();

		// Grid system (draws into arena layer, above the background)
		this.grid = new GridSystem(this.arenaLayer as unknown as PIXI.Container);
	}

	onRemove() {
		(this.scene.app.view as HTMLCanvasElement).removeEventListener('mousemove', this.mouseHandler);
		this.particles.destroy();
		this.grid.destroy();
		this.rings.destroy();
	}

	private drawArena(): void {
		if (!this.arenaLayer) return;
		const g = new PIXI.Graphics();
		// Background
		g.beginFill(0x050a12, 1);
		g.drawRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
		g.endFill();
		// Border glow layers
		for (let i = 3; i >= 1; i--) {
			g.lineStyle(i * 2, COLORS.arenaEdge, 0.15 * (4 - i));
			g.drawRect(i, i, ARENA_WIDTH - i * 2, ARENA_HEIGHT - i * 2);
		}
		g.lineStyle(2, 0x336688, 0.8);
		g.drawRect(0, 0, ARENA_WIDTH, ARENA_HEIGHT);
		(this.arenaLayer as unknown as PIXI.Container).addChild(g);
	}

	private buildInputState(): InputState {
		const keys = this.keyInput;

		// WASD → movement (checked every frame at 60 fps)
		let moveX = 0;
		let moveY = 0;
		if (keys.isKeyPressed(ECS.Keys.KEY_W)) moveY -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_S)) moveY += 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_A)) moveX -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_D)) moveX += 1;

		// Visual facing direction derived from WASD; retained when stationary
		let aimAngle = this.model.player.aimAngle;
		if (moveX !== 0 || moveY !== 0) {
			aimAngle = Math.atan2(moveY, moveX);
		}

		// Arrow keys → shoot direction, checked every frame
		let arrowX = 0;
		let arrowY = 0;
		if (keys.isKeyPressed(ECS.Keys.KEY_UP)) arrowY -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_DOWN)) arrowY += 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_LEFT)) arrowX -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_RIGHT)) arrowX += 1;

		const arrowsHeld = arrowX !== 0 || arrowY !== 0;

		// Always update lastArrowAngle while any arrow is held — direction is captured every frame
		if (arrowsHeld) {
			this.lastArrowAngle = Math.atan2(arrowY, arrowX);
		}

		// Shoot angle: arrows (current or last held) override mouse
		const shootAngle = arrowsHeld ? this.lastArrowAngle : this.mouseShootAngle;

		// Fire whenever any arrow is held OR spacebar
		const fire = arrowsHeld || keys.isKeyPressed(ECS.Keys.KEY_SPACE);
		const bomb = keys.isKeyPressed(ECS.Keys.KEY_B);

		return { moveX, moveY, aimAngle, shootAngle, fire, bomb };
	}

	onUpdate(delta: number): void {
		const dt = delta / 1000;

		// Visuals that keep animating regardless of game state
		this.particles.update(dt);
		this.rings.update(dt);

		if (this.model.state !== GameState.PLAYING) return;

		const input = this.buildInputState();
		const { events } = this.simulator.update(this.model, input, dt);
		this.processEvents(events);
		this.syncVisuals();

		// Grid: waveStrong = 10-shot tier (score ≥20k, even tier) → only 20% amplitude
		const tier = Math.floor(this.model.score / MULTISHOT_SCORE_THRESHOLD);
		const waveStrong = tier >= 2 && tier % 2 === 0;
		this.grid.update(this.model, waveStrong, dt);
	}

	private processEvents(events: SimEvent[]): void {
		for (const evt of events) {
			switch (evt.type) {
			case SimEventType.PLAYER_HIT:
				this.sendMessage(Messages.PLAYER_HIT);
				this.sendMessage(Messages.LIVES_CHANGED);
				this.sendMessage(Messages.MULTIPLIER_CHANGED);
				// Flash explosion at player respawn center
				this.particles.spawnExplosion(
					this.model.player.position.x,
					this.model.player.position.y,
					0xff6688, 30,
				);
				break;
			case SimEventType.MULTIPLIER_CHANGED:
				this.sendMessage(Messages.MULTIPLIER_CHANGED);
				break;
			case SimEventType.EXTRA_LIFE_AWARDED:
				this.sendMessage(Messages.LIVES_CHANGED);
				break;
			case SimEventType.EXTRA_BOMB_AWARDED:
				this.sendMessage(Messages.BOMBS_CHANGED);
				break;
			case SimEventType.BOMB_USED:
				this.sendMessage(Messages.BOMBS_CHANGED);
				// Expanding ring + small radial sparkle at player position
				this.rings.spawn(
					this.model.player.position.x,
					this.model.player.position.y,
					Math.max(ARENA_WIDTH, ARENA_HEIGHT),
					0.7, 0xffffff, 4,
				);
				this.particles.spawnExplosion(
					this.model.player.position.x,
					this.model.player.position.y,
					0xaaddff, 28,
				);
				break;
			case SimEventType.ENEMY_KILLED:
				this.sendMessage(Messages.SCORE_CHANGED);
				this.removeEnemyVisual(evt.enemyId);
				if (evt.position) {
					const isBlackHole = evt.enemyType === EnemyType.BLACK_HOLE;
					const count = isBlackHole ? 50 : 18;
					this.particles.spawnExplosion(evt.position.x, evt.position.y, explosionColor(evt.enemyType), count);
					if (isBlackHole) {
						// Dramatic expanding ring when the black hole explodes
						this.rings.spawn(evt.position.x, evt.position.y, 140, 0.6, 0xaa00ff, 3);
						this.rings.spawn(evt.position.x, evt.position.y, 100, 0.4, 0xffffff, 2);
					}
				}
				break;
			case SimEventType.SEGMENT_DESTROYED:
				// Partial score already applied in simulator; just show explosion
				this.sendMessage(Messages.SCORE_CHANGED);
				if (evt.position) {
					this.particles.spawnExplosion(evt.position.x, evt.position.y, 0xcc44ff, 8);
				}
				break;
			case SimEventType.GAME_OVER:
				this.sendMessage(Messages.GAME_STATE_CHANGED);
				this.showGameOver();
				break;
			}
		}
	}

	private removeEnemyVisual(id: number): void {
		const g = this.pool.enemyContainers.get(id);
		if (g) {
			g.parent?.removeChild(g);
			g.destroy();
			this.pool.enemyContainers.delete(id);
		}
	}

	private syncVisuals(): void {
		this.syncPlayer();
		this.syncEnemies();
		this.syncProjectiles();
		this.hudController.update(this.model);
	}

	private syncPlayer(): void {
		const player = this.model.player;
		const g = this.pool.playerGraphics;
		drawPlayer(g, player.aimAngle, player.invulnerableTimer > 0);
		g.x = player.position.x;
		g.y = player.position.y;
	}

	private syncEnemies(): void {
		const modelIds = new Set(this.model.enemies.map(e => e.id));

		// Remove stale visuals (enemies removed without ENEMY_KILLED event, e.g. from bomb)
		for (const [id, g] of this.pool.enemyContainers) {
			if (!modelIds.has(id)) {
				g.parent?.removeChild(g);
				g.destroy();
				this.pool.enemyContainers.delete(id);
			}
		}

		// Create or update
		for (const enemy of this.model.enemies) {
			let g = this.pool.enemyContainers.get(enemy.id);
			if (!g) {
				g = new PIXI.Graphics();
				(this.entityLayer as unknown as PIXI.Container).addChild(g);
				this.pool.enemyContainers.set(enemy.id, g);
			}
			this.redrawEnemy(g, enemy);
			g.x = enemy.position.x;
			g.y = enemy.position.y;
		}
	}

	private redrawEnemy(g: PIXI.Graphics, enemy: EnemyData): void {
		switch (enemy.type) {
		case EnemyType.DRIFTER:
			drawDrifter(g, enemy.radius, enemy.splitterGeneration > 0);
			break;
		case EnemyType.PURSUER:
			drawPursuer(g, enemy.radius);
			break;
		case EnemyType.SPINNER:
			drawSpinner(g, enemy.radius, enemy.phase);
			break;
		case EnemyType.SEGMENTED:
			drawSegmented(g, enemy.radius, enemy.segments, enemy.position);
			break;
		case EnemyType.SPLITTER:
			drawSplitter(g, enemy.radius);
			break;
		case EnemyType.GRAVITY_WELL:
			drawGravityWell(g, enemy.radius, enemy.phase);
			break;
		case EnemyType.BLACK_HOLE:
			drawBlackHole(g, enemy.radius, enemy.phase);
			break;
		case EnemyType.BLACKHOLE_SHARD:
			drawBlackHoleShard(g, enemy.radius);
			break;
		}
	}

	private syncProjectiles(): void {
		const modelIds = new Set(this.model.projectiles.map(p => p.id));

		for (const [id, g] of this.pool.projContainers) {
			if (!modelIds.has(id)) {
				g.parent?.removeChild(g);
				g.destroy();
				this.pool.projContainers.delete(id);
			}
		}

		for (const proj of this.model.projectiles) {
			let g = this.pool.projContainers.get(proj.id);
			if (!g) {
				g = new PIXI.Graphics();
				drawProjectile(g);
				(this.entityLayer as unknown as PIXI.Container).addChild(g);
				this.pool.projContainers.set(proj.id, g);
			}
			g.x = proj.position.x;
			g.y = proj.position.y;
		}
	}

	private showGameOver(): void {
		const style = new PIXI.TextStyle({
			fill: '#ff4455',
			fontFamily: 'monospace',
			fontSize: 48,
			fontWeight: 'bold',
			align: 'center',
		});
		const text = new PIXI.Text('GAME OVER', style);
		text.anchor.set(0.5);
		text.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 - 30);

		const scoreStyle = new PIXI.TextStyle({
			fill: '#ffffff',
			fontFamily: 'monospace',
			fontSize: 22,
			align: 'center',
		});
		const scoreText = new PIXI.Text(`Score: ${this.model.score}`, scoreStyle);
		scoreText.anchor.set(0.5);
		scoreText.position.set(ARENA_WIDTH / 2, ARENA_HEIGHT / 2 + 30);

		(this.hudLayer as unknown as PIXI.Container).addChild(text);
		(this.hudLayer as unknown as PIXI.Container).addChild(scoreText);
	}

	/** Expose the model for external inspection (tests via ECS layer). */
	getModel(): GameModel {
		return this.model;
	}

	/** Inject an input state directly — used by tests running through ECS. */
	setModel(model: GameModel): void {
		this.model = model;
	}
}
