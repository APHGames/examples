import * as ECS from 'colfio';
import { Assets } from './constants';
import { Factory } from './factory';
import { ECSExample, getBaseUrl } from '../../utils/APHExample';
import LevelParser from './level-parser';
import { loadAssets, loadTextAsset } from '../../utils/assets';

export class BlockBreaker extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: 640 * 2,
			height: 400 * 2,
			resolution: 640 * 2 / 16
		});
	}

	async load() {
		await loadAssets([
			{ alias: Assets.SPRITESHEET, src: `${getBaseUrl()}/assets/games/blockbreaker/spritesheet.png` },
		]);
		const levelsStr = await loadTextAsset(Assets.LEVELS, `${getBaseUrl()}/assets/games/blockbreaker/levels.txt`);
		this.loadGame(levelsStr);
	}


	loadGame(levelsStr: string) {
		const parser = new LevelParser();
		const levels = parser.parse(levelsStr);
		const factory = new Factory();
		factory.loadLevel(levels[0], this.engine.scene);
	}
}
