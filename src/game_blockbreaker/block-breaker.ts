import * as PIXI from 'pixi.js';
import PIXISound from 'pixi-sound';
import * as ECS from '../../libs/pixi-ecs';
import { Assets } from './constants';
import { Factory } from './factory';
import { ECSExample, getBaseUrl } from '../utils/APHExample';
import LevelParser from './level-parser';
export class BlockBreaker extends ECSExample {

	constructor(config: ECS.EngineConfig = {}) {
		super({
			...config,
			width: 640 * 2,
			height: 400 * 2,
			resolution: 640 * 2 / 16
		});
	}

	load() {

		this.engine.app.loader
			.reset()
			.add(Assets.SPRITESHEET, `${getBaseUrl()}/assets/game_blockbreaker/spritesheet.png`)
			.add(Assets.LEVELS, `${getBaseUrl()}/assets/game_blockbreaker/levels.txt`)
			.load(() => this.loadGame());
	}


	loadGame() {
		const levelsStr = this.engine.app.loader.resources[Assets.LEVELS].data;
	    const parser = new LevelParser();
	    const levels = parser.parse(levelsStr);
	    const factory = new Factory();
	    factory.loadLevel(levels[0], this.engine.scene);
	}
}