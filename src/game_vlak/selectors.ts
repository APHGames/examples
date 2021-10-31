import { GameData } from './model/game-structs';
import * as ECS from '../../libs/pixi-ecs';
import { GameState } from './model/state-structs';
import { Attributes } from './constants';

export class Selectors {
	static gameStateSelector = (scene: ECS.Scene) => scene.getGlobalAttribute<GameState>(Attributes.GAME_STATE);
	static gameDataSelector = (scene: ECS.Scene) => scene.getGlobalAttribute<GameData>(Attributes.GAME_DATA);
}