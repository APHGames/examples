import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';

const TOTAL_SPRITES = 3;

/**
 * Animation of items (switches 3 sprites in the spritesheet)
 */
export class ItemAnimator extends ECS.Component {

	currentFrame = -1;

	onInit() {
		this.fixedFrequency = ANIM_FREQUENCY;
		this.switchFrame();
	}

	onFixedUpdate() {
		this.switchFrame();
	}

	private switchFrame() {
		this.currentFrame = (this.currentFrame + 1) % TOTAL_SPRITES;
		const currentFrame = this.owner.asSprite().texture.frame;
		this.owner.asSprite().texture.frame = new PIXI.Rectangle(currentFrame.x,
			this.currentFrame * SPRITE_SIZE, currentFrame.width, currentFrame.height);
	}
}