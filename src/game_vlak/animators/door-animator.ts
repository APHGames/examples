import * as ECS from '../../../libs/pixi-ecs';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';

const DOOR_OPENING_FRAMES = 5;

/**
 * Component that animates door opening
 */
export class DoorAnimator extends ECS.Component {

	currentFrame = -1;

	onInit() {
		// this will call onFixedUpdate with given frequence and we can ignore the main update loop
		this.fixedFrequency = ANIM_FREQUENCY;
		this.syncFrame();
	}

	onFixedUpdate() {
		this.syncFrame();
	}

	private syncFrame() {
		this.currentFrame = Math.min(this.currentFrame + 1, DOOR_OPENING_FRAMES);
		const txt = this.owner.asSprite().texture;
		// the offset is 12 sprites from the left (that's where the first door sprite begins)
		txt.frame = new PIXI.Rectangle((this.currentFrame + 12) * SPRITE_SIZE,
			txt.frame.y, txt.frame.width, txt.frame.height);

		if(this.currentFrame === DOOR_OPENING_FRAMES) {
			this.finish();
		}
	}
}