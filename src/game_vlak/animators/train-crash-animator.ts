import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';

/**
 * Animation of the train crash
 */
export class TrainCrashAnimator extends ECS.Component {

	currentFrame = 0;

	onInit() {
		this.fixedFrequency = ANIM_FREQUENCY;
		// set the initial sprite
		const frame = this.owner.asSprite().texture.frame;
		this.owner.asSprite().texture.frame = new PIXI.Rectangle(0, 8 * SPRITE_SIZE, frame.width, frame.height);
	}

	onFixedUpdate() {
		const frame = this.owner.asSprite().texture.frame;

		if(this.currentFrame >= 7) {
			// loop last 3 frames
			this.currentFrame =  7 + (this.currentFrame - 7 + 1) % 3;
		} else {
			this.currentFrame++;
		}
		this.owner.asSprite().texture.frame = new PIXI.Rectangle(this.currentFrame * SPRITE_SIZE, frame.y, frame.width, frame.height);
	}
}