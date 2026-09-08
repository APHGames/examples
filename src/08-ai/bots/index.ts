import * as ECS from 'colfio';
import { Assets } from './constants';
import { BotFactory } from './bot-factory';
import { GameModel } from './model';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import { loadAssets } from '../../utils/assets';

export class Bots extends ECSExample {
	engine: ECS.Engine;

	async load() {
		await loadAssets([{ alias: Assets.TEXTURE, src: `${getBaseUrl()}/assets/08-ai/spritesheet.png` }]);
		this.onAssetsLoaded();
	}

	onAssetsLoaded() {
		let factory = new BotFactory();
		factory.initializeGame(this.engine.scene.stage, new GameModel());
	}
}
