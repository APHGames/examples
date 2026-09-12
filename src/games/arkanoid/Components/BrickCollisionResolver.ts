import { Component, Message, Container } from 'colfio';
import { HitInfo } from '../HitInfo';
import {
	MSG_OBJECT_HIT,
	ATTR_MODEL,
	HIT_TYPE_BRICK,
	BRICK_TYPE_INDSTRUCTIBLE,
	MSG_COMMAND_FINISH_LEVEL,
} from '../Constants';
import { Model } from '../Model';

export class BrickCollisionResolver extends Component {
	private model!: Model;

	onInit() {
		this.subscribe(MSG_OBJECT_HIT);
		this.model = this.scene.getGlobalAttribute(ATTR_MODEL);
	}

	onMessage(msg: Message) {
		if (msg.action == MSG_OBJECT_HIT) {
			const info = msg.data as HitInfo;
			if (info.hitType == HIT_TYPE_BRICK) {
				this.resolveBrickHit(info);
			}
		}
	}

	protected resolveBrickHit(info: HitInfo) {
		if (!info.hitObject) {
			return;
		}
		const brick = this.model.brickSprites.get(info.hitObject.id);
		if (!brick) {
			return;
		}
		if (brick.type != BRICK_TYPE_INDSTRUCTIBLE) {
			this.model.remainingBricks--;
			this.model.removeBrick(brick.position);
			info.hitObject.destroy();

			if (this.model.remainingBricks == 0) {
				this.sendMessage(MSG_COMMAND_FINISH_LEVEL);
			}
		}
	}
}
