import * as PIXI from 'pixi.js';
import { PIXIExample, getBaseUrl } from '../utils/APHExample';
import { loadTexture } from '../utils/assets';

export class PixiHelloWorld extends PIXIExample {

	private creature: PIXI.Sprite;

	async load() {
		const texture = await loadTexture(`${getBaseUrl()}/assets/01-helloworld/crash.png`);
		this.creature = new PIXI.Sprite(texture);
		this.creature.anchor.set(0.5);
		this.creature.x = this.app.screen.width / 2;
		this.creature.y = this.app.screen.height / 2;
		this.app.stage.addChild(this.creature);
	}

	update(deltaTime: number) {
		this.creature.rotation += 0.01 * deltaTime;
	}
}
