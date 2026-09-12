import Vec2 from './utils/Vec2';
import { BRICK_TYPE_INDSTRUCTIBLE, BRICK_TYPE_NONE } from './Constants';
import {
	TAG_LEFT_PANEL,
	TAG_RIGHT_PANEL,
	TAG_TOP_PANEL,
	TAG_BRICKS,
	TAG_BALL,
	TAG_PADDLE,
	TAG_TITLE,
	TAG_SHIP,
	TAG_LIFE,
} from './Constants';

export class Brick {
	type = 0;
	position = new Vec2(0, 0);
}

export const COLUMNS_NUM = 11;

export class SpriteInfo {
	constructor(
		public name: string,
		public offsetX: number,
		public offsetY: number,
		public width: number,
		public height: number,
		public frames: number,
	) {}
}

export class Model {
	bricks = new Map<number, Brick>();
	brickSprites = new Map<number, Brick>();
	sprites: SpriteInfo[] = [];
	levels: number[][][] = [];

	maxLevel = 0;
	ballOffset = 0.5;
	paddleSpeed = 0.02;
	maxLives = 0;
	ballInitSpeed = 0.03;

	ballReleased = false;
	remainingBricks = 0;
	currentRound = 0;
	currentLevel = 0;
	ballSpeed = 0;
	ballSpeedMultiplier = 1;
	currentLives = 0;

	loadModel(data: any) {
		this.sprites = [];
		const spriteList = data && Array.isArray(data.sprites) ? data.sprites : [];
		for (const spr of spriteList) {
			this.sprites.push(
				new SpriteInfo(spr.name, spr.offset_px_x, spr.offset_px_y, spr.sprite_width, spr.sprite_height, spr.frames),
			);
		}

		this.maxLives = data?.max_lives ?? 3;
		this.ballSpeed = data?.ball_speed ?? 0.03;
		this.ballSpeedMultiplier = data?.ball_speed_multiplier ?? 1;
		this.maxLevel = data?.levels_total ?? 0;
		this.levels = Array.isArray(data?.levels_maps) ? data.levels_maps : [];
	}

	initLevel() {
		this.bricks.clear();
		this.remainingBricks = 0;
		this.currentRound = 0;
		this.ballReleased = false;
		this.currentLives = this.maxLives;
		this.loadBricks();
	}

	getSpriteInfo(name: string): SpriteInfo {
		for (const spr of this.sprites) {
			if (spr.name == name) return spr;
		}
		throw new Error(`Missing sprite info: ${name}`);
	}

	getBrick(position: Vec2): Brick | undefined {
		const index = position.y * COLUMNS_NUM + position.x;
		return this.bricks.get(index);
	}

	removeBrick(position: Vec2) {
		const index = position.y * COLUMNS_NUM + position.x;
		return this.bricks.delete(index);
	}

	protected loadBricks() {
		for (let row = 0; row < this.levels[this.currentLevel - 1].length; row++) {
			for (let col = 0; col < COLUMNS_NUM; col++) {
				const brickIndex = this.levels[this.currentLevel - 1][row][col];
				if (brickIndex != BRICK_TYPE_NONE) {
					const brick = new Brick();
					brick.position = new Vec2(col, row);
					brick.type = brickIndex;
					const index = row * COLUMNS_NUM + col;
					this.bricks.set(index, brick);
					if (brickIndex != BRICK_TYPE_INDSTRUCTIBLE) {
						this.remainingBricks++;
					}
				}
			}
		}
	}
}

export const SPRITE_NAMES = [
	TAG_LEFT_PANEL,
	TAG_RIGHT_PANEL,
	TAG_TOP_PANEL,
	TAG_BRICKS,
	TAG_BALL,
	TAG_PADDLE,
	TAG_TITLE,
	TAG_SHIP,
	TAG_LIFE,
];
