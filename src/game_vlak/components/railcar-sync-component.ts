import * as ECS from 'colfio';
import { SPRITE_SIZE, Messages } from '../constants';
import * as PIXI from 'pixi.js';
import { CarState } from '../model/state-structs';
import { setTextureFrame } from '../../utils/assets';

/**
 * Synchronizes Railcar with every movement of the train
 * Since the CarState is mutable, we only need to check out its attributes
 * once the train has moved
 */
export class RailcarSyncComponent extends ECS.Component<CarState> {

	baseTexture: PIXI.Texture;
	frameX = 0;
	frameW = 0;
	frameH = 0;

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_TRAIN_POSITION);
		const tex = this.owner.asSprite().texture;
		this.baseTexture = tex;
		this.frameX = tex.frame.x;
		this.frameW = tex.frame.width;
		this.frameH = tex.frame.height;
	}

	onMessage(msg: ECS.Message) {
		if(msg.action === Messages.STATE_CHANGE_TRAIN_POSITION) {
			// we only need to update the sprite if the train has moved
			// technically, if the train would move every single frame, we would run the sync() function in the regular update() loop
			this.sync();
		}
	}

	public sync() {
		let frameIndex;
		this.owner.position.set(this.props.position.column * SPRITE_SIZE, this.props.position.row * SPRITE_SIZE);
		switch(this.props.position.direction) {
			case 'u':
				frameIndex = 4;
				break;
			case 'd':
				frameIndex = 6;
				break;
			case 'l':
				frameIndex = 3;
				break;
			case 'r':
				frameIndex = 5;
				break;
		}

		setTextureFrame(
			this.owner.asSprite(),
			this.baseTexture,
			this.frameX,
			frameIndex * SPRITE_SIZE,
			this.frameW,
			this.frameH,
		);
	}
}
