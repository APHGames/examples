import * as PIXI from 'pixi.js';
import { PIXIExample, getBaseUrl } from '../utils/APHExample';
import { loadAssets, getLoadedAsset } from '../utils/assets';

const ANIM_URL = `${getBaseUrl()}/assets/02-pixi-intro/warrior/warrior.json`;
const ANIM_ALIAS = 'warrior-sheet';

export class Animation extends PIXIExample {

	async load() {
		await loadAssets([{ alias: ANIM_ALIAS, src: ANIM_URL }]);
		const sheet = getLoadedAsset<PIXI.Spritesheet>(ANIM_ALIAS);
		const animation = new PIXI.AnimatedSprite(sheet.animations['warrior']);
		animation.animationSpeed = 0.167;
		animation.loop = true;
		animation.play();
		animation.scale.set(0.5);
		animation.position.set(this.app.screen.width / 2, this.app.screen.height / 2);
		animation.anchor.set(0.5);
		this.app.stage.addChild(animation);
	}

	update(deltaTime: number) {
		// no-op
	}
}
