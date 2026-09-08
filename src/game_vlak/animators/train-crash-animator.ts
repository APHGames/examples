import * as ECS from 'colfio';
import { SPRITE_SIZE, ANIM_FREQUENCY } from '../constants';
import * as PIXI from 'pixi.js';
import { setTextureFrame } from '../../utils/assets';

/**
 * Animation of the train crash
 */
export class TrainCrashAnimator extends ECS.Component {

	currentFrame = 0;
	baseTexture: PIXI.Texture;
	frameW = 0;
	frameH = 0;
	frameY = 0;

	onInit() {
		this.fixedFrequency = ANIM_FREQUENCY;
		const tex = this.owner.asSprite().texture;
		this.baseTexture = tex;
		this.frameW = tex.frame.width;
		this.frameH = tex.frame.height;
		this.frameY = 8 * SPRITE_SIZE;
		// set the initial sprite
		setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, this.frameY, this.frameW, this.frameH);
	}

	onFixedUpdate() {
		if(this.currentFrame >= 7) {
			// loop last 3 frames
			this.currentFrame =  7 + (this.currentFrame - 7 + 1) % 3;
		} else {
			this.currentFrame++;
		}
		setTextureFrame(
			this.owner.asSprite(),
			this.baseTexture,
			this.currentFrame * SPRITE_SIZE,
			this.frameY,
			this.frameW,
			this.frameH,
		);
	}
}
