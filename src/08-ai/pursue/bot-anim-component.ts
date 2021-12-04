/* eslint-disable no-use-before-define */
import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { ATTR_VELOCITY } from './constants';

export class BotAnimComponent extends ECS.Component {
	changeFrequency = 10;
	lastSwitchTime = 0;
	texture: PIXI.Texture;
	currentFrame = 0;

	onInit() {
		this.texture = this.owner.asSprite().texture;
		// no animation
		this.texture.frame = new PIXI.Rectangle(0, 64, 32, 32);
	}

	onUpdate(delta: number, absolute: number) {
		let velocity = this.owner.getAttribute<ECS.Vector>(ATTR_VELOCITY);

		if (velocity.magnitude() < 1) {
			// no animation
			this.texture.frame = new PIXI.Rectangle(0, 64, 32, 32);
		} else {
			this.currentFrame = (this.currentFrame + 1) % 3;
			// switch animation
			this.texture.frame = new PIXI.Rectangle(32 * (this.currentFrame + 1), 64, 32, 32);
		}
	}
}
