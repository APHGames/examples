import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { GameModel, InputState, createInitialModel, EnemyData, ProjectileData, Vec2 } from '../model/game-model';
import { GameSimulator, SimEvent } from '../model/game-simulator';
import { SimEventType, EnemyType, GameState, Tags, Messages, ARENA_WIDTH, ARENA_HEIGHT } from '../constants';
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
	projectile: 0xffff88,
	arenaEdge: 0x223344,
};

function drawPlayer(g: PIXI.Graphics, aimAngle: number, isInvulnerable: boolean): void {
	g.clear();
	const alpha = isInvulnerable ? 0.5 : 1;
	// Outer glow triangle
	g.beginFill(COLORS.playerCore, alpha * 0.3);
	g.lineStyle(2, COLORS.player, alpha * 0.6);
	drawArrow(g, 0, 0, aimAngle, 16, 10);
	g.endFill();
	// Inner solid
	g.beginFill(COLORS.player, alpha);
	g.lineStyle(0);
	drawArrow(g, 0, 0, aimAngle, 11, 7);
	g.endFill();
}

function drawArrow(g: PIXI.Graphics, cx: number, cy: number, angle: number, length: number, halfWidth: number): void {
	const tipX = cx + Math.cos(angle) * length;
	const tipY = cy + Math.sin(angle) * length;
	const baseAngle1 = angle + Math.PI * 0.75;
	const baseAngle2 = angle - Math.PI * 0.75;
	g.moveTo(tipX, tipY);
	g.lineTo(cx + Math.cos(baseAngle1) * halfWidth, cy + Math.sin(baseAngle1) * halfWidth);
	g.lineTo(cx + Math.cos(baseAngle2) * halfWidth, cy + Math.sin(baseAngle2) * halfWidth);
	g.lineTo(tipX, tipY);
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

function drawGravityWell(g: PIXI.Graphics, radius: number, phase: number): void {
	g.clear();
	// Outer ring (pulsating)
	const pulseRadius = radius + Math.sin(phase) * 4;
	g.lineStyle(1, COLORS.gravityWell, 0.3);
	g.drawCircle(0, 0, pulseRadius + 20);
	// Core
	g.beginFill(COLORS.gravityWell, 0.3);
	g.lineStyle(2, COLORS.gravityWell, 1);
	g.drawCircle(0, 0, pulseRadius);
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
	default: return 0xffffff;
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

	private mouseAimAngle = 0;
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

		// Mouse aim
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
			this.mouseAimAngle = Math.atan2(dy, dx);
		};
		(this.scene.app.view as HTMLCanvasElement).addEventListener('mousemove', this.mouseHandler);

		this.drawArena();
	}

	onRemove() {
		(this.scene.app.view as HTMLCanvasElement).removeEventListener('mousemove', this.mouseHandler);
		this.particles.destroy();
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

		let moveX = 0;
		let moveY = 0;
		if (keys.isKeyPressed(ECS.Keys.KEY_W)) moveY -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_S)) moveY += 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_A)) moveX -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_D)) moveX += 1;

		// Aim follows movement direction; retain last angle when stationary
		let aimAngle = this.model.player.aimAngle;
		if (moveX !== 0 || moveY !== 0) {
			aimAngle = Math.atan2(moveY, moveX);
		}

		// Arrow keys trigger auto-fire; Space is kept as secondary trigger
		const fire = keys.isKeyPressed(ECS.Keys.KEY_UP)
			|| keys.isKeyPressed(ECS.Keys.KEY_DOWN)
			|| keys.isKeyPressed(ECS.Keys.KEY_LEFT)
			|| keys.isKeyPressed(ECS.Keys.KEY_RIGHT)
			|| keys.isKeyPressed(ECS.Keys.KEY_SPACE);

		const bomb = keys.isKeyPressed(ECS.Keys.KEY_B);

		return { moveX, moveY, aimAngle, fire, bomb };
	}

	onUpdate(delta: number): void {
		const dt = delta / 1000;

		// Particles keep animating even after game over
		this.particles.update(dt);

		if (this.model.state !== GameState.PLAYING) return;

		const input = this.buildInputState();
		const { events } = this.simulator.update(this.model, input, dt);
		this.processEvents(events);
		this.syncVisuals();
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
				// Large white flash at player position
				this.particles.spawnExplosion(
					this.model.player.position.x,
					this.model.player.position.y,
					0xffffff, 60,
				);
				break;
			case SimEventType.ENEMY_KILLED:
				this.sendMessage(Messages.SCORE_CHANGED);
				this.removeEnemyVisual(evt.enemyId);
				if (evt.position) {
					this.particles.spawnExplosion(evt.position.x, evt.position.y, explosionColor(evt.enemyType), 18);
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
