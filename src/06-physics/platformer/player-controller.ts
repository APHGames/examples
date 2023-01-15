import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { GAME_SPEED, Attributes, DIR_RIGHT, DIR_LEFT, MapTileType, Tags } from './constants';
import { Level } from './level';

enum PlayerMoveStates {
	STAND = 'STAND',
	WALK = 'WALK',
	JUMP = 'JUMP',
	FALL = 'FALL',
}

enum PlayerActions {
	LEFT = 'LEFT',
	RIGHT = 'RIGHT',
	JUMP = 'JUMP',
	MOVE = 'MOVE',
}

const GRAVITY = 0.5;
const PLAYER_HORIZONTAL_SPEED = 0.8;
const JUMP_DIFF = 0.5;
const JUMP_TRESHOLD = 3.5;

type Vec = {
	x: number;
	y: number;
}

export class PlayerController extends ECS.Component<{ keyInput: ECS.KeyInputComponent; level: Level }> {

	PlayerMoveStates: PlayerMoveStates = PlayerMoveStates.STAND;
	speed: Vec = { x: 0, y: 0 };
	direction = DIR_RIGHT;

	isTouchingGround: boolean = false;
	isTouchingCeiling: boolean = false;

	jumpPrevY: number = null;
	jumpDistance: number = 0;

	gravity: number = GRAVITY;

	onUpdate(delta: number, absolute: number) {
		this.direction = this.owner.getAttribute(Attributes.DIRECTION);
		let speed = delta * 0.01 * GAME_SPEED;

		this.handlePlayerMoveStates(speed);
		this.applyDynamics(speed);
		this.updatePlayerMoveStates();
		this.handleCollidables();
		this.owner.assignAttribute(Attributes.DIRECTION, this.direction);
	}

	horizIntersection = (boundsA: PIXI.Rectangle, boundsB: PIXI.Rectangle) => {
		return Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
	}

	vertIntersection = (boundsA: PIXI.Rectangle, boundsB: PIXI.Rectangle) => {
		return Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);
	}

	private handleCollidables() {
		const collidables = this.scene.findObjectsByTag(Tags.COLLIDABLE);
		const bbox1 = this.owner.getBounds();


		for (let col of collidables) {
			const bbox2 = col.getBounds();
			const horizIntersection = this.horizIntersection(bbox1, bbox2);
			const vertIntersection = this.vertIntersection(bbox1, bbox2);

			const collides = horizIntersection > 0 && vertIntersection > 0;
			if (collides) {
				col.destroy();
			}
		}
	}

	private handlePlayerMoveStates(speed: number) {
		switch (this.PlayerMoveStates) {
			case PlayerMoveStates.STAND:
				this.handleStandState(speed);
				break;
			case PlayerMoveStates.WALK:
				this.handleWalkState(speed);
				break;
			case PlayerMoveStates.JUMP:
				this.handleJumpState(speed);
				break;
			case PlayerMoveStates.FALL:
				this.handleFallState(speed);
				break;
		}
	}

	private handleStandState(speed: number) {
		if (this.isActionOn(PlayerActions.MOVE)) {
			this.PlayerMoveStates = PlayerMoveStates.WALK;
			this.handleWalkState(speed);
		} else if (this.isActionOn(PlayerActions.JUMP)) {
			this.PlayerMoveStates = PlayerMoveStates.JUMP;
			this.handleJumpState(speed);
		}
	}

	private handleWalkState(speed: number) {
		if (this.isActionOn(PlayerActions.JUMP)) {
			this.PlayerMoveStates = PlayerMoveStates.JUMP;
			this.handleJumpState(speed);
		} else if (this.isActionOn(PlayerActions.MOVE)) {
			this.updateHorizontalSpeed(speed);
		} else {
			this.PlayerMoveStates = PlayerMoveStates.STAND;
			this.handleStandState(speed);
		}
	}

	private handleJumpState(speed: number) {
		this.updateHorizontalSpeed(speed);

		if (this.isActionOn(PlayerActions.JUMP)) {
			// first stage of jump - add speed, remove gravity
			if (this.jumpPrevY === null) {
				this.jumpPrevY = this.owner.y;
				this.speed.y = -JUMP_DIFF;
				this.isTouchingGround = false;
			} else if (this.jumpPrevY >= this.owner.y) {
				// measure length of the jump
				this.jumpDistance += this.jumpPrevY - this.owner.y;
				this.jumpPrevY = this.owner.y;
			}
		}
		if (this.jumpDistance > JUMP_TRESHOLD || !this.isActionOn(PlayerActions.JUMP)) {
			this.finishJump();
		}
	}

	private handleFallState(speed: number) {
		this.updateHorizontalSpeed(speed);

		if (this.isTouchingGround) {
			this.PlayerMoveStates = PlayerMoveStates.STAND;
			this.handleStandState(speed);
		}
	}

	private updateHorizontalSpeed(speed: number) {
		if (this.isActionOn(PlayerActions.LEFT)) {
			this.direction = DIR_LEFT;
			this.speed.x = this.direction * Math.min(PLAYER_HORIZONTAL_SPEED * speed, PLAYER_HORIZONTAL_SPEED);
		} else if (this.isActionOn(PlayerActions.RIGHT)) {
			this.direction = DIR_RIGHT;
			this.speed.x = this.direction * Math.min(PLAYER_HORIZONTAL_SPEED * speed, PLAYER_HORIZONTAL_SPEED);
		}
	}

	private finishJump() {
		const keyInputCmp = this.props.keyInput;
		if (keyInputCmp.isKeyPressed(ECS.Keys.KEY_SPACE)) {
			keyInputCmp.handleKey(ECS.Keys.KEY_SPACE);
		}
		this.jumpDistance = 0;
		this.jumpPrevY = null;
		this.PlayerMoveStates = PlayerMoveStates.FALL;
	}

	private isActionOn(action: PlayerActions) {
		switch (action) {
			case PlayerActions.JUMP:
				return this.props.keyInput.isKeyPressed(ECS.Keys.KEY_SPACE);
			case PlayerActions.LEFT:
				return this.props.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT) && !this.props.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT);
			case PlayerActions.RIGHT:
				return !this.props.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT) && this.props.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT);
			case PlayerActions.MOVE:
				return (Number(this.props.keyInput.isKeyPressed(ECS.Keys.KEY_LEFT)) ^ Number(this.props.keyInput.isKeyPressed(ECS.Keys.KEY_RIGHT))) === 1;

		}
	}

	private isHorizBlockFree(x: number, y: number) {
		const platforms = this.props.level.platforms;
		return platforms[Math.floor(y)][Math.floor(x)] === 0 && platforms[Math.ceil(y)][Math.floor(x)] === 0;

	}

	private isVertBlockFree(x: number, y: number) {
		const platforms = this.props.level.platforms;
		return platforms[Math.floor(y)][Math.floor(x)] === 0 && platforms[Math.floor(y)][Math.ceil(x)] === 0;
	}


	private hardRound = (num, tolerance = 0.2) => Math.abs(num - Math.round(num)) <= tolerance ? Math.round(num) : num;

	//this apply movement/speed to player coord and solve collisions with ground
	private applyDynamics(speed: number) {
		let pX = this.owner.position.x;
		let pY = this.owner.position.y;

		// there is a hole below the player
		const canFall = this.isVertBlockFree(this.hardRound(pX), pY + 1);
		// add gravity
		if (canFall && this.PlayerMoveStates !== PlayerMoveStates.JUMP) {
			this.speed.y = Math.min(this.speed.y + this.gravity * speed, this.gravity);
			this.isTouchingGround = false;
		}

		//if no movement, return
		if (this.speed.x === 0 && this.speed.y === 0) {
			return;
		}

		// update position
		this.owner.position.x += this.speed.x;
		this.owner.position.y += this.speed.y;

		//solve horizontal collision (x-axis)
		pX = this.owner.position.x;
		pY = this.owner.position.y - this.speed.y; // previous iteration

		if (this.speed.x > 0 && !this.isHorizBlockFree(pX + 1, pY)) {
			// collision right - relaxation
			this.owner.position.x = Math.floor(pX);
			this.speed.x = 0;
		} else if (this.speed.x < 0 && !this.isHorizBlockFree(pX, pY)) {
			// collision left - relaxation
			this.owner.position.x = Math.floor(pX) + 1;
			this.speed.x = 0;
		}

		//solve vertical collision (y-axis)
		pX = this.owner.position.x - this.speed.x; // previous iteration
		pY = this.owner.position.y;

		if (this.speed.y > 0 && !this.isVertBlockFree(this.hardRound(pX, 0.05), pY + 1)) {
			//collision down
			this.owner.position.y = Math.floor(pY);
			this.isTouchingGround = true;
			this.speed.y = 0;
		} else if (this.speed.y < 0 && !this.isVertBlockFree(this.hardRound(pX, 0.05), pY)) {
			//collision up
			this.owner.position.y = Math.floor(pY) + 1;
			this.isTouchingCeiling = true;
		}

		//reduce speed
		this.speed.x *= 0.7;
		this.speed.y *= 0.9;

		// avoid too small numbers
		if (Math.abs(this.speed.x) < 0.01) {
			this.speed.x = 0;
		}
		if (Math.abs(this.speed.y) < 0.01) {
			this.speed.y = 0;
		}
	}

	private updatePlayerMoveStates() {
		if (this.isTouchingCeiling) {
			this.isTouchingCeiling = false;
			this.PlayerMoveStates = PlayerMoveStates.FALL;
			this.finishJump();
		}
		if (this.isTouchingGround && this.PlayerMoveStates === PlayerMoveStates.FALL) {
			this.PlayerMoveStates = PlayerMoveStates.STAND;
		}
	}
}