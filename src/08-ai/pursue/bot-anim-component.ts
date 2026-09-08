/* eslint-disable no-use-before-define */
import * as ECS from 'colfio';
import * as PIXI from 'pixi.js';
import { ATTR_VELOCITY } from './constants';
import { setTextureFrame } from '../../utils/assets';

export class BotAnimComponent extends ECS.Component {
	changeFrequency = 10;
	lastSwitchTime = 0;
	baseTexture: PIXI.Texture;
	currentFrame = 0;

	onInit() {
		this.baseTexture = this.owner.asSprite().texture;
		// no animation
		setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 64, 32, 32);
	}

	onUpdate(delta: number, absolute: number) {
		let velocity = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);

		if (velocity.magnitude() < 1) {
			// no animation
			setTextureFrame(this.owner.asSprite(), this.baseTexture, 0, 64, 32, 32);
		} else {
			this.currentFrame = (this.currentFrame + 1) % 3;
			// switch animation
			setTextureFrame(this.owner.asSprite(), this.baseTexture, 32 * (this.currentFrame + 1), 64, 32, 32);
		}
	}
}
