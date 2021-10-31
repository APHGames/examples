import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, Messages } from '../constants';
import * as PIXI from 'pixi.js';
import { CarState } from '../model/state-structs';

/**
 * Synchronizes Railcar with every movement of the train
 * Since the CarState is mutable, we only need to check out its attributes
 * once the train has moved
 */
export class RailcarSyncComponent extends ECS.Component<CarState> {

	onInit() {
		this.subscribe(Messages.STATE_CHANGE_TRAIN_POSITION);
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

		const txt = this.owner.asSprite().texture;
		txt.frame = new PIXI.Rectangle(
			txt.frame.x,
			frameIndex * SPRITE_SIZE,
			txt.frame.width,
			txt.frame.height);
	}
}