import { Component, Message } from 'colfio';
import { Factory } from '../Factory';
import { Model } from '../Model';
import type { Sprite } from 'colfio';
import {
	MSG_COMMAND_FINISH_LEVEL,
	ATTR_FACTORY,
	ATTR_MODEL,
	TAG_BALL,
	TAG_PADDLE,
	MSG_GAME_COMPLETED,
	MSG_LEVEL_COMPLETED,
	MSG_GAME_OVER,
	MSG_LEVEL_STARTED,
	MSG_ROUND_STARTED,
	MSG_COMMAND_GAME_OVER,
	MSG_COMMAND_GOTO_NEXT_ROUND,
} from '../Constants';
import Dynamics from '../utils/Dynamics';
import { ATTR_DYNAMICS } from '../utils/DynamicsComponent';

export class GameComponent extends Component {
	private model!: Model;
	private factory!: Factory;
	private paddle!: Sprite;
	private ball!: Sprite;

	onInit() {
		this.subscribe(MSG_COMMAND_GAME_OVER, MSG_COMMAND_GOTO_NEXT_ROUND, MSG_COMMAND_FINISH_LEVEL);

		this.factory = this.scene.getGlobalAttribute(ATTR_FACTORY);
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
		this.ball = this.scene.findObjectByName(TAG_BALL) as Sprite;
		this.paddle = this.scene.findObjectByName(TAG_PADDLE) as Sprite;

		if (this.model.currentRound == 0) {
			this.gotoNextRound();
		}
	}

	onMessage(msg: Message) {
		if (msg.action == MSG_COMMAND_GAME_OVER) {
			this.gameOver();
		} else if (msg.action == MSG_COMMAND_FINISH_LEVEL) {
			this.finishLevel();
		} else if (msg.action == MSG_COMMAND_GOTO_NEXT_ROUND) {
			this.gotoNextRound();
		}
	}

	protected gameOver() {
		this.model.currentLevel = 0;
		this.sendMessage(MSG_GAME_OVER);
		this.ball.destroy();
		this.reset();
	}

	protected finishLevel() {
		if (this.model.currentLevel == this.model.maxLevel) {
			this.model.currentLevel = 0;
			this.sendMessage(MSG_GAME_COMPLETED);
		} else {
			this.model.currentLevel++;
			this.model.ballSpeed *= this.model.ballSpeedMultiplier;
			this.sendMessage(MSG_LEVEL_COMPLETED);
		}
		this.ball.destroy();
		this.reset();
	}

	protected gotoNextRound() {
		const dynamics = this.ball.getAttribute<Dynamics>(ATTR_DYNAMICS);
		this.model.currentRound++;
		dynamics.velocity.x = 0;
		dynamics.velocity.y = 0;
		this.model.ballReleased = false;

		this.ball.pixiObj.position.x = this.paddle.pixiObj.position.x + this.model.ballOffset;
		this.ball.pixiObj.position.y = 22.4;

		if (this.model.currentRound == 1) {
			this.sendMessage(MSG_LEVEL_STARTED);
		} else {
			this.sendMessage(MSG_ROUND_STARTED);
		}
	}

	private reset() {
		this.scene.callWithDelay(3000, () => this.factory.resetGame(this.scene, this.model));
	}
}
