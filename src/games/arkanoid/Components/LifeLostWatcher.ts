import { Component, Message } from 'colfio';
import { Model } from '../Model';
import {
	MSG_BALL_OUTSIDE_AREA,
	ATTR_MODEL,
	MSG_LIFE_LOST,
	MSG_COMMAND_GOTO_NEXT_ROUND,
	MSG_COMMAND_GAME_OVER,
} from '../Constants';

export class LifeLostWatcher extends Component {
	private model!: Model;

	onInit() {
		this.subscribe(MSG_BALL_OUTSIDE_AREA);
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
	}

	onMessage(msg: Message) {
		if (msg.action == MSG_BALL_OUTSIDE_AREA) {
			this.resolveBallOutsideArea();
		}
	}

	protected resolveBallOutsideArea() {
		this.model.currentLives--;
		this.sendMessage(MSG_LIFE_LOST);

		if (this.model.currentLives == 0) {
			this.sendMessage(MSG_COMMAND_GAME_OVER);
		} else {
			this.sendMessage(MSG_COMMAND_GOTO_NEXT_ROUND);
		}
	}
}
