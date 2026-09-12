import * as ECS from 'colfio';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';
import { setTextureFrame } from '../../../utils/assets';

const DOOR_OPENING_FRAMES = 5;

/**
 * Component that animates door opening
 */
export class DoorAnimator extends ECS.Component {

	currentFrame = -1;
	baseTexture: PIXI.Texture;
	frameY = 0;
	frameW = 0;
	frameH = 0;

	onInit() {
		// this will call onFixedUpdate with given frequence and we can ignore the main update loop
		this.fixedFrequency = ANIM_FREQUENCY;
		const tex = this.owner.asSprite().texture;
		this.baseTexture = tex;
		this.frameY = tex.frame.y;
		this.frameW = tex.frame.width;
		this.frameH = tex.frame.height;
		this.syncFrame();
	}

	onFixedUpdate() {
		this.syncFrame();
	}

	private syncFrame() {
		this.currentFrame = Math.min(this.currentFrame + 1, DOOR_OPENING_FRAMES);
		// the offset is 12 sprites from the left (that's where the first door sprite begins)
		setTextureFrame(
			this.owner.asSprite(),
			this.baseTexture,
			(this.currentFrame + 12) * SPRITE_SIZE,
			this.frameY,
			this.frameW,
			this.frameH,
		);

		if(this.currentFrame === DOOR_OPENING_FRAMES) {
			this.finish();
		}
	}
}
