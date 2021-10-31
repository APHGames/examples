import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, ANIM_FREQUENCY, Messages } from '../constants';
import * as PIXI from 'pixi.js';
import { TrainState } from '../model/state-structs';

const TOTAL_SPRITES = 3;

/**
 * Component that synchronizes the sprite and the state of the train, including
 * wheel animation
 */
export class TrainSyncComponent extends ECS.Component<TrainState> {

	currentFrame = 0;

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_TRAIN_CRASHED);
		this.fixedFrequency = ANIM_FREQUENCY;
		this.syncState();
	}

	onMessage(msg: ECS.Message) {
		if(msg.action === Messages.STATE_CHANGE_TRAIN_CRASHED) {
			this.finish();
		}
	}

	onFixedUpdate() {
		this.switchWheelFrame();
	}

	onUpdate() {
		this.syncState();
	}

	private switchWheelFrame() {
		this.currentFrame = (this.currentFrame + 1) % TOTAL_SPRITES;
	}

	private syncState() {
		const currentFrame = this.owner.asSprite().texture.frame;
		let startingFrame = 0;

		switch(this.props.position.direction) {
			case 'u':
				startingFrame = 1;
				break;
			case 'd':
				startingFrame = 3;
				break;
			case 'l':
				startingFrame = 0;
				break;
			case 'r':
				startingFrame = 2;
				break;
		}

		this.owner.asSprite().texture.frame = new PIXI.Rectangle((startingFrame + (this.currentFrame) * 4) * SPRITE_SIZE,
			currentFrame.y, currentFrame.width, currentFrame.height);
	}
}