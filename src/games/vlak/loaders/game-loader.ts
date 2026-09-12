import { GameData } from './../model/game-structs';
import { Assets, Attributes } from '../constants';
import * as ECS from 'colfio';
import LevelParser from './level-parser';
import { GameState } from '../model/state-structs';
import { LevelFactory } from './level-factory';
import { getBaseUrl } from '../../../utils/APHExample';
import { sound as PIXISound } from '@pixi/sound';
import { loadAssets, loadTextAsset, getLoadedTexture } from '../../../utils/assets';
import { Assets as PixiAssets } from 'pixi.js';

/**
 * Game loader, loads assets, parses levels, and executes the intro animation
 */
export class GameLoader {
	async loadGame(engine: ECS.Engine) {
		await loadAssets([
			{ alias: Assets.SPRITESHEET, src: `${getBaseUrl()}/assets/games/vlak/spritesheet.png` },
		]);
		await PixiAssets.load(`${getBaseUrl()}/assets/games/vlak/pcsenior.fnt`);
		const levelsStr = await loadTextAsset(Assets.LEVELS, `${getBaseUrl()}/assets/games/vlak/levels.txt`);
		getLoadedTexture(Assets.SPRITESHEET).source.scaleMode = 'nearest';

		// todo refactor this
		PIXISound.add(Assets.SOUND_CRASH, `${getBaseUrl()}/assets/games/vlak/sounds/crash.wav`);
		PIXISound.add(Assets.SOUND_LEVEL_COMPLETD, `${getBaseUrl()}/assets/games/vlak/sounds/level_completed.wav`);
		PIXISound.add(Assets.SOUND_PICK, `${getBaseUrl()}/assets/games/vlak/sounds/pick.wav`);
		PIXISound.add(Assets.SOUND_MOVE, `${getBaseUrl()}/assets/games/vlak/sounds/move.wav`);

		this.onAssetsLoaded(engine, levelsStr);
	}

	private onAssetsLoaded(engine: ECS.Engine, levelsStr: string) {
		const parser = new LevelParser();
		const levels = parser.parseLevels(levelsStr);
		// separate intro from other levels
		const intro = levels.find(lvl => lvl.name === 'intro');

		const gameData: GameData = {
			levels: levels.filter(lvl => lvl.name !== 'intro'),
			intro,
		};
		engine.scene.assignGlobalAttribute(Attributes.GAME_DATA, gameData);
		engine.scene.assignGlobalAttribute(Attributes.GAME_STATE, new GameState(engine.scene, gameData));
		LevelFactory.loadIntro(engine.scene);
	}
}
