import { Component, KeyInputComponent, Keys, Sprite } from 'colfio';
import { TAG_BALL, ATTR_MODEL } from '../Constants';
import { Model } from '../Model';
import Dynamics from '../utils/Dynamics';
import { ATTR_DYNAMICS } from '../utils/DynamicsComponent';

const PADDLE_POS_MIN = 1;
const PADDLE_POS_MAX = 20;

class PaddleController extends Component {
	private ball: Sprite | null = null;
	private model!: Model;
	private leftDirection = false;
	paddleLastPos = 0;

	onInit() {
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
		this.resolveBall();
	}

	private resolveBall(): Sprite | null {
		if (!this.ball) {
			this.ball = this.scene.findObjectByName(TAG_BALL) as Sprite | null;
		}
		return this.ball;
	}

	move(left: boolean, delta: number) {
		if (left) {
			this.owner.pixiObj.position.x -= this.model.paddleSpeed * delta;
		} else {
			this.owner.pixiObj.position.x += this.model.paddleSpeed * delta;
		}

		this.owner.pixiObj.position.x = Math.max(Math.min(this.owner.pixiObj.position.x, PADDLE_POS_MAX), PADDLE_POS_MIN);
		this.leftDirection = this.owner.pixiObj.position.x - this.paddleLastPos < 0;
		this.paddleLastPos = this.owner.pixiObj.position.x;

		const ball = this.resolveBall();
		if (ball && !this.model.ballReleased) {
			ball.pixiObj.position.x = this.owner.pixiObj.position.x + this.model.ballOffset;
		}
	}

	releaseBall() {
		const ball = this.resolveBall();
		if (!ball || this.model.ballReleased) {
			return;
		}
		this.model.ballReleased = true;
		const dynamics = ball.getAttribute<Dynamics>(ATTR_DYNAMICS);
		dynamics.velocity.x =
			(this.paddleLastPos == 0 ? 0 : this.leftDirection ? -this.model.ballInitSpeed : this.model.ballInitSpeed) *
			this.model.ballSpeed;
		dynamics.velocity.y = -this.model.ballSpeed;
	}
}

export class PaddleInputController extends PaddleController {
	private keys: KeyInputComponent | null = null;

	onInit() {
		super.onInit();
		this.keys = this.scene.findGlobalComponentByName<KeyInputComponent>(KeyInputComponent.name);
	}

	onUpdate(delta: number, _absolute: number) {
		const cmpKey = this.keys ?? this.scene.findGlobalComponentByName<KeyInputComponent>(KeyInputComponent.name);
		if (!cmpKey) {
			return;
		}
		this.keys = cmpKey;

		if (cmpKey.isKeyPressed(Keys.KEY_LEFT)) {
			this.move(true, delta);
		}
		if (cmpKey.isKeyPressed(Keys.KEY_RIGHT)) {
			this.move(false, delta);
		}
		if (cmpKey.isKeyPressed(Keys.KEY_UP)) {
			this.releaseBall();
		}
	}
}
