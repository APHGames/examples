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

		// Arrow keys for aim (twin-stick, independent of WASD movement)
		let aimAngle = this.mouseAimAngle;
		let aimX = 0;
		let aimY = 0;
		if (keys.isKeyPressed(ECS.Keys.KEY_UP)) aimY -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_DOWN)) aimY += 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_LEFT)) aimX -= 1;
		if (keys.isKeyPressed(ECS.Keys.KEY_RIGHT)) aimX += 1;
		if (aimX !== 0 || aimY !== 0) {
			aimAngle = Math.atan2(aimY, aimX);
		}

		const fire = keys.isKeyPressed(ECS.Keys.KEY_SPACE);
		const bomb = keys.isKeyPressed(ECS.Keys.KEY_B);

		return { moveX, moveY, aimAngle, fire, bomb };
	}

	onUpdate(delta: number): void {
		if (this.model.state !== GameState.PLAYING) return;

		const dt = delta / 1000;
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
				break;
			case SimEventType.ENEMY_KILLED:
				this.sendMessage(Messages.SCORE_CHANGED);
				this.removeEnemyVisual(evt.enemyId);
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
