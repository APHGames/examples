import { GameData } from './../model/game-structs';
import { Assets, Attributes } from '../constants';
import * as ECS from '../../../libs/pixi-ecs';
import LevelParser from './level-parser';
import { GameState } from '../model/state-structs';
import { LevelFactory } from './level-factory';
import { getBaseUrl } from '../../utils/APHExample';
import PIXISound from 'pixi-sound';

/**
 * Game loader, loads assets, parses levels, and executes the intro animation
 */
export class GameLoader {
	loadGame(engine: ECS.Engine) {
		engine.app.loader
			.reset()
			.add(`${getBaseUrl()}/assets/game_vlak/pcsenior.fnt`)
			.add(Assets.SPRITESHEET, `${getBaseUrl()}/assets/game_vlak/spritesheet.png`)
			.add(Assets.LEVELS, `${getBaseUrl()}/assets/game_vlak/levels.txt`)
			.add(Assets.SOUND_CRASH, `${getBaseUrl()}/assets/game_vlak/sounds/crash.wav`)
			.add(Assets.SOUND_LEVEL_COMPLETD, `${getBaseUrl()}/assets/game_vlak/sounds/level_completed.wav`)
			.add(Assets.SOUND_PICK, `${getBaseUrl()}/assets/game_vlak/sounds/pick.wav`)
			.add(Assets.SOUND_MOVE, `${getBaseUrl()}/assets/game_vlak/sounds/move.wav`)
			.load(() => this.onAssetsLoaded(engine));

		// todo refactor this
		PIXISound.add(Assets.SOUND_CRASH, `${getBaseUrl()}/assets/game_vlak/sounds/crash.wav`);
		PIXISound.add(Assets.SOUND_LEVEL_COMPLETD, `${getBaseUrl()}/assets/game_vlak/sounds/level_completed.wav`);
		PIXISound.add(Assets.SOUND_PICK, `${getBaseUrl()}/assets/game_vlak/sounds/pick.wav`);
		PIXISound.add(Assets.SOUND_MOVE, `${getBaseUrl()}/assets/game_vlak/sounds/move.wav`);
	}

	private onAssetsLoaded(engine: ECS.Engine) {
		const levelsStr = engine.app.loader.resources[Assets.LEVELS].data;
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