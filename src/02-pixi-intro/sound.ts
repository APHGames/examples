import * as PIXI from 'pixi.js';
import { sound as PIXISound } from '@pixi/sound';
import { PIXIExample, getBaseUrl } from '../utils/APHExample';
import { loadTexture } from '../utils/assets';

export class Sound extends PIXIExample {

	sonic: PIXI.Sprite;

	async load() {
		const texture = await loadTexture(`${getBaseUrl()}/assets/02-pixi-intro/sonic.png`);
		this.sonic = new PIXI.Sprite(texture);
		this.sonic.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
		this.sonic.anchor.set(0.5);

		this.sonic.eventMode = 'static';
		this.sonic.cursor = 'pointer';

		PIXISound.add('sound', `${getBaseUrl()}/assets/02-pixi-intro/sound.mp3`);

		this.sonic.on('pointerdown', () => {
			PIXISound.play('sound');
		});
		this.app.stage.addChild(this.sonic);
	}

	update() {
		// no-op
	}
}
