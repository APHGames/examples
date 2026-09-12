import * as ECS from 'colfio';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';
import { setTextureFrame } from '../../../utils/assets';

const TOTAL_SPRITES = 3;

/**
 * Animation of items (switches 3 sprites in the spritesheet)
 */
export class ItemAnimator extends ECS.Component {

	currentFrame = -1;
	baseTexture: PIXI.Texture;
	frameX = 0;
	frameW = 0;
	frameH = 0;

	onInit() {
		this.fixedFrequency = ANIM_FREQUENCY;
		const tex = this.owner.asSprite().texture;
		this.baseTexture = tex;
		this.frameX = tex.frame.x;
		this.frameW = tex.frame.width;
		this.frameH = tex.frame.height;
		this.switchFrame();
	}

	onFixedUpdate() {
		this.switchFrame();
	}

	private switchFrame() {
		this.currentFrame = (this.currentFrame + 1) % TOTAL_SPRITES;
		setTextureFrame(
			this.owner.asSprite(),
			this.baseTexture,
			this.frameX,
			this.currentFrame * SPRITE_SIZE,
			this.frameW,
			this.frameH,
		);
	}
}
