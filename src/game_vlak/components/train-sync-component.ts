import * as ECS from 'colfio';
import { SPRITE_SIZE, ANIM_FREQUENCY, Messages } from '../constants';
import * as PIXI from 'pixi.js';
import { TrainState } from '../model/state-structs';
import { setTextureFrame } from '../../utils/assets';

const TOTAL_SPRITES = 3;

/**
 * Component that synchronizes the sprite and the state of the train, including
 * wheel animation
 */
export class TrainSyncComponent extends ECS.Component<TrainState> {

	currentFrame = 0;
	baseTexture: PIXI.Texture;
	frameY = 0;
	frameW = 0;
	frameH = 0;

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_TRAIN_CRASHED);
		this.fixedFrequency = ANIM_FREQUENCY;
		const tex = this.owner.asSprite().texture;
		this.baseTexture = tex;
		this.frameY = tex.frame.y;
		this.frameW = tex.frame.width;
		this.frameH = tex.frame.height;
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

		setTextureFrame(
			this.owner.asSprite(),
			this.baseTexture,
			(startingFrame + (this.currentFrame) * 4) * SPRITE_SIZE,
			this.frameY,
			this.frameW,
			this.frameH,
		);
	}
}
