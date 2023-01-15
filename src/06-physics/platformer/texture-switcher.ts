import * as ECS from '../../../libs/pixi-ecs';
import * as PIXI from 'pixi.js';
import { Attributes, DIR_RIGHT, DIR_LEFT } from './constants';

/**
 * This component is assigned to the player and monsters. It changes (flips) their textures when they change direction.
 */
export class TextureSwitcher extends ECS.Component {

	direction: number;
	leftTexture: PIXI.Texture;
	rightTexture: PIXI.Texture;

	onInit() {
		this.direction = this.owner.getAttribute(Attributes.DIRECTION);
		this.leftTexture = this.owner.asSprite().texture;
		this.rightTexture = new PIXI.Texture(this.leftTexture.baseTexture, this.leftTexture.frame, null, null, 12);

		if (this.direction === DIR_RIGHT) {
			this.owner.asSprite().texture = this.rightTexture;
		}
	}

	onUpdate() {
		let lastDirection = this.direction;
		this.direction = this.owner.getAttribute(Attributes.DIRECTION);

		if (lastDirection !== this.direction) {
			this.owner.asSprite().texture = this.direction === DIR_LEFT ? this.leftTexture : this.rightTexture;
		}
	}
}