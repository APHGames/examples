import * as ECS from 'colfio';
import { Assets } from 'pixi.js';
import { ECSExample, getBaseUrl } from '../utils/APHExample';

export class BitmapText extends ECSExample {

	async load() {
		await Assets.load(`${getBaseUrl()}/assets/02-pixi-intro/bitmap-font/jupiter.fnt`);
		const text = new ECS.BitmapText('test', 'hello world', 'Jupiter Crash BRK', 80, 0xFF0000);
		text.position.set(this.engine.app.screen.width / 2, this.engine.app.screen.height / 2);
		text.anchor.set(0.5);
		text.addComponent(new ECS.FuncComponent('').doOnUpdate(() => text.rotation += 0.1));
		this.engine.scene.stage.addChild(text);
	}
}
