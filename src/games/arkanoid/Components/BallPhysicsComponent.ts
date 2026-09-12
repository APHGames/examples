import { Component, Container, Sprite } from 'colfio';
import {
	TAG_LEFT_PANEL,
	TAG_RIGHT_PANEL,
	TAG_TOP_PANEL,
	TAG_PADDLE,
	TAG_BRICKS,
	MSG_OBJECT_HIT,
	MSG_BALL_OUTSIDE_AREA,
	HIT_TYPE_BORDER_LEFT,
	HIT_TYPE_BORDER_RIGHT,
	HIT_TYPE_BORDER_TOP,
	HIT_TYPE_PADDLE,
	HIT_TYPE_BRICK,
	SCENE_HEIGHT,
} from '../Constants';
import { HitInfo } from '../HitInfo';
import Dynamics from '../utils/Dynamics';
import { ATTR_DYNAMICS } from '../utils/DynamicsComponent';
import * as PIXI from 'pixi.js';

export class BallPhysicsComponent extends Component {
	private leftPanel!: Sprite;
	private rightPanel!: Sprite;
	private topPanel!: Sprite;
	private paddle!: Sprite;
	private bricks!: Container;
	private dynamics!: Dynamics;

	onInit() {
		this.leftPanel = this.scene.findObjectByName(TAG_LEFT_PANEL) as Sprite;
		this.rightPanel = this.scene.findObjectByName(TAG_RIGHT_PANEL) as Sprite;
		this.topPanel = this.scene.findObjectByName(TAG_TOP_PANEL) as Sprite;
		this.paddle = this.scene.findObjectByName(TAG_PADDLE) as Sprite;
		this.bricks = this.scene.findObjectByName(TAG_BRICKS) as Container;
		this.dynamics = this.owner.getAttribute(ATTR_DYNAMICS);
	}

	onUpdate(_delta: number, _absolute: number) {
		if (this.dynamics.velocity.magnitudeSquared() < 0.5) {
			return;
		}

		const hitInfo = new HitInfo();
		const hit = this.checkPanelCollision(hitInfo) || this.checkPaddleCollision(hitInfo) || this.checkBrickCollision(hitInfo);

		if (hit) {
			this.sendMessage(MSG_OBJECT_HIT, hitInfo);
		}

		if (this.owner.pixiObj.position.y >= SCENE_HEIGHT + 1) {
			this.sendMessage(MSG_BALL_OUTSIDE_AREA);
		}
	}

	protected checkPanelCollision(hitInfo: HitInfo): boolean {
		const ballBB = this.owner.pixiObj.getBounds();
		const leftPanelBB = this.leftPanel.pixiObj.getBounds();
		const rightPanelBB = this.rightPanel.pixiObj.getBounds();
		const topPanelBB = this.topPanel.pixiObj.getBounds();

		if (this.testIntersection(ballBB, topPanelBB) && this.dynamics.velocity.y < 0) {
			this.dynamics.velocity.y *= -1;
			hitInfo.hitType = HIT_TYPE_BORDER_TOP;
			return true;
		}

		if (this.testIntersection(ballBB, leftPanelBB) && this.dynamics.velocity.x < 0) {
			this.dynamics.velocity.x *= -1;
			hitInfo.hitType = HIT_TYPE_BORDER_LEFT;
			return true;
		}

		if (this.testIntersection(ballBB, rightPanelBB) && this.dynamics.velocity.x > 0) {
			this.dynamics.velocity.x *= -1;
			hitInfo.hitType = HIT_TYPE_BORDER_RIGHT;
			return true;
		}

		return false;
	}

	protected checkPaddleCollision(hitInfo: HitInfo): boolean {
		const paddleBB = this.paddle.pixiObj.getBounds();
		const ballBB = this.owner.pixiObj.getBounds();

		if (this.testIntersection(ballBB, paddleBB) && this.dynamics.velocity.y > 0) {
			const maxDistanceFromCenter = paddleBB.width / 2;
			if (maxDistanceFromCenter != 0) {
				const distFromCenter = ballBB.left + ballBB.width / 2 - (paddleBB.left + paddleBB.width / 2);
				const percDist = distFromCenter / maxDistanceFromCenter;
				const angle = (Math.PI / 4) * percDist;
				const length = this.dynamics.velocity.magnitude();

				this.dynamics.velocity.x = length * Math.sin(angle);
				this.dynamics.velocity.y = -length * Math.cos(angle);
				hitInfo.hitType = HIT_TYPE_PADDLE;
				return true;
			}
		}

		return false;
	}

	protected checkBrickCollision(hitInfo: HitInfo): boolean {
		const ballBB = this.owner.pixiObj.getBounds();
		const velocity = this.dynamics.velocity;

		for (let i = 0; i < this.bricks.pixiObj.children.length; i++) {
			const brick = this.bricks.pixiObj.children[i] as Sprite;
			const brickObj = brick.pixiObj ?? brick;
			const brickBB = brickObj.getBounds();
			if (this.testIntersection(brickBB, ballBB)) {
				const horiz = this.testHorizIntersection(brickBB, ballBB);
				const vert = this.testVertIntersection(brickBB, ballBB);

				if (horiz > vert) {
					if (
						(brickBB.bottom > ballBB.top && brickBB.top < ballBB.top && velocity.y < 0) ||
						(brickBB.top < ballBB.bottom && brickBB.bottom > ballBB.bottom && velocity.y > 0)
					) {
						velocity.y *= -1;
					}
				} else {
					if (
						(brickBB.right > ballBB.left && brickBB.left < ballBB.left && velocity.x < 0) ||
						(brickBB.left < ballBB.right && brickBB.right > ballBB.right && velocity.x > 0)
					) {
						velocity.x *= -1;
					}
				}

				hitInfo.hitObject = brick;
				hitInfo.hitType = HIT_TYPE_BRICK;
				return true;
			}
		}
		return false;
	}

	private testHorizIntersection(boundsA: PIXI.Bounds, boundsB: PIXI.Bounds): number {
		return Math.min(boundsA.right, boundsB.right) - Math.max(boundsA.left, boundsB.left);
	}

	private testVertIntersection(boundsA: PIXI.Bounds, boundsB: PIXI.Bounds): number {
		return Math.min(boundsA.bottom, boundsB.bottom) - Math.max(boundsA.top, boundsB.top);
	}

	private testIntersection(boundsA: PIXI.Bounds, boundsB: PIXI.Bounds): boolean {
		return this.testHorizIntersection(boundsA, boundsB) > 0 && this.testVertIntersection(boundsA, boundsB) > 0;
	}
}
