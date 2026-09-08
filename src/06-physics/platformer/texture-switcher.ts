import * as ECS from 'colfio';
import * as PIXI from 'pixi.js';
import { Attributes, DIR_RIGHT, DIR_LEFT } from './constants';

/**
 * Flips the player sprite when direction changes (Pixi 8–safe texture mirror).
 */
export class TextureSwitcher extends ECS.Component {

	direction: number;
	leftTexture: PIXI.Texture;
	rightTexture: PIXI.Texture;

	onInit() {
		this.direction = this.owner.getAttribute(Attributes.DIRECTION);
		this.leftTexture = this.owner.asSprite().texture;
		const frame = this.leftTexture.frame.clone();
		this.rightTexture = new PIXI.Texture({
			source: this.leftTexture.source,
			frame,
			orig: frame.clone(),
			rotate: PIXI.groupD8.MIRROR_HORIZONTAL,
		});
		this.applyTexture();
	}

	onUpdate() {
		const next = this.owner.getAttribute(Attributes.DIRECTION);
		if (next !== this.direction) {
			this.direction = next;
			this.applyTexture();
		}
	}

	private applyTexture() {
		// spritesheet faces left; mirror for facing right
		this.owner.asSprite().texture = this.direction === DIR_LEFT ? this.leftTexture : this.rightTexture;
	}
}
